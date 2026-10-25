import { useState, useRef } from "react";
import { Link } from "react-router";
import { Check } from "lucide-react";
import { useFadeUp, useStagger } from "./hooks.ts";
import { PLANS, formatIDR } from "./data.ts";

export default function Pricing() {
  const [yearly, setYearly] = useState(false);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useFadeUp(headingRef);
  useStagger(cardsRef, ".price-card", 0.15);

  return (
    <section id="harga" className="scroll-mt-20 bg-[#f7f8f6] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div
          ref={headingRef}
          className="mb-12 text-center"
          style={{ opacity: 0 }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
            Harga
          </p>
          <h2
            className="text-3xl font-semibold text-stone-950 sm:text-4xl"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Pilih paket yang{" "}
            <span className="italic text-teal-600">sesuai bisnismu</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-stone-500">
            Mulai gratis 14 hari. Tanpa kartu kredit. Batalkan kapan saja.
          </p>

          <div className="mt-8 inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setYearly(false)}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${!yearly ? "bg-teal-700 text-white shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${yearly ? "bg-teal-700 text-white shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
            >
              Tahunan
              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                Hemat 20%
              </span>
            </button>
          </div>
        </div>

        <div ref={cardsRef} className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`price-card relative flex flex-col rounded-2xl p-7 transition-all sm:p-8 ${
                plan.highlight
                  ? "border-2 border-teal-600 bg-white shadow-[0_24px_60px_-35px_rgba(15,118,110,0.55)]"
                  : "border border-stone-200 bg-white hover:border-stone-300 hover:shadow-md"
              }`}
              style={{ opacity: 0 }}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-lg bg-teal-700 px-4 py-1.5 text-[10px] font-bold tracking-wide text-white shadow">
                  PALING POPULER
                </div>
              )}
              <div className="mb-6">
                <h3
                  className="text-xl font-bold text-stone-900"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-stone-500">{plan.desc}</p>
              </div>

              <div className="mb-8">
                {plan.monthlyPrice ? (
                  <>
                    <p
                      className="text-4xl font-bold text-stone-900"
                      style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                      {formatIDR(
                        yearly ? plan.yearlyPrice! : plan.monthlyPrice
                      )}
                    </p>
                    <p className="mt-1 text-sm text-stone-400">
                      /bulan{yearly ? " · tagih tahunan" : ""}
                    </p>
                  </>
                ) : (
                  <p
                    className="text-3xl font-bold text-stone-900"
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                  >
                    Custom
                  </p>
                )}
              </div>

              <ul className="mb-8 flex flex-1 flex-col gap-3">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-3 text-sm text-stone-600"
                  >
                    <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                      <Check size={10} strokeWidth={3} />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/app/signup"
                className={`block rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                  plan.highlight
                    ? "bg-teal-700 text-white hover:bg-teal-800"
                    : "border border-stone-300 text-stone-700 hover:border-teal-400 hover:text-teal-700"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
