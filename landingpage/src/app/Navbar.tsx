import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { Menu, X, MessageCircle } from "lucide-react";
import gsap from "gsap";

const NAV_LINKS = [
  { label: "Fitur", href: "#fitur" },
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "Harga", href: "#harga" },
  { label: "Testimoni", href: "#testimoni" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!navRef.current) return;
    gsap.fromTo(
      navRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    );
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      ref={navRef}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 shadow-sm backdrop-blur-sm" : "bg-transparent"
      }`}
      style={{ opacity: 0 }}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
            <MessageCircle size={16} />
          </div>
          <span
            className={`text-xl font-bold tracking-tight ${scrolled ? "text-stone-900" : "text-white"}`}
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            WANI
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-teal-400 ${
                scrolled ? "text-stone-600" : "text-white/80"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/app/login"
            className={`text-sm font-medium transition-colors ${
              scrolled ? "text-stone-600 hover:text-teal-600" : "text-white/80 hover:text-white"
            }`}
          >
            Masuk
          </Link>
          <Link
            to="/app/signup"
            className="rounded-full bg-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-500 hover:shadow-md"
          >
            Coba Gratis
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className={`md:hidden ${scrolled ? "text-stone-700" : "text-white"}`}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-stone-100 bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-stone-600 hover:text-teal-600"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/app/signup"
              className="mt-2 rounded-full bg-teal-600 px-5 py-2.5 text-center text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              Coba Gratis 14 Hari
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
