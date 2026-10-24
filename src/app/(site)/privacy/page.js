import LegalPage, { entity } from "@/components/layout/LegalPage";
import { site } from "@/config/site";

export const metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" crumb="Privacy">
      <p>This policy explains how {entity()} collects and uses personal data when you use {site.url}.</p>

      <h2>What we collect</h2>
      <ul>
        <li>Contact details you provide: name, mobile number and email address.</li>
        <li>Event details: dates, venues, pickup addresses, stops, passenger numbers and notes.</li>
        <li>Payment records: amounts, status and gateway references. We do not store card or bank details — these are handled by our payment partner.</li>
        <li>Account details if you register: name, email and a securely hashed password.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To calculate estimates, including sending addresses to our mapping provider to compute driving routes.</li>
        <li>To process booking requests, confirm availability, take payments and send booking updates by email or WhatsApp.</li>
        <li>To meet legal and accounting obligations.</li>
      </ul>

      <h2>Service providers</h2>
      <p>We share only the data needed with: [hosting provider], Google Maps Platform (route calculation), Razorpay (payments), [email provider] and Meta WhatsApp Business (messages), where enabled.</p>

      <h2>Retention</h2>
      <p>[State how long booking and payment records are kept.]</p>

      <h2>Your rights</h2>
      <p>You may request access to, correction of or deletion of your personal data, subject to legal retention requirements. Contact: [privacy contact email]. [Add grievance officer details as required under applicable Indian law.]</p>

      <h2>Cookies</h2>
      <p>We use a strictly necessary cookie to keep you signed in. We do not use advertising cookies. [Update if analytics are added.]</p>
    </LegalPage>
  );
}
