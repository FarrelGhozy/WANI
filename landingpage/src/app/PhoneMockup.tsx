import { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { CHAT_MESSAGES } from "./data.ts";

export default function PhoneMockup() {
  const [visible, setVisible] = useState(1);
  const phoneRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!phoneRef.current) return;
    gsap.fromTo(
      phoneRef.current,
      { opacity: 0, y: 60, scale: 0.92 },
      { opacity: 1, y: 0, scale: 1, duration: 1, delay: 0.5, ease: "power3.out" }
    );
  }, []);

  useEffect(() => {
    if (visible >= CHAT_MESSAGES.length) return;
    const t = setTimeout(() => setVisible((v) => v + 1), 1200);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [visible]);

  return (
    <div ref={phoneRef} className="relative mx-auto w-[300px] select-none" style={{ opacity: 0 }}>
      <div className="absolute -inset-6 rounded-[3rem] bg-teal-400/20 blur-2xl" />
      <div className="relative rounded-[2.5rem] border-[6px] border-stone-800 bg-stone-800 shadow-2xl shadow-teal-900/60">
        <div className="overflow-hidden rounded-[2rem] bg-[#ece5dd]">
          <div className="flex items-center gap-3 bg-teal-700 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white">
              WA
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Toko Bunga Sari</p>
              <p className="text-[11px] text-teal-200">Bot aktif • online</p>
            </div>
          </div>

          <div ref={chatRef} className="flex h-[440px] flex-col gap-2 overflow-y-auto px-3 py-3">
            {CHAT_MESSAGES.slice(0, visible).map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                style={{ animation: "fadeUp 0.3s ease both" }}
              >
                <div
                  className={`max-w-[76%] rounded-2xl px-3 py-2 text-[12px] leading-snug shadow-sm ${
                    msg.from === "user"
                      ? "rounded-tr-sm bg-[#d9fdd3] text-stone-800"
                      : "rounded-tl-sm bg-white text-stone-800"
                  }`}
                  style={{ whiteSpace: "pre-line" }}
                >
                  {msg.text}
                  <p className="mt-1 text-right text-[10px] text-stone-400">
                    {msg.from === "bot" ? "🤖 WANI" : ""}
                  </p>
                </div>
              </div>
            ))}

            {visible < CHAT_MESSAGES.length && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-stone-400"
                      style={{
                        animation: `bounce 1s ease infinite`,
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 bg-[#f0f2f5] px-3 py-2">
            <div className="flex-1 rounded-full bg-white px-3 py-1.5 text-[11px] text-stone-400">
              Tulis pesan...
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-white">
              <ArrowRight size={12} />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute left-1/2 top-0 h-5 w-20 -translate-x-1/2 rounded-b-2xl bg-stone-800" />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
