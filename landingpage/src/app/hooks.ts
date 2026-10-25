import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useFadeUp(ref: React.RefObject<HTMLElement | null>, delay = 0) {
  useEffect(() => {
    if (!ref.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(ref.current, { opacity: 1, y: 0 });
      return;
    }
    const animation = gsap.fromTo(
      ref.current,
      { opacity: 0, y: 28 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        delay,
        ease: "power3.out",
        scrollTrigger: { trigger: ref.current, start: "top 90%" },
      }
    );
    return () => {
      animation.kill();
    };
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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(children, { opacity: 1, y: 0 });
      return;
    }
    const animation = gsap.fromTo(
      children,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: staggerAmount,
        ease: "power3.out",
        scrollTrigger: { trigger: containerRef.current, start: "top 90%" },
      }
    );
    return () => {
      animation.kill();
    };
  }, []);
}
