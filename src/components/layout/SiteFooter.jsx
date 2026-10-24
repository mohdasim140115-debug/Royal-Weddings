import Link from "next/link";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { site, footerNavigation, whatsappLink } from "@/config/site";
import Logo from "./Logo";

function Column({ title, links }) {
  return (
    <div>
      <h2 className="eyebrow font-sans text-champagne">{title}</h2>
      <ul className="mt-5 space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-ivory/70 transition-colors hover:text-ivory">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SiteFooter({ hasDemoData = false }) {
  const { contact, social } = site;
  const wa = whatsappLink(`Hello ${site.name}, I'd like to enquire about a wedding booking.`);
  const socials = Object.entries(social).filter(([, url]) => url);

  return (
    <footer className="bg-ink text-ivory">
      <div className="container-x grid gap-10 py-14 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo light />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-ivory/65">{site.description}</p>
          <ul className="mt-8 space-y-3 text-sm text-ivory/80">
            {contact.phone && (
              <li className="flex items-center gap-3">
                <Phone className="size-4 text-champagne" aria-hidden="true" />
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="hover:text-ivory">{contact.phone}</a>
              </li>
            )}
            {contact.email && (
              <li className="flex items-center gap-3">
                <Mail className="size-4 text-champagne" aria-hidden="true" />
                <a href={`mailto:${contact.email}`} className="hover:text-ivory">{contact.email}</a>
              </li>
            )}
            {contact.address && (
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 text-champagne" aria-hidden="true" />
                <span>{contact.address}</span>
              </li>
            )}
            {wa && (
              <li className="flex items-center gap-3">
                <MessageCircle className="size-4 text-champagne" aria-hidden="true" />
                <a href={wa} target="_blank" rel="noopener noreferrer" className="hover:text-ivory">WhatsApp us</a>
              </li>
            )}
            {!contact.phone && !contact.email && (
              <li>
                <Link href="/contact" className="underline decoration-champagne/60 underline-offset-4 hover:text-ivory">
                  Send us an enquiry
                </Link>
              </li>
            )}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-8">
          <Column title="Services" links={footerNavigation.services} />
          <Column title="Company" links={footerNavigation.company} />
          <Column title="Policies" links={footerNavigation.legal} />
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <div className="container-x flex flex-col gap-4 py-7 text-xs text-ivory/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.legal.entityName || site.name}. All rights reserved.
          </p>
          {hasDemoData && <p className="text-ivory/60">Preview: sample cars, prices and imagery are shown for demonstration.</p>}
          {socials.length > 0 && (
            <ul className="flex gap-5">
              {socials.map(([name, url]) => (
                <li key={name}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="capitalize hover:text-ivory">
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}
