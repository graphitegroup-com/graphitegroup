import type { Metadata } from "next";
import {
  Destinations,
  FAQ,
  Journey,
  Life,
  Recruiting,
  StudentIntro,
  StudentsHero,
  Voices,
} from "@/components/students/sections";

export const metadata: Metadata = {
  title: "For Students",
  description:
    "Join Graphite Group: client consulting, a real curriculum and a community across all five Claremont Colleges.",
};

export default function StudentsPage() {
  return (
    <>
      <StudentsHero />
      <StudentIntro />
      <Journey />
      <Life />
      <Destinations />
      <Recruiting />
      <Voices />
      <FAQ />
    </>
  );
}
