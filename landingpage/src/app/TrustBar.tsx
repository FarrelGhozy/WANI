import { useRef } from "react";
import { useFadeUp, useStagger } from "./hooks.ts";
import { TRUST_STATS } from "./data.ts";

export default function TrustBar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useFadeUp(containerRef as React.RefObject<HTMLElement | null>);
  useStagger(
    statsRef as React.RefObject<HTMLElement | null>,
    ".stat-item",
    0.12
  );

  return (
    <section className="border-y border-stone-200/80 bg-white py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div
          ref={containerRef}
          className="grid gap-8 lg:grid-cols-[0.75fr_2fr] lg:items-center"
          style={{ opacity: 0 }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
              Dipercaya UMKM
            </p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-stone-500">
              Membantu bisnis di seluruh Indonesia melayani pelanggan lebih konsisten.
            </p>
          </div>
          <div ref={statsRef} className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-4">
            {TRUST_STATS.map(({ value, label }) => (
              <div
                key={label}
                className="stat-item border-l border-stone-200 pl-4 sm:pl-6"
                style={{ opacity: 0 }}
              >
                <p
                  className="text-2xl font-semibold text-stone-950 sm:text-3xl"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  {value}
                </p>
                <p className="mt-1 text-xs text-stone-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
