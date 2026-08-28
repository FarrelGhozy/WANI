import { useRef } from "react";
import { Link } from "react-router";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useFadeUp } from "./hooks.ts";

export default function CTASection() {
  const innerRef = useRef<HTMLDivElement>(null);
  useFadeUp(innerRef);

  return (
    <section className="bg-[#f7f8f6] px-5 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-teal-900 px-6 py-16 text-center shadow-[0_30px_70px_-40px_rgba(19,78,74,0.8)] sm:px-12">
        <div className="pointer-events-none absolute -right-28 -top-40 h-80 w-80 rounded-full border-[50px] border-white/[0.04]" />
        <div ref={innerRef} className="relative mx-auto max-w-3xl" style={{ opacity: 0 }}>
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600/60 text-white">
            <MessageCircle size={28} />
          </div>
          <h2
            className="mb-4 text-3xl font-bold text-white lg:text-4xl"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Siap bawa bisnismu ke{" "}
            <span className="italic text-teal-300">level berikutnya?</span>
          </h2>
          <p className="mb-9 text-base leading-7 text-teal-100/75 sm:text-lg">
            Bergabung dengan 2.400+ UMKM yang sudah mempercayakan layanan
            pelanggan mereka ke WANI. Coba gratis 14 hari — tanpa kartu kredit.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/app/signup"
              className="group inline-flex h-12 items-center gap-2 rounded-xl bg-white px-7 text-sm font-semibold text-teal-900 shadow-lg transition-all hover:bg-teal-50"
            >
              Mulai Gratis Sekarang
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <a
              href="#cara-kerja"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/20 px-7 text-sm font-semibold text-white transition-all hover:bg-white/10"
            >
              <MessageCircle size={16} />
              Pelajari Cara Kerja
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
