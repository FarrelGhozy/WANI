import { useRef } from "react";
import { Link } from "react-router";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useFadeUp } from "./hooks.ts";

export default function CTASection() {
  const innerRef = useRef<HTMLDivElement>(null);
  useFadeUp(innerRef);

  return (
    <section className="bg-gradient-to-br from-teal-700 via-teal-800 to-teal-900 py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <div ref={innerRef} style={{ opacity: 0 }}>
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600/60 text-white">
            <MessageCircle size={28} />
          </div>
          <h2
            className="mb-4 text-3xl font-bold text-white lg:text-4xl"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Siap bawa bisnismu ke <span className="italic text-teal-300">level berikutnya?</span>
          </h2>
          <p className="mb-10 text-lg text-teal-100/80">
            Bergabung dengan 2.400+ UMKM yang sudah mempercayakan layanan pelanggan mereka ke WANI. Coba gratis 14 hari — tanpa kartu kredit.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/app/signup" className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-teal-800 shadow-lg transition-all hover:bg-teal-50 hover:shadow-xl">
              Mulai Gratis Sekarang
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="#" className="inline-flex items-center gap-2 rounded-full border border-teal-400/50 px-8 py-4 text-base font-semibold text-white transition-all hover:border-teal-300 hover:bg-teal-800/40">
              <MessageCircle size={16} />
              Tanya via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
