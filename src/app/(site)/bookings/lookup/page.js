import PageHeader from "@/components/ui/PageHeader";
import LookupForm from "@/components/booking/LookupForm";

export const metadata = {
  title: "Track a booking",
  description: "View the status of your booking request using your reference number and mobile number.",
  alternates: { canonical: "/bookings/lookup" },
};

export default function LookupPage() {
  return (
    <>
      <PageHeader eyebrow="Track a booking" title="Find your booking" intro="Enter the reference from your confirmation and the mobile number you used." crumbs={[{ label: "Track a booking" }]} />
      <section className="container-x py-16">
        <div className="max-w-lg">
          <LookupForm />
        </div>
      </section>
    </>
  );
}
