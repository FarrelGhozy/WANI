import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useFadeUp(ref: React.RefObject<HTMLElement | null>, delay = 0) {
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        delay,
        ease: "power3.out",
        scrollTrigger: { trigger: ref.current, start: "top 88%" },
      }
    );
  }, []);
}

export function useStagger(
  containerRef: React.RefObject<HTMLElement | null>,
  childSelector: string,
  staggerAmount = 0.1
) {
  useEffect(() => {
    if (!containerRef.current) return;
    const children = containerRef.current.querySelectorAll(childSelector);
    gsap.fromTo(
      children,
      { opacity: 0, y: 36 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: staggerAmount,
        ease: "power3.out",
        scrollTrigger: { trigger: containerRef.current, start: "top 85%" },
      }
    );
  }, []);
}
