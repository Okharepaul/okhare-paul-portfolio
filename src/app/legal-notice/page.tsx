import type { Metadata } from "next";
import { site } from "@/content/site";
import { Email } from "@/components/ui/Email";
import { ProsePage, ProseSection } from "@/components/ui/Prose";

export const metadata: Metadata = {
  title: "Legal notice",
  description: "Site owner, contact, hosting and copyright for theokharepaul.site.",
};

export default function LegalNoticePage() {
  return (
    <ProsePage label="Legal" title="Legal" updated="17 November 2026">
      <ProseSection title="Site owner">
        <p>
          {site.legalName}, trading as {site.name}.
          <br />
          {site.location.full}.
        </p>
      </ProseSection>

      <ProseSection title="Contact">
        <p>
          <Email />
        </p>
      </ProseSection>

      <ProseSection title="Hosting">
        <p>This site is hosted by Vercel Inc. (vercel.com), which also registers its domain.</p>
      </ProseSection>

      <ProseSection title="Copyright">
        <p>
          © 2026 {site.name}. The design, text, graphics and code of this site are my own work. Please ask before
          reusing any of it.
        </p>
        <p>
          Typefaces: Big Shoulders Display, Geist and Geist Mono, used under the SIL Open Font License. Project names
          and brands shown in case studies belong to their owners.
        </p>
      </ProseSection>
    </ProsePage>
  );
}
