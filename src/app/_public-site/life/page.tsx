import type { Metadata } from "next";
import { LifeView } from "@/components/pages/life";

export const metadata: Metadata = {
  title: "Life at Graphite",
  description: "What Graphite Group is like socially: the people, the semester rhythm, buddies, socials and the alumni network.",
};

export default function LifePage() {
  return <LifeView />;
}
