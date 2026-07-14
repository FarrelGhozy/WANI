import { useRef } from "react";
import { useFadeUp, useStagger } from "./hooks.ts";
import { TRUST_STATS } from "./data.ts";

export default function TrustBar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useFadeUp(containerRef as React.RefObject<HTMLElement | null>);
  useStagger(statsRef as React.RefObject<HTMLElement | null>, ".stat-item", 0.12);

  return (
    <section className="bg-[#fafaf9] py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div ref={containerRef} className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm" style={{ opacity: 0 }}>
          <p className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-stone-400">
            Dipercaya ribuan UMKM di seluruh Indonesia
          </p>
          <div ref={statsRef} className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {TRUST_STATS.map(({ value, label }) => (
              <div key={label} className="stat-item text-center" style={{ opacity: 0 }}>
                <p className="text-3xl font-bold text-teal-700" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  {value}
                </p>
                <p className="mt-1 text-sm text-stone-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
