import type { Metadata } from "next";
import { StudentsPageView } from "@/components/pages/students";

export const metadata: Metadata = {
  title: "Join Us",
  description:
    "Membership at Graphite Group: client consulting, structured training and a community across all five Claremont Colleges.",
};

export default function StudentsPage() {
  return <StudentsPageView />;
}
