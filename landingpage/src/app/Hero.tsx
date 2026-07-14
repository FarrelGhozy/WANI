import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { ArrowRight, MessageCircle } from "lucide-react";
import gsap from "gsap";
import PhoneMockup from "./PhoneMockup.tsx";

export default function Hero() {
  const badgeRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 });
    tl.fromTo(badgeRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" })
      .fromTo(headingRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=0.2")
      .fromTo(bodyRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.3")
      .fromTo(ctaRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.2")
      .fromTo(noteRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4 }, "-=0.1");
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-800 to-teal-900 pb-28 pt-32">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-teal-400" style={{ filter: "blur(120px)" }} />
        <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-teal-300" style={{ filter: "blur(100px)" }} />
      </div>
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <div ref={badgeRef} className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-500/40 bg-teal-800/60 px-4 py-1.5 text-sm text-teal-200" style={{ opacity: 0 }}>
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              2.400+ UMKM sudah pakai WANI
            </div>

            <h1
              ref={headingRef}
              className="mb-6 text-4xl font-bold leading-tight text-white lg:text-5xl xl:text-6xl"
              style={{ fontFamily: "'Instrument Serif', serif", opacity: 0 }}
            >
              WhatsApp AI{" "}
              <span className="italic text-teal-300">untuk bisnis</span>
              <br />
              kamu yang lebih{" "}
              <span className="italic text-teal-300">produktif</span>
            </h1>

            <p ref={bodyRef} className="mb-10 text-lg leading-relaxed text-teal-100/80" style={{ opacity: 0 }}>
              WANI mengubah WhatsApp bisnismu jadi asisten AI yang siap melayani pelanggan 24/7 —
              terima pesanan, jawab pertanyaan, dan kirim laporan otomatis. Tanpa keahlian teknis.
            </p>

            <div ref={ctaRef} className="flex flex-wrap gap-4" style={{ opacity: 0 }}>
              <Link to="/app/signup" className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-teal-800 shadow-lg transition-all hover:bg-teal-50 hover:shadow-xl">
                Coba Gratis 14 Hari
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#cara-kerja" className="inline-flex items-center gap-2 rounded-full border border-teal-400/50 px-7 py-3.5 text-base font-semibold text-white transition-all hover:border-teal-300 hover:bg-teal-800/40">
                <MessageCircle size={16} />
                Lihat Demo
              </a>
            </div>

            <p ref={noteRef} className="mt-5 text-sm text-teal-300/60" style={{ opacity: 0 }}>
              Gratis 14 hari · Tanpa kartu kredit · Batalkan kapan saja
            </p>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 60L60 50C120 40 240 20 360 16.7C480 13.3 600 26.7 720 30C840 33.3 960 26.7 1080 23.3C1200 20 1320 20 1380 20L1440 20V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="#fafaf9" />
        </svg>
      </div>
    </section>
  );
}
