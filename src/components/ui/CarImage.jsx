import Image from "next/image";
import { Car } from "lucide-react";

/** Car photo, or an elegant placeholder when no photograph has been added yet. */
export default function CarImage({ image, name, sizes, priority = false, className = "" }) {
  if (image?.url) {
    return <Image src={image.url} alt={image.alt || name} fill sizes={sizes} priority={priority} className={`object-cover ${className}`} />;
  }
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_50%_40%,#f7f4ee,#e9e3d8)] text-stone"
      role="img"
      aria-label={`${name} — photograph to be added`}
    >
      <Car className="size-10 text-champagne-deep/70" strokeWidth={1} aria-hidden="true" />
      <span className="px-4 text-center font-display text-xl text-charcoal">{name}</span>
      <span className="eyebrow text-[0.6rem] text-stone">Photograph to be added</span>
    </div>
  );
}
