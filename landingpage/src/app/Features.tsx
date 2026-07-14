import { useRef } from "react";
import { useFadeUp, useStagger } from "./hooks.ts";
import { FEATURES } from "./data.ts";

export default function Features() {
  const headingRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useFadeUp(headingRef);
  useStagger(gridRef, ".feature-card", 0.08);

  return (
    <section id="fitur" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div ref={headingRef} className="mb-16 text-center" style={{ opacity: 0 }}>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-teal-600">Fitur Unggulan</p>
          <h2 className="text-3xl font-bold text-stone-900 lg:text-4xl" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Semua yang kamu butuhkan <span className="italic text-teal-600">ada di sini</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-stone-500">
            WANI bukan sekadar auto-reply. Ini asisten bisnis lengkap yang bekerja di dalam WhatsApp yang sudah kamu pakai sehari-hari.
          </p>
        </div>

        <div ref={gridRef} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="feature-card group rounded-2xl border border-stone-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg hover:shadow-teal-50"
              style={{ opacity: 0 }}
            >
              <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
                <Icon size={20} />
              </div>
              <h3 className="mb-2 font-semibold text-stone-900">{title}</h3>
              <p className="text-sm leading-relaxed text-stone-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
