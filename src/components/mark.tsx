"use client";

import { motion, useReducedMotion } from "motion/react";

/** The six pieces of the hex-G, ordered clockwise from the top. */
export const MARK_PIECES = [
  { d: "M52.20 5.27 L89.84 27.00 L71.65 37.50 L52.20 26.27Z", from: [14, -18] },
  { d: "M57.86 52.00 L89.84 52.00 L89.84 70.46Z", from: [26, 2] },
  { d: "M87.64 74.27 L52.20 94.73 L52.20 73.73 L69.45 63.77Z", from: [14, 18] },
  { d: "M47.80 94.73 L12.36 74.27 L30.55 63.77 L47.80 73.73Z", from: [-14, 18] },
  { d: "M10.16 70.46 L10.16 29.54 L28.35 40.04 L28.35 59.96Z", from: [-24, 0] },
  { d: "M12.36 25.73 L47.80 5.27 L47.80 26.27 L30.55 36.23Z", from: [-14, -18] },
] as const;

type MarkProps = {
  className?: string;
  /** Pieces fly in and lock together on mount. */
  assemble?: boolean;
  delay?: number;
  title?: string;
};

export function Mark({ className, assemble = false, delay = 0, title = "Graphite Group" }: MarkProps) {
  const reduce = useReducedMotion();
  const animate = assemble && !reduce;

  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={title} fill="currentColor">
      {MARK_PIECES.map((p, i) =>
        animate ? (
          <motion.path
            key={i}
            d={p.d}
            initial={{ x: p.from[0] * 2, y: p.from[1] * 2, opacity: 0, rotate: (i % 2 ? 1 : -1) * 18 }}
            animate={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            transition={{ delay: delay + i * 0.07, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          />
        ) : (
          <path key={i} d={p.d} />
        ),
      )}
    </svg>
  );
}

/** Mark that splits apart on hover, used in the header. */
export function HoverMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={`group/mark ${className ?? ""}`} aria-hidden fill="currentColor">
      {MARK_PIECES.map((p, i) => (
        <path
          key={i}
          d={p.d}
          className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ ["--dx" as string]: `${p.from[0] * 0.22}px`, ["--dy" as string]: `${p.from[1] * 0.22}px` }}
        />
      ))}
      <style>{`.group\\/mark:hover path, a:hover > .group\\/mark path { transform: translate(var(--dx), var(--dy)); }`}</style>
    </svg>
  );
}
