import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { ArrowRight, Check, Play } from "lucide-react";
import gsap from "gsap";
import PhoneMockup from "./PhoneMockup.tsx";

const BENEFITS = ["Aktif 24/7", "Siap dalam 5 menit", "Tanpa kartu kredit"];

export default function Hero() {
  const contentRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reducedMotion) return;

    const timeline = gsap.timeline({ delay: 0.1 });
    timeline
      .fromTo(
        contentRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }
      )
      .fromTo(
        previewRef.current,
        { opacity: 0, y: 28, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" },
        "-=0.45"
      );

    return () => {
      timeline.kill();
    };
  }, []);

  return (
    <section className="relative overflow-hidden bg-[#f7f8f6] pb-18 pt-40 sm:pb-22 sm:pt-44 lg:min-h-[820px] lg:pb-24 lg:pt-44">
      <div className="pointer-events-none absolute -right-64 -top-64 h-[640px] w-[640px] rounded-full bg-teal-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -left-48 h-[480px] w-[480px] rounded-full bg-amber-100/50 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(400px,0.98fr)] lg:gap-16 lg:px-8">
        <div ref={contentRef}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-3 py-1.5 text-xs font-semibold text-teal-800 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Dipakai 2.400+ UMKM Indonesia
          </div>

          <h1
            className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-stone-950 sm:text-5xl lg:text-[3.75rem]"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Bisnis tetap melayani, bahkan saat kamu{" "}
            <span className="italic text-teal-700">sedang istirahat.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-7 text-stone-600 sm:text-lg sm:leading-8">
            WANI adalah asisten WhatsApp berbasis AI yang menjawab pelanggan,
            mencatat pesanan, dan menjaga tokomu tetap responsif selama 24 jam.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/app/signup"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgba(15,118,110,0.7)] transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
            >
              Coba Gratis 14 Hari
              <ArrowRight
                size={17}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <a
              href="#cara-kerja"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-6 text-sm font-semibold text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
            >
              <Play size={16} fill="currentColor" />
              Lihat Cara Kerja
            </a>
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2" aria-label="Keuntungan mencoba WANI">
            {BENEFITS.map((benefit) => (
              <li
                key={benefit}
                className="flex items-center gap-1.5 text-xs font-medium text-stone-500"
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check size={10} strokeWidth={3} />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div ref={previewRef} className="relative flex justify-center lg:justify-end">
          <div className="absolute inset-x-2 bottom-8 top-8 rotate-2 rounded-[2rem] bg-teal-900 shadow-[0_35px_80px_-35px_rgba(19,78,74,0.75)] sm:inset-x-8 lg:inset-x-0" />
          <div className="absolute left-0 top-12 hidden rounded-2xl border border-white/10 bg-white/95 p-4 shadow-xl backdrop-blur sm:block lg:hidden xl:-left-8 xl:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
              Respons pelanggan
            </p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-2xl font-bold text-stone-950">&lt; 1 mnt</span>
              <span className="mb-1 text-xs font-semibold text-emerald-600">24/7</span>
            </div>
          </div>
          <div className="relative z-10 px-0 py-7 sm:px-12 sm:py-10">
            <PhoneMockup />
          </div>
          <div className="absolute -bottom-2 right-0 z-20 hidden rounded-2xl border border-stone-100 bg-white p-4 shadow-xl sm:block lg:-right-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Check size={18} strokeWidth={2.5} />
              </span>
              <div>
                <p className="text-xs font-semibold text-stone-900">Pesanan dicatat</p>
                <p className="mt-0.5 text-[10px] text-stone-400">Otomatis ke dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
