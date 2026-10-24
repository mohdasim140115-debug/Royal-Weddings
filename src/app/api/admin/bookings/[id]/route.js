import { after } from "next/server";
import { prisma } from "@/lib/db";
import { handler, json, error, readJson, HttpError } from "@/lib/http";
import { requireAdminApi } from "@/lib/auth";
import { notifyBooking } from "@/lib/notify";
import { audit } from "@/lib/audit";
import { parseDay, formatDate } from "@/lib/format";
import { clean, int } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Reserve a car for a day inside a transaction; the unique index makes double-booking impossible. */
async function reserveCar(tx, { carId, date, bookingId }) {
  const clash = await tx.carAvailability.findUnique({ where: { carId_date: { carId, date } } });
  if (clash && clash.bookingId !== bookingId) {
    const other = clash.bookingId ? await tx.booking.findUnique({ where: { id: clash.bookingId }, select: { reference: true } }) : null;
    throw new HttpError(
      other ? `This car is already reserved on ${formatDate(date)} by booking ${other.reference}.` : `This car is blocked on ${formatDate(date)}${clash.note ? ` (${clash.note})` : ""}.`,
      409
    );
  }
  if (!clash) {
    try {
      await tx.carAvailability.create({ data: { carId, date, status: "BOOKED", bookingId } });
    } catch (e) {
      if (e?.code === "P2002") throw new HttpError("This car was just reserved for the same date by another booking.", 409);
      throw e;
    }
  }
}

async function checkVendorCapacity(tx, { vendorId, date, bookingId }) {
  const vendor = await tx.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor || !vendor.isActive) throw new HttpError("Choose an active vendor.", 422);
  const blocked = await tx.vendorBlockedDate.findUnique({ where: { vendorId_date: { vendorId, date } } });
  if (blocked) throw new HttpError(`${vendor.name} is unavailable on ${formatDate(date)}.`, 409);
  const load = await tx.booking.count({ where: { assignedVendorId: vendorId, eventDate: date, status: "CONFIRMED", NOT: { id: bookingId } } });
  if (load >= vendor.crewCapacity) throw new HttpError(`${vendor.name} is already at capacity (${vendor.crewCapacity}) on ${formatDate(date)}.`, 409);
}

const needsVehicle = (b) => b.serviceType === "CAR" || Boolean(b.pricingInputs?.car?.slug);

export const PATCH = handler(async (request, { params }) => {
  const user = await requireAdminApi();
  const { id } = await params;
  const body = await readJson(request);
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return error("Booking not found.", 404);

  const action = body.action;
  const note = (text) => [booking.internalNotes, `[${new Date().toISOString().slice(0, 16).replace("T", " ")} · ${user.name}] ${text}`].filter(Boolean).join("\n");
  let notifyTemplate = null;
  let updated;

  if (action === "confirm") {
    if (booking.status !== "PENDING") return error("Only pending requests can be confirmed.", 409);
    let carId = body.assignedCarId || booking.assignedCarId;
    if (!carId && needsVehicle(booking)) {
      const requested = await prisma.car.findUnique({ where: { slug: booking.pricingInputs.car.slug }, select: { id: true } });
      carId = requested?.id;
    }
    if (needsVehicle(booking) && !carId) return error("Assign a car before confirming.", 422);
    const vendorId = body.assignedVendorId || booking.assignedVendorId || null;

    updated = await prisma.$transaction(async (tx) => {
      if (carId) await reserveCar(tx, { carId, date: booking.eventDate, bookingId: id });
      if (vendorId) await checkVendorCapacity(tx, { vendorId, date: booking.eventDate, bookingId: id });
      return tx.booking.update({
        where: { id },
        data: { status: "CONFIRMED", assignedCarId: carId || null, assignedVendorId: vendorId, internalNotes: note("Confirmed booking.") },
      });
    });
    notifyTemplate = "BOOKING_CONFIRMED";
  } else if (action === "complete") {
    if (booking.status !== "CONFIRMED") return error("Only confirmed bookings can be completed.", 409);
    updated = await prisma.booking.update({ where: { id }, data: { status: "COMPLETED", internalNotes: note("Marked completed.") } });
  } else if (action === "cancel") {
    if (booking.status === "CANCELLED") return error("Already cancelled.", 409);
    updated = await prisma.$transaction(async (tx) => {
      await tx.carAvailability.deleteMany({ where: { bookingId: id } });
      return tx.booking.update({
        where: { id },
        data: { status: "CANCELLED", customerRequest: null, internalNotes: note(`Cancelled. ${clean(body.reason, 300)}`.trim()) },
      });
    });
    notifyTemplate = "BOOKING_CANCELLED";
  } else if (action === "reschedule") {
    const newDate = parseDay(body.newDate);
    if (!newDate) return error("Choose the new date.", 422);
    if (["CANCELLED", "COMPLETED"].includes(booking.status)) return error("This booking can no longer be rescheduled.", 409);
    updated = await prisma.$transaction(async (tx) => {
      const held = await tx.carAvailability.findFirst({ where: { bookingId: id } });
      if (held) {
        await tx.carAvailability.delete({ where: { id: held.id } });
        await reserveCar(tx, { carId: held.carId, date: newDate, bookingId: id });
      }
      if (booking.assignedVendorId && booking.status === "CONFIRMED") await checkVendorCapacity(tx, { vendorId: booking.assignedVendorId, date: newDate, bookingId: id });
      await tx.eventDetail.updateMany({ where: { bookingId: id, sortOrder: 0 }, data: { date: newDate } });
      return tx.booking.update({
        where: { id },
        data: { eventDate: newDate, customerRequest: null, internalNotes: note(`Rescheduled from ${formatDate(booking.eventDate)} to ${formatDate(newDate)}.`) },
      });
    });
    notifyTemplate = "BOOKING_RESCHEDULED";
  } else if (action === "update") {
    const data = {};
    const notes = [];
    if (typeof body.note === "string" && body.note.trim()) notes.push(clean(body.note, 1000));
    if (body.clearRequest) data.customerRequest = null;
    if (body.advanceApproved !== undefined) {
      data.advanceApproved = Boolean(body.advanceApproved);
      notes.push(`Advance ${data.advanceApproved ? "approved" : "withdrawn"}.`);
    }
    if (body.advanceAmount !== undefined) data.advanceAmount = int(body.advanceAmount, { max: 10_000_000 });
    if (body.total !== undefined) {
      const total = int(body.total, { max: 50_000_000 });
      if (total < booking.amountPaid) return error("The total cannot be lower than the amount already paid.", 422);
      if (total !== booking.total) {
        data.total = total;
        data.quoteRequired = false;
        data.lineItems = { create: { kind: "ADJUSTMENT", label: clean(body.adjustmentLabel, 120) || "Quote adjustment", amount: total - booking.total, sortOrder: 99 } };
        notes.push(`Quote updated from ₹${booking.total} to ₹${total}.`);
      }
    }
    if (body.assignedVendorId !== undefined) {
      data.assignedVendorId = body.assignedVendorId || null;
      if (data.assignedVendorId && booking.status === "CONFIRMED") await checkVendorCapacity(prisma, { vendorId: data.assignedVendorId, date: booking.eventDate, bookingId: id });
    }
    if (body.assignedCarId !== undefined) {
      const carId = body.assignedCarId || null;
      if (carId !== booking.assignedCarId) {
        data.assignedCarId = carId;
        if (booking.status === "CONFIRMED") {
          // Move the reservation atomically.
          updated = await prisma.$transaction(async (tx) => {
            await tx.carAvailability.deleteMany({ where: { bookingId: id } });
            if (carId) await reserveCar(tx, { carId, date: booking.eventDate, bookingId: id });
            return tx.booking.update({ where: { id }, data: { ...data, internalNotes: note([...notes, "Assigned car changed."].join(" ")) } });
          });
        }
      }
    }
    if (!updated) {
      if (notes.length) data.internalNotes = note(notes.join(" "));
      updated = await prisma.booking.update({ where: { id }, data });
    }
  } else {
    return error("Unknown action.", 422);
  }

  await audit(user.id, `BOOKING_${String(action).toUpperCase()}`, "Booking", id, body);
  if (notifyTemplate) after(() => notifyBooking(notifyTemplate, updated));
  return json({ ok: true, status: updated.status });
});
