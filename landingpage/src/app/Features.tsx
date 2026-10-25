import { useRef } from "react";
import { useFadeUp, useStagger } from "./hooks.ts";
import { FEATURES } from "./data.ts";

export default function Features() {
  const headingRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useFadeUp(headingRef);
  useStagger(gridRef, ".feature-card", 0.08);

  return (
    <section id="fitur" className="scroll-mt-20 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div
          ref={headingRef}
          className="mb-12 grid gap-5 lg:grid-cols-[0.85fr_1fr] lg:items-end"
          style={{ opacity: 0 }}
        >
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
              Fitur Unggulan
            </p>
            <h2
              className="text-3xl font-semibold leading-tight text-stone-950 sm:text-4xl"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Satu asisten untuk{" "}
              <span className="italic text-teal-700">banyak pekerjaan.</span>
            </h2>
          </div>
          <p className="max-w-xl leading-7 text-stone-500 lg:justify-self-end">
            WANI bukan sekadar auto-reply. Ini asisten bisnis lengkap yang
            bekerja di dalam WhatsApp yang sudah kamu pakai sehari-hari.
          </p>
        </div>

        <div ref={gridRef} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="feature-card group rounded-2xl border border-stone-200 bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-[0_18px_45px_-28px_rgba(15,118,110,0.45)]"
              style={{ opacity: 0 }}
            >
              <div
                className={`mb-7 inline-flex h-11 w-11 items-center justify-center rounded-xl ${color}`}
              >
                <Icon size={20} />
              </div>
              <h3 className="mb-2 font-semibold text-stone-950">{title}</h3>
              <p className="text-sm leading-6 text-stone-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
