import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import EnquiryForm from "@/components/cars/EnquiryForm";
import { site, whatsappLink } from "@/config/site";

export const metadata = {
  title: "Contact",
  description: `Contact ${site.name} about wedding cars, photography, films and complete wedding packages.`,
  alternates: { canonical: "/contact" },
};

function Detail({ icon: Icon, label, children }) {
  return (
    <li className="flex gap-4 border-b border-line py-5">
      <Icon className="mt-1 size-5 shrink-0 text-champagne-deep" strokeWidth={1.5} aria-hidden="true" />
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-stone">{label}</p>
        <div className="mt-1 text-base">{children}</div>
      </div>
    </li>
  );
}

export default function ContactPage() {
  const { contact } = site;
  const wa = whatsappLink(`Hello ${site.name}, I'd like to enquire about a wedding booking.`);
  const hasAny = contact.phone || contact.email || contact.address || wa;

  return (
    <>
      <PageHeader eyebrow="Contact" title="Let's plan your day" intro="Send us your dates and venues — we usually reply within one working day." crumbs={[{ label: "Contact" }]} />
      <section className="container-x grid gap-14 py-16 lg:grid-cols-12 lg:py-24">
        <div className="lg:col-span-4">
          <h2 className="text-3xl">Reach us</h2>
          <ul className="mt-4 border-t border-line">
            {contact.phone && (
              <Detail icon={Phone} label="Phone">
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="hover:text-champagne-deep">{contact.phone}</a>
              </Detail>
            )}
            {wa && (
              <Detail icon={MessageCircle} label="WhatsApp">
                <a href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-champagne-deep">Start a chat</a>
              </Detail>
            )}
            {contact.email && (
              <Detail icon={Mail} label="Email">
                <a href={`mailto:${contact.email}`} className="break-all hover:text-champagne-deep">{contact.email}</a>
              </Detail>
            )}
            {contact.address && <Detail icon={MapPin} label="Studio">{contact.address}</Detail>}
            {contact.hours && <Detail icon={Clock} label="Hours">{contact.hours}</Detail>}
          </ul>
          {!hasAny && (
            <p className="mt-6 text-sm leading-relaxed text-stone">
              Our phone, WhatsApp and studio details will be published here shortly. In the meantime, the enquiry form reaches our team directly.
            </p>
          )}
        </div>
        <div className="lg:col-span-7 lg:col-start-6">
          <h2 className="text-3xl">Send an enquiry</h2>
          <div className="mt-6">
            <EnquiryForm source="contact" />
          </div>
        </div>
      </section>
    </>
  );
}
