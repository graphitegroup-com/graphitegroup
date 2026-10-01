import { Hero, PhotoReveal } from "@/components/home/hero";
import {
  ClientMarquee,
  Engagement,
  LiberalArts,
  Practices,
  RLCIE,
  SelectedWork,
  Stats,
  Testimonials,
} from "@/components/home/sections";
import { Contact } from "@/components/home/contact";

export default function Home() {
  return (
    <>
      <Hero />
      <PhotoReveal />
      <Stats />
      <ClientMarquee />
      <Practices />
      <SelectedWork />
      <Engagement />
      <LiberalArts />
      <Testimonials />
      <RLCIE />
      <Contact />
    </>
  );
}
