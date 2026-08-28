import { useRef } from "react";
import { useFadeUp, useStagger } from "./hooks.ts";
import { STEPS } from "./data.ts";

export default function HowItWorks() {
  const headingRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  useFadeUp(headingRef);
  useStagger(stepsRef, ".step-item", 0.2);

  return (
    <section id="cara-kerja" className="scroll-mt-20 bg-[#f7f8f6] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div
          ref={headingRef}
          className="mb-12 max-w-2xl sm:mb-14"
          style={{ opacity: 0 }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
            Cara Kerja
          </p>
          <h2
            className="text-3xl font-semibold leading-tight text-stone-950 sm:text-4xl"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Mulai dalam{" "}
            <span className="italic text-teal-600">tiga langkah</span>
          </h2>
          <p className="mt-4 max-w-xl leading-7 text-stone-500">
            Tidak perlu coding atau proses setup yang rumit. Sambungkan toko,
            sesuaikan informasi bisnis, lalu WANI siap bekerja.
          </p>
        </div>

        <div
          ref={stepsRef}
          className="grid gap-4 lg:grid-cols-3"
        >
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className="step-item relative rounded-2xl border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:p-7"
              style={{ opacity: 0 }}
            >
              <div className="mb-8 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-xs font-bold text-white">
                  {step.num}
                </div>
                {i < STEPS.length - 1 && (
                  <span className="hidden text-xl text-stone-300 lg:block" aria-hidden="true">→</span>
                )}
              </div>

              <div>
                <h3
                  className="text-xl font-semibold text-stone-950"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-stone-500">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
