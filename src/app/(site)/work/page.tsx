import type { Metadata } from "next";
import { CaseIndex, DigitalArchive, PracticeSection, WorkCTA, WorkHero } from "@/components/work/sections";
import { practices } from "@/content/site";

export const metadata: Metadata = {
  title: "Our Work",
  description: "Graphite Strategy and Graphite Digital: market entry, pricing, product, software, data and AI work.",
};

export default function WorkPage() {
  return (
    <>
      <WorkHero />
      <PracticeSection p={practices[0]} />
      <PracticeSection p={practices[1]} dark />
      <DigitalArchive />
      <CaseIndex />
      <WorkCTA />
    </>
  );
}
