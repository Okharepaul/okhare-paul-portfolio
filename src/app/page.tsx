import { About } from "@/components/home/About";
import { Contact, LabBand } from "@/components/home/Closing";
import { Hero } from "@/components/home/Hero";
import { ManifestoBand } from "@/components/home/ManifestoBand";
import { Projects } from "@/components/home/Projects";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ManifestoBand />
      <About />
      <Projects />
      <LabBand />
      <Contact />
    </>
  );
}
