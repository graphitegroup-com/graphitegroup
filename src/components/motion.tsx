"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

type FadeInProps = HTMLMotionProps<"div"> & { delay?: number; as?: "div" | "li" };

/** The only scroll motion on the site: a short, quiet fade-up. */
export function FadeIn({ delay = 0, as = "div", children, ...rest }: FadeInProps) {
  const reduce = useReducedMotion();
  // Cast: motion.li and motion.div share every prop we pass here.
  const Tag = (as === "li" ? motion.li : motion.div) as typeof motion.div;
  return (
    <Tag
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
