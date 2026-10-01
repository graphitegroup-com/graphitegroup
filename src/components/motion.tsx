"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type HTMLMotionProps,
} from "motion/react";
import Lenis from "lenis";
import { useEffect, useRef, type ReactNode } from "react";

export const EASE = [0.16, 1, 0.3, 1] as const;

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.11, anchors: true });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);
  return null;
}

type RevealProps = HTMLMotionProps<"div"> & { delay?: number; y?: number; as?: "div" | "li" };

/** Fade and rise into view once. */
export function Reveal({ delay = 0, y = 28, as = "div", children, ...rest }: RevealProps) {
  const reduce = useReducedMotion();
  // Cast: motion.li and motion.div share every prop we pass here.
  const Tag = (as === "li" ? motion.li : motion.div) as typeof motion.div;
  return (
    <Tag
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * Word-by-word masked rise. Wrap words in *asterisks* to set them in the
 * italic serif accent.
 */
export function SplitHeading({
  text,
  as: Tag = "h2",
  className,
  delay = 0,
  stagger = 0.045,
  immediate = false,
}: {
  text: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  delay?: number;
  stagger?: number;
  immediate?: boolean;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const show = immediate || inView;
  const words = text.split(" ");

  return (
    <Tag ref={ref} className={className} aria-label={text.replaceAll("*", "")}>
      {words.map((raw, i) => {
        const accent = raw.startsWith("*") && raw.replace(/[.,!?]$/, "").endsWith("*");
        const word = raw.replaceAll("*", "");
        return (
          <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom">
            <motion.span
              className={`inline-block ${accent ? "font-serif italic font-normal tracking-normal" : ""}`}
              initial={reduce ? false : { y: "110%" }}
              animate={show ? { y: "0%" } : undefined}
              transition={{ duration: 1, delay: delay + i * stagger, ease: EASE }}
            >
              {word}
              {i < words.length - 1 ? " " : ""}
            </motion.span>
          </span>
        );
      })}
    </Tag>
  );
}

export function Counter({ to, suffix = "", className }: { to: number; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? to : 0);
  const text = useTransform(mv, (v) => `${Math.round(v)}${suffix}`);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(mv, to, { duration: 1.8, ease: EASE });
    return () => controls.stop();
  }, [inView, mv, reduce, to]);

  return (
    <motion.span ref={ref} className={className}>
      {text}
    </motion.span>
  );
}

export function Marquee({
  children,
  duration = 40,
  className,
  reverse = false,
}: {
  children: ReactNode;
  duration?: number;
  className?: string;
  reverse?: boolean;
}) {
  return (
    <div
      className={`group relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] ${className ?? ""}`}
    >
      <div
        className="flex w-max shrink-0 animate-marquee group-hover:[animation-play-state:paused]"
        style={{
          ["--marquee-duration" as string]: `${duration}s`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
