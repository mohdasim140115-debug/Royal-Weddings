import LegalPage from "@/components/layout/LegalPage";

export const metadata = { title: "Cancellation Policy", alternates: { canonical: "/cancellation-policy" } };

export default function CancellationPolicyPage() {
  return (
    <LegalPage title="Cancellation Policy" crumb="Cancellation Policy">
      <p>You can request a cancellation or reschedule from your booking page or by contacting us. Changes take effect only once we confirm them.</p>

      <h2>Booking requests</h2>
      <p>Requests that have not been confirmed can be withdrawn at any time at no charge. Any advance paid on an unconfirmed request is refunded in full.</p>

      <h2>Confirmed bookings</h2>
      <ul>
        <li>More than [X] days before the event: [refund percentage] of the amount paid.</li>
        <li>Between [X] and [Y] days before the event: [refund percentage].</li>
        <li>Less than [Y] days before the event: [refund percentage / non-refundable].</li>
      </ul>

      <h2>Rescheduling</h2>
      <p>Rescheduling is subject to availability of the same car and crew on the new date. [State whether a fee applies and how many reschedules are allowed.]</p>

      <h2>Cancellations by us</h2>
      <p>If we are unable to provide a confirmed service, we will offer a comparable alternative or a full refund of amounts paid for that service.</p>

      <h2>Refund timelines</h2>
      <p>Approved refunds are initiated within [N] working days to the original payment method. Bank processing times may vary.</p>
    </LegalPage>
  );
}
