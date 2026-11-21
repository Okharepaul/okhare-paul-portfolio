import type { Metadata } from "next";
import { site } from "@/content/site";
import { Email } from "@/components/ui/Email";
import { ProsePage, ProseSection } from "@/components/ui/Prose";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What the contact form on theokharepaul.site collects, why, and your rights under UK GDPR.",
};

/*
 * TODO(owner): confirm the retention period. Email goes through Resend; the site is hosted on Vercel.
 * The wording below describes how the site is built today.
 */
export default function PrivacyPolicyPage() {
  return (
    <ProsePage label="Legal" title="Privacy" updated="17 November 2026">
      <ProseSection title="Who is responsible">
        <p>
          This site is run by {site.legalName}, trading as {site.name}, in {site.location.full}. For anything about your
          data, write to <Email />.
        </p>
      </ProseSection>

      <ProseSection title="What the contact form collects">
        <p>
          When you send a message through the contact form, I receive what you type: your <strong>name</strong>, your{" "}
          <strong>email address</strong>, <strong>what you need</strong>, your <strong>message</strong>, and your{" "}
          <strong>budget</strong> and <strong>timeline</strong> if you choose to add them.
        </p>
        <p>The site does not ask for anything else, and you can always email me directly instead.</p>
      </ProseSection>

      <ProseSection title="Why">
        <p>
          Only to reply to you and, if we go on to work together, to plan that work. The legal basis is legitimate
          interest in answering an enquiry you sent me. I do not use your details for marketing and I do not sell or
          share them.
        </p>
      </ProseSection>

      <ProseSection title="Where it is stored and for how long">
        <p>
          Your message is delivered to my inbox by Resend, an email delivery service acting on my behalf. The site is hosted by Vercel. The site itself keeps
          no database of messages.
        </p>
        <p>
          I keep the conversation for as long as we are in touch and delete it within 12 months of our last exchange,
          unless we have a contract that requires me to keep records for longer.
        </p>
      </ProseSection>

      <ProseSection title="Cookies and tracking">
        <p>
          This site sets no tracking cookies and runs no analytics. Your browser stores two small values so the site
          behaves well: your light or dark theme choice, and a note that the loading sequence has already played. Neither
          leaves your device.
        </p>
      </ProseSection>

      <ProseSection title="Your rights">
        <p>
          Under UK GDPR you can ask to see the data I hold about you, have it corrected or deleted, or object to how it
          is used. Email <Email /> and I will act on it within one month.
        </p>
        <p>
          If you are unhappy with how I handle your data, you can complain to the Information Commissioner&apos;s Office
          at <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>.
        </p>
      </ProseSection>
    </ProsePage>
  );
}
