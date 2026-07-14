import { useRef } from "react";
import { Link } from "react-router";
import { MessageCircle } from "lucide-react";
import { useFadeUp } from "./hooks.ts";

export default function Footer() {
  const footerRef = useRef<HTMLDivElement>(null);
  useFadeUp(footerRef);

  return (
    <footer className="border-t border-stone-200 bg-[#fafaf9] py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div ref={footerRef} className="grid gap-10 lg:grid-cols-4" style={{ opacity: 0 }}>
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
                <MessageCircle size={16} />
              </div>
              <span className="text-xl font-bold text-stone-900" style={{ fontFamily: "'Instrument Serif', serif" }}>
                WANI
              </span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-stone-500">
              WhatsApp AI untuk UMKM Indonesia. Bantu bisnismu melayani pelanggan lebih cepat, lebih pintar, tanpa henti.
            </p>
          </div>

          <div>
            <p className="mb-4 text-sm font-semibold text-stone-800">Produk</p>
            <ul className="flex flex-col gap-2.5 text-sm text-stone-500">
              {["Fitur", "Harga", "Cara Kerja", "Changelog"].map((item) => (
                <li key={item}>
                  <a href="#" className="transition-colors hover:text-teal-600">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-sm font-semibold text-stone-800">Perusahaan</p>
            <ul className="flex flex-col gap-2.5 text-sm text-stone-500">
              {["Tentang Kami", "Blog", "Kebijakan Privasi", "Syarat & Ketentuan"].map((item) => (
                <li key={item}>
                  <a href="#" className="transition-colors hover:text-teal-600">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-stone-200 pt-8 sm:flex-row">
          <p className="text-xs text-stone-400">© 2024 WANI. Dibuat dengan ❤️ untuk UMKM Indonesia.</p>
          <p className="text-xs text-stone-400">Jakarta, Indonesia</p>
        </div>
      </div>
    </footer>
  );
}
