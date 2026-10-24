"use client";

import Image from "next/image";
import { useState } from "react";
import CarImage from "@/components/ui/CarImage";

export default function CarGallery({ images, name }) {
  const [active, setActive] = useState(0);
  const current = images[active];
  // Credits are stored as "Photo: Author · Licence · Source — https://…"
  const [creditText, creditUrl] = (current?.credit || "").split(" — ");

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden bg-sand lg:aspect-[16/11]">
        <CarImage image={current} name={name} priority sizes="(min-width: 1024px) 60vw, 100vw" />
      </div>
      {creditText && (
        <p className="mt-2 text-[0.7rem] text-stone">
          {creditUrl ? (
            <a href={creditUrl} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
              {creditText}
            </a>
          ) : (
            creditText
          )}
        </p>
      )}
      {images.length > 1 && (
        <div className="mt-3 flex gap-3" role="group" aria-label="Choose photo">
          {images.map((img, i) => (
            <button
              key={img.id || img.url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1} of ${images.length}`}
              aria-pressed={i === active}
              className="relative aspect-[4/3] w-24 overflow-hidden border-2 border-transparent opacity-70 transition aria-pressed:border-champagne aria-pressed:opacity-100 hover:opacity-100 sm:w-32"
            >
              <Image src={img.url} alt="" fill sizes="128px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
