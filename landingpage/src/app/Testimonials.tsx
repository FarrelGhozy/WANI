import { useRef } from "react";
import { useFadeUp, useStagger } from "./hooks.ts";
import { TESTIMONIALS } from "./data.ts";
import StarRating from "./StarRating.tsx";

export default function Testimonials() {
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useFadeUp(headingRef);
  useStagger(cardsRef, ".testi-card", 0.15);

  return (
    <section id="testimoni" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div ref={headingRef} className="mb-16 text-center" style={{ opacity: 0 }}>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-teal-600">Testimoni</p>
          <h2 className="text-3xl font-bold text-stone-900 lg:text-4xl" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Cerita nyata dari <span className="italic text-teal-600">pelanggan kami</span>
          </h2>
        </div>

        <div ref={cardsRef} className="grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="testi-card flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-7 shadow-sm transition-shadow hover:shadow-md"
              style={{ opacity: 0 }}
            >
              <div>
                <StarRating count={t.rating} />
                <p className="mt-4 leading-relaxed text-stone-600">"{t.quote}"</p>
              </div>
              <div className="mt-6 flex items-center gap-3 border-t border-stone-100 pt-5">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-800">{t.name}</p>
                  <p className="text-xs text-stone-400">{t.role} · {t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
