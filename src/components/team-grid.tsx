"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { EASE } from "./motion";
import type { Member } from "@/content/team";

function initials(name: string) {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("");
}

export function TeamGrid({ members, featured = false }: { members: Member[]; featured?: boolean }) {
  return (
    <ul className={`grid gap-3 ${featured ? "sm:grid-cols-2 lg:grid-cols-5" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"}`}>
      {members.map((m, i) => (
        <motion.li
          key={m.name}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "0px 0px -8% 0px" }}
          transition={{ duration: 0.7, delay: (i % 5) * 0.06, ease: EASE }}
          className={`group relative overflow-hidden rounded-[20px] ring-1 ring-ink/5 transition-colors duration-500 ${
            featured ? "bg-ink text-paper hover:bg-graphite-800" : "bg-paper-2 hover:bg-steel"
          }`}
        >
          <div className={`relative ${featured ? "aspect-[4/5]" : "aspect-square"}`}>
            {m.photo ? (
              <Image src={m.photo} alt={m.name} fill sizes="20vw" className="object-cover grayscale transition duration-700 group-hover:grayscale-0" />
            ) : (
              <span
                aria-hidden
                className={`absolute inset-0 flex items-center justify-center pb-10 text-[clamp(2.5rem,6vw,4.5rem)] font-semibold tracking-[-0.06em] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 ${
                  featured ? "text-paper/15" : "text-ink/10"
                }`}
              >
                {initials(m.name)}
              </span>
            )}
          </div>
          <div className="absolute inset-x-0 bottom-0 p-5">
            <p className="text-lg leading-tight font-semibold tracking-tight">{m.name}</p>
            <p className={`mt-1 text-sm ${featured ? "text-paper/60" : "text-graphite-600"}`}>{m.role}</p>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
