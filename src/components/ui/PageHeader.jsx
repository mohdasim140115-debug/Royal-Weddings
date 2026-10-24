import Image from "next/image";
import Breadcrumbs from "./Breadcrumbs";

/** Editorial page header. With an image it becomes a cinematic dark hero. */
export default function PageHeader({ eyebrow, title, intro, crumbs = [], image, imageAlt = "", imagePosition = "center", children }) {
  if (image) {
    return (
      <header className="relative overflow-hidden bg-ink text-ivory">
        <div className="absolute inset-0">
          <Image src={image} alt={imageAlt} fill priority sizes="100vw" className="object-cover opacity-60" style={{ objectPosition: imagePosition }} />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/75 to-ink/10" />
        </div>
        <div className="container-x relative pb-12 pt-24 sm:pb-16 sm:pt-28">
          <Breadcrumbs items={crumbs} tone="dark" />
          {eyebrow && <p className="eyebrow mt-8 text-champagne">{eyebrow}</p>}
          <h1 className="mt-3 max-w-3xl text-[2.6rem] leading-[1.02] text-balance sm:text-5xl lg:text-[3.6rem]">{title}</h1>
          {intro && <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-ivory/75">{intro}</p>}
          {children}
        </div>
      </header>
    );
  }
  return (
    <header className="border-b border-line bg-sand">
      <div className="container-x pb-10 pt-24 sm:pb-12 sm:pt-28">
        <Breadcrumbs items={crumbs} />
        {eyebrow && <p className="eyebrow mt-6 text-champagne-deep">{eyebrow}</p>}
        <h1 className="mt-3 max-w-3xl text-[2.6rem] leading-[1.02] text-balance sm:text-5xl lg:text-[3.4rem]">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-stone">{intro}</p>}
        {children}
      </div>
    </header>
  );
}
