import type { Metadata } from "next";
import { PeopleView } from "@/components/pages/people";

export const metadata: Metadata = {
  title: "People",
  description: "The students leading Graphite Group across the five Claremont Colleges.",
};

export default function PeoplePage() {
  return <PeopleView />;
}
