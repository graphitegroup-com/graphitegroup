import type { Metadata } from "next";
import { PracticeView } from "@/components/pages/practice";

export const metadata: Metadata = {
  title: "Graphite Digital",
  description: "Product design, application development, data strategy, AI and emerging technology research.",
};

export default function DigitalPage() {
  return <PracticeView slug="digital" />;
}
