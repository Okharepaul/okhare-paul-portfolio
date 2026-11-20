import type { Metadata } from "next";
import { meet } from "@/content/meet";
import { MeetInterests, MeetOnPaper, MeetStrengths } from "@/components/meet/MeetExtras";
import { MeetScene } from "@/components/meet/MeetScene";
import { MeetChapters, MeetHero, MeetTop } from "@/components/meet/MeetStory";
import { HireBand } from "@/components/ui/HireBand";
import "../meet.css";

export const metadata: Metadata = {
  title: meet.label,
  description: meet.description,
};

/**
 * Meet the developer. The portrait is the centre of the page: it opens with
 * the light coming round to the front, can be lit by hand, and stays beside the story
 * while each chapter moves the light to a new side. Below it: how he works,
 * what he does off the clock, the résumé and the way to hire him.
 */
export default function MeetTheDeveloperPage() {
  return (
    <>
      <MeetScene top={<MeetTop />} hero={<MeetHero />}>
        <MeetChapters />
      </MeetScene>
      <MeetStrengths />
      <MeetInterests />
      <MeetOnPaper />
      <HireBand as="h2" className="border-t" />
    </>
  );
}
