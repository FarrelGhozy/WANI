import { Link } from "react-router";
import { MessageCircle } from "lucide-react";

const PRODUCT_LINKS = [
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "Fitur", href: "#fitur" },
  { label: "Harga", href: "#harga" },
  { label: "Testimoni", href: "#testimoni" },
];

export default function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.5fr_0.75fr_0.75fr]">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white">
                <MessageCircle size={18} />
              </span>
              <span className="text-xl font-bold tracking-tight text-stone-950">
                WANI
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-7 text-stone-500">
              Asisten WhatsApp AI untuk membantu UMKM Indonesia melayani
              pelanggan dan mengelola pesanan sepanjang hari.
            </p>
          </div>

          <div>
            <p className="mb-4 text-sm font-semibold text-stone-900">Produk</p>
            <ul className="space-y-3 text-sm text-stone-500">
              {PRODUCT_LINKS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="transition-colors hover:text-teal-700"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-sm font-semibold text-stone-900">Akun</p>
            <ul className="space-y-3 text-sm text-stone-500">
              <li>
                <Link
                  to="/app/login"
                  className="transition-colors hover:text-teal-700"
                >
                  Masuk
                </Link>
              </li>
              <li>
                <Link
                  to="/app/signup"
                  className="transition-colors hover:text-teal-700"
                >
                  Daftar Gratis
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-3 border-t border-stone-200 pt-7 text-xs text-stone-400 sm:flex-row sm:items-center">
          <p>© 2026 WANI. Dibuat untuk UMKM Indonesia.</p>
          <p>Jakarta, Indonesia</p>
        </div>
      </div>
    </footer>
  );
}
