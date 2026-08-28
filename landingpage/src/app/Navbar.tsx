import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Menu,
  MessageCircle,
  Sparkles,
  X,
} from "lucide-react";
import gsap from "gsap";

const NAV_LINKS = [
  { label: "Cara Kerja", href: "#cara-kerja", id: "cara-kerja" },
  { label: "Fitur", href: "#fitur", id: "fitur" },
  { label: "Harga", href: "#harga", id: "harga" },
  { label: "Testimoni", href: "#testimoni", id: "testimoni" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const headerRef = useRef<HTMLElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reducedMotion || !headerRef.current) return;

    const context = gsap.context(() => {
      const timeline = gsap.timeline({ delay: 0.05 });
      timeline
        .fromTo(
          headerRef.current,
          { opacity: 0, y: -24 },
          { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }
        )
        .fromTo(
          ".nav-animate",
          { opacity: 0, y: -8 },
          {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.06,
            ease: "power2.out",
          },
          "-=0.25"
        );
    }, headerRef);

    return () => context.revert();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    const sections = NAV_LINKS.map((link) =>
      document.getElementById(link.id)
    ).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id);
        else if (window.scrollY < 500) setActiveSection("");
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: [0, 0.1, 0.25] }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open || !mobileMenuRef.current) return;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reducedMotion) return;

    const menuAnimation = gsap.fromTo(
      mobileMenuRef.current,
      { opacity: 0, y: -12 },
      { opacity: 1, y: 0, duration: 0.28, ease: "power2.out" }
    );
    const itemAnimation = gsap.fromTo(
      mobileMenuRef.current.querySelectorAll(".mobile-nav-item"),
      { opacity: 0, x: -10 },
      {
        opacity: 1,
        x: 0,
        duration: 0.3,
        stagger: 0.045,
        ease: "power2.out",
      }
    );

    return () => {
      menuAnimation.kill();
      itemAnimation.kill();
    };
  }, [open]);

  return (
    <header
      ref={headerRef}
      className={
        "fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 " +
        (scrolled || open
          ? "border-stone-200/90 bg-white/95 shadow-[0_10px_35px_-25px_rgba(28,25,23,0.45)] backdrop-blur-xl"
          : "border-transparent bg-white/85 backdrop-blur-md")
      }
    >
      <div
        className={
          "overflow-hidden bg-teal-900 text-white transition-all duration-500 " +
          (scrolled ? "max-h-0 opacity-0" : "max-h-10 opacity-100")
        }
      >
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-center gap-2 px-5 text-center text-[11px] font-medium sm:px-6 sm:text-xs lg:px-8">
          <Sparkles size={13} className="shrink-0 text-teal-300" />
          <span className="sm:hidden">Coba WANI gratis selama 14 hari</span>
          <span className="hidden sm:inline">
            Mulai otomatisasi WhatsApp dalam 5 menit — gratis selama 14 hari
          </span>
          <Link
            to="/app/signup"
            className="group ml-1 inline-flex shrink-0 items-center gap-1 font-semibold text-teal-200 transition hover:text-white"
          >
            Mulai
            <ArrowRight
              size={12}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>

      <nav
        className={
          "mx-auto flex max-w-7xl items-center justify-between px-5 transition-all duration-300 sm:px-6 lg:px-8 " +
          (scrolled ? "h-16" : "h-18")
        }
        aria-label="Navigasi utama"
      >
        <Link
          to="/"
          className="nav-animate flex items-center gap-2.5"
          aria-label="WANI"
        >
          <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-teal-700 text-white shadow-sm shadow-teal-900/15">
            <span className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-white/15" />
            <MessageCircle
              size={18}
              strokeWidth={2.2}
              className="relative"
            />
          </span>
          <span className="text-xl font-bold tracking-tight text-stone-950">
            WANI
          </span>
          <span className="hidden rounded-md bg-teal-50 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-teal-700 md:inline">
            WhatsApp AI
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <a
                key={link.label}
                href={link.href}
                className={
                  "nav-animate group relative rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors " +
                  (isActive
                    ? "text-teal-800"
                    : "text-stone-600 hover:text-stone-950")
                }
              >
                {link.label}
                <span
                  className={
                    "absolute inset-x-3.5 bottom-1 h-0.5 origin-left rounded-full bg-teal-600 transition-transform duration-300 " +
                    (isActive
                      ? "scale-x-100"
                      : "scale-x-0 group-hover:scale-x-100")
                  }
                />
              </a>
            );
          })}
        </div>

        <div className="hidden items-center gap-1 sm:flex">
          <Link
            to="/app/login"
            className="nav-animate rounded-lg px-4 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-950"
          >
            Masuk
          </Link>
          <Link
            to="/app/signup"
            className="nav-animate group inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_22px_-12px_rgba(15,118,110,0.8)] transition-all hover:-translate-y-0.5 hover:bg-teal-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-600/30"
          >
            Mulai Gratis
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="nav-animate flex h-10 w-10 items-center justify-center rounded-lg border border-transparent text-stone-700 transition hover:border-stone-200 hover:bg-stone-50 lg:hidden"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          <span
            className={
              "transition-transform duration-300 " +
              (open ? "rotate-90" : "rotate-0")
            }
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </span>
        </button>
      </nav>

      {open && (
        <div
          ref={mobileMenuRef}
          id="mobile-navigation"
          className="border-t border-stone-100 bg-white/98 px-5 pb-5 pt-3 shadow-lg shadow-stone-900/5 backdrop-blur-xl lg:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col">
            {NAV_LINKS.map((link, index) => (
              <a
                key={link.label}
                href={link.href}
                className={
                  "mobile-nav-item flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition " +
                  (activeSection === link.id
                    ? "bg-teal-50 text-teal-800"
                    : "text-stone-700 hover:bg-stone-50 hover:text-teal-700")
                }
                onClick={() => setOpen(false)}
              >
                <span>{link.label}</span>
                <span className="text-[10px] font-semibold text-stone-300">
                  {"0" + (index + 1)}
                </span>
              </a>
            ))}
            <div className="mobile-nav-item mt-3 grid grid-cols-2 gap-3 border-t border-stone-100 pt-4 sm:hidden">
              <Link
                to="/app/login"
                className="rounded-xl border border-stone-200 px-4 py-2.5 text-center text-sm font-semibold text-stone-700"
                onClick={() => setOpen(false)}
              >
                Masuk
              </Link>
              <Link
                to="/app/signup"
                className="rounded-xl bg-teal-700 px-4 py-2.5 text-center text-sm font-semibold text-white"
                onClick={() => setOpen(false)}
              >
                Mulai Gratis
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
