import "server-only";
import { prisma } from "./db.js";
import { site } from "@/config/site";
import { formatINR, formatDate } from "./format.js";
import { bookingAccessToken } from "./auth.js";

// Notification layer. Each channel is optional: when credentials are not
// configured the message is logged with status SKIPPED (visible in admin)
// instead of pretending it was sent. Failures never break a booking.

export const channels = {
  email: () => Boolean(process.env.EMAIL_PROVIDER_API_KEY && process.env.EMAIL_FROM),
  whatsapp: () => Boolean(process.env.WHATSAPP_PROVIDER_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
};

function bookingUrl(b) {
  return `${site.url}/bookings/${b.reference}?t=${bookingAccessToken(b.reference)}`;
}

const TEMPLATES = {
  BOOKING_RECEIVED: (b) => ({
    subject: `We've received your booking request ${b.reference}`,
    text: `Dear ${b.customerName},\n\nThank you for your booking request with ${site.name}. Your reference is ${b.reference} for ${formatDate(b.eventDate)}.\n\nEstimated total: ${b.total ? formatINR(b.total) : "to be quoted"}.\nThis is a request, not yet a confirmed reservation. We will check availability and confirm with you shortly.\n\nView your booking: ${bookingUrl(b)}\n\n— ${site.name}`,
  }),
  BOOKING_CONFIRMED: (b) => ({
    subject: `Your booking ${b.reference} is confirmed`,
    text: `Dear ${b.customerName},\n\nGood news — your booking ${b.reference} for ${formatDate(b.eventDate)} is confirmed.\n\nTotal: ${formatINR(b.total)} · Paid: ${formatINR(b.amountPaid)}\n\nDetails: ${bookingUrl(b)}\n\n— ${site.name}`,
  }),
  PAYMENT_RECEIVED: (b, extra) => ({
    subject: `Payment received for ${b.reference}`,
    text: `Dear ${b.customerName},\n\nWe have received ${formatINR(extra?.amount)} for booking ${b.reference}. Balance remaining: ${formatINR(Math.max(0, b.total - b.amountPaid))}.\n\nReceipt: ${bookingUrl(b)}\n\n— ${site.name}`,
  }),
  BOOKING_RESCHEDULED: (b) => ({
    subject: `Booking ${b.reference} has been rescheduled`,
    text: `Dear ${b.customerName},\n\nYour booking ${b.reference} is now scheduled for ${formatDate(b.eventDate)}.\n\nDetails: ${bookingUrl(b)}\n\n— ${site.name}`,
  }),
  BOOKING_CANCELLED: (b) => ({
    subject: `Booking ${b.reference} has been cancelled`,
    text: `Dear ${b.customerName},\n\nYour booking ${b.reference} has been cancelled. Any refund due will be processed as per our cancellation policy.\n\nDetails: ${bookingUrl(b)}\n\n— ${site.name}`,
  }),
  EVENT_REMINDER: (b) => ({
    subject: `Reminder: your event on ${formatDate(b.eventDate)}`,
    text: `Dear ${b.customerName},\n\nA friendly reminder that your booking ${b.reference} is on ${formatDate(b.eventDate)}. Reply to this message if anything has changed.\n\nDetails: ${bookingUrl(b)}\n\n— ${site.name}`,
  }),
};

async function log(entry) {
  try {
    await prisma.notificationLog.create({ data: entry });
  } catch (e) {
    console.error("[notify] log failed", e);
  }
}

async function sendEmail(to, subject, text) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.EMAIL_PROVIDER_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, text }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Email provider responded ${res.status}`);
}

// Note: WhatsApp Cloud API only delivers free-form text inside a 24-hour
// customer-initiated window. For business-initiated messages, register
// approved templates and switch this call to type "template".
async function sendWhatsApp(to, text) {
  const res = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_PROVIDER_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: to.replace(/\D/g, ""), type: "text", text: { body: text.slice(0, 4000) } }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`WhatsApp provider responded ${res.status}`);
}

/** Sends a booking notification on every channel; never throws. */
export async function notifyBooking(template, booking, extra) {
  const tpl = TEMPLATES[template];
  if (!tpl) return;
  const { subject, text } = tpl(booking, extra);

  const jobs = [
    { channel: "EMAIL", recipient: booking.email, enabled: channels.email(), send: () => sendEmail(booking.email, subject, text) },
    { channel: "WHATSAPP", recipient: booking.phone, enabled: channels.whatsapp(), send: () => sendWhatsApp(booking.phone, text) },
  ];

  if (template === "BOOKING_RECEIVED" && process.env.EMAIL_ADMIN_TO) {
    jobs.push({
      channel: "EMAIL",
      recipient: process.env.EMAIL_ADMIN_TO,
      enabled: channels.email(),
      send: () => sendEmail(process.env.EMAIL_ADMIN_TO, `New booking request ${booking.reference}`, `New ${booking.serviceType} request from ${booking.customerName} (${booking.phone}) for ${formatDate(booking.eventDate)}.\n${site.url}/admin/bookings/${booking.id}`),
    });
  }

  await Promise.all(
    jobs.map(async (j) => {
      if (!j.enabled) return log({ bookingId: booking.id, channel: j.channel, template, recipient: j.recipient, status: "SKIPPED", error: "Provider not configured" });
      try {
        await j.send();
        await log({ bookingId: booking.id, channel: j.channel, template, recipient: j.recipient, status: "SENT" });
      } catch (e) {
        console.error(`[notify] ${j.channel} failed`, e.message);
        await log({ bookingId: booking.id, channel: j.channel, template, recipient: j.recipient, status: "FAILED", error: String(e.message).slice(0, 300) });
      }
    })
  );
}
