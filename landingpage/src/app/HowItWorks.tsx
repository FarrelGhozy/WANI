import { useRef } from "react";
import { useFadeUp, useStagger } from "./hooks.ts";
import { STEPS } from "./data.ts";

export default function HowItWorks() {
  const headingRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  useFadeUp(headingRef);
  useStagger(stepsRef, ".step-item", 0.2);

  return (
    <section id="cara-kerja" className="bg-[#fafaf9] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div ref={headingRef} className="mb-16 text-center" style={{ opacity: 0 }}>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-teal-600">Cara Kerja</p>
          <h2 className="text-3xl font-bold text-stone-900 lg:text-4xl" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Mulai dalam <span className="italic text-teal-600">tiga langkah</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-stone-500">
            Nggak perlu coding, nggak perlu keahlian teknis. WANI dirancang untuk pemilik UMKM yang sibuk.
          </p>
        </div>

        <div ref={stepsRef} className="relative mx-auto max-w-2xl flex flex-col gap-0">
          {STEPS.map((step, i) => (
            <div key={step.num} className="step-item relative flex gap-6" style={{ opacity: 0 }}>
              <div className="flex flex-col items-center">
                <div className="z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-teal-200 bg-teal-600 text-sm font-bold text-white shadow-md shadow-teal-200/60">
                  {step.num}
                </div>
                {i < STEPS.length - 1 && (
                  <div className="mt-2 w-px flex-1 bg-gradient-to-b from-teal-300 to-teal-100" style={{ minHeight: 60 }} />
                )}
              </div>

              <div className={`pb-12 ${i === STEPS.length - 1 ? "pb-0" : ""}`}>
                <h3 className="text-xl font-bold text-stone-900" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  {step.title}
                </h3>
                <p className="mt-2 leading-relaxed text-stone-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
