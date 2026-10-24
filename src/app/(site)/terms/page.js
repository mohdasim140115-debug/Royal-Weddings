import LegalPage, { entity } from "@/components/layout/LegalPage";
import { site, PRICE_DISCLAIMER } from "@/config/site";

export const metadata = { title: "Terms of Service", alternates: { canonical: "/terms" } };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" crumb="Terms">
      <p>These terms govern bookings made with {entity()} (“we”, “us”) through {site.url}.</p>

      <h2>1. Booking requests</h2>
      <p>Submitting a form creates a booking request with a reference number. A request becomes a confirmed booking only when we confirm availability and the final quote with you in writing, and any agreed advance has been received.</p>

      <h2>2. Estimates and pricing</h2>
      <p>{PRICE_DISCLAIMER}</p>
      <ul>
        <li>Vehicle charges follow the published rate for the car: base fare with included kilometres and hours, plus extra kilometres and hours beyond those allowances, subject to any minimum fare.</li>
        <li>Tolls, parking, state permits and venue entry fees are payable at actuals unless stated otherwise.</li>
        <li>Taxes are charged as applicable at the time of invoicing.</li>
      </ul>

      <h2>3. Vehicle use</h2>
      <ul>
        <li>Cars are provided with a chauffeur. Passenger numbers may not exceed the stated seating capacity.</li>
        <li>Decoration is applied by our team; customers may not attach items that could damage the vehicle. [Describe damage liability.]</li>
        <li>Delays caused by traffic, weather or events outside our control are not grounds for compensation. [Confirm.]</li>
      </ul>

      <h2>4. Photography and films</h2>
      <ul>
        <li>Delivery timelines are estimates from the event date and may vary during peak season.</li>
        <li>Drone coverage depends on venue permission and applicable regulations.</li>
        <li>[State copyright and usage rights for photographs and films.]</li>
      </ul>

      <h2>5. Payments</h2>
      <p>Online payments are processed by our payment partner. A payment is recorded only after it is verified with the payment gateway. [State advance percentage, balance due date and accepted methods.]</p>

      <h2>6. Changes and cancellations</h2>
      <p>Please see our cancellation policy.</p>

      <h2>7. Liability</h2>
      <p>[Limitation of liability clause — to be drafted by a legal professional.]</p>

      <h2>8. Governing law</h2>
      <p>These terms are governed by the laws of India. Jurisdiction: {site.legal.jurisdiction || "[courts of city, state]"}.</p>
    </LegalPage>
  );
}
