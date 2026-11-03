import type { Metadata } from "next";
import { ClientsView } from "@/components/pages/clients";

export const metadata: Metadata = {
  title: "For Clients",
  description: "How Graphite Group engagements work, and the strategy and digital problems we take on.",
};

export default function ClientsPage() {
  return <ClientsView />;
}
