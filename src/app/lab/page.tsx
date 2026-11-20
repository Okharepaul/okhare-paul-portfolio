import type { Metadata } from "next";
import { labComponents, labExperiments, labIntro } from "@/content/lab";
import { LabDemo } from "@/components/lab/LabDemo";
import { SwarmSandbox } from "@/components/lab/SwarmSandbox";
import { CounterBox, PageHead } from "@/components/ui/PageHead";
import { MeetLink } from "@/components/ui/MeetLink";
import { Chip, SectionLabel, SplitChars } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Lab",
  description: "The site taken apart: every component with a live demo, why it exists and how it works, plus experiments in progress.",
};

/** "C—01" → "c-01", so the home page can link straight to a component. */
const anchor = (id: string): string => id.toLowerCase().replace("—", "-");

const STATUS_DOT: Record<string, string> = {
  Live: "bg-accent animate-[blink_1s_steps(1)_infinite]",
  Planned: "border border-faint",
  Ongoing: "bg-accent animate-[blink_1s_steps(1)_infinite]",
  Stable: "bg-fg",
  Archived: "border border-faint",
};

function Status({ value }: { value: string }) {
  return (
    <span className="label flex items-center gap-2 text-fg">
      <span aria-hidden="true" className={`size-1.5 rounded-full ${STATUS_DOT[value] ?? "bg-fg"}`} />
      {value}
    </span>
  );
}

export default function LabPage() {
  return (
    <>
      <PageHead
        back={{ href: "/", label: "Home" }}
        index="00"
        total="02"
        label="Laboratory"
        title={labIntro.heading}
        aside={
          <>
            <p className="leading-relaxed text-paper/80">{labIntro.copy}</p>
            <div className="mt-8">
              <CounterBox
                items={[
                  { value: labComponents.length, label: "01 · Components" },
                  { value: labExperiments.length, label: "02 · Experiments" },
                ]}
              />
            </div>
            <MeetLink variant="chip" className="mt-6" />
          </>
        }
      />

      <section aria-labelledby="components-heading" className="gutter border-y border-line py-16 md:py-24">
        <SectionLabel index="01" total="02">
          Components
        </SectionLabel>
        <SplitChars as="h2" id="components-heading" text="Components" className="display mt-6 block text-[clamp(3rem,8vw,7rem)]" />

        <div className="mt-6">
          {labComponents.map((component) => (
            <article
              key={component.id}
              id={anchor(component.id)}
              className="grid scroll-mt-20 gap-8 border-b border-line py-14 last:border-b-0 md:grid-cols-12 md:py-20"
            >
              <div data-reveal className="md:col-span-5">
                <p className="label text-muted">
                  <span className="text-accent">{component.id}</span> · {component.file}
                </p>
                <h3 className="display mt-3 text-[clamp(2.5rem,4.5vw,4rem)]">{component.name}</h3>
                <p className="mt-4 max-w-[40ch] text-lg text-fg">{component.what}</p>

                <dl className="mt-8 border-t border-line">
                  <div className="grid grid-cols-[4rem_1fr] gap-4 border-b border-line py-4">
                    <dt className="label pt-0.5 text-faint">Why</dt>
                    <dd className="text-[0.9375rem] text-muted">{component.why}</dd>
                  </div>
                  <div className="grid grid-cols-[4rem_1fr] gap-4 border-b border-line py-4">
                    <dt className="label pt-0.5 text-faint">How</dt>
                    <dd className="text-[0.9375rem] text-muted">{component.how}</dd>
                  </div>
                </dl>

                <ul className="mt-5 flex flex-wrap gap-1.5">
                  {component.tags.map((tag) => (
                    <li key={tag}>
                      <Chip>{tag}</Chip>
                    </li>
                  ))}
                </ul>

                <p className="mt-6 border border-line p-4 text-[0.9375rem] text-muted">
                  <span className="label text-fg">Verdict — </span>
                  {labIntro.verdictPending}
                </p>
              </div>

              <div data-reveal className="crosshair h-fit border border-line bg-ink md:col-span-7">
                <div className="absolute top-4 right-4 z-10">
                  <Status value={component.status} />
                </div>
                <div className="aspect-[4/3] md:aspect-[16/10]">
                  <LabDemo demo={component.demo} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="experiments-heading" className="gutter py-16 md:py-24">
        <SectionLabel index="02" total="02">
          Experiments
        </SectionLabel>
        <SplitChars as="h2" id="experiments-heading" text="Experiments" className="display mt-6 block text-[clamp(3rem,8vw,7rem)]" />

        <div className="mt-12 grid gap-x-8 gap-y-14 md:grid-cols-2">
          {labExperiments.map((experiment, i) => (
            <article key={experiment.id} id={anchor(experiment.id)} data-reveal className={`scroll-mt-20 ${i === 0 ? "md:col-span-2" : ""}`}>
              <div className="flex items-center justify-between gap-4">
                <p className="label text-accent">{experiment.id}</p>
                <Status value={experiment.status} />
              </div>
              <h3 className="display mt-3 text-[clamp(2.25rem,4vw,3.5rem)]">{experiment.name}</h3>
              <p className="mt-3 max-w-[52ch] text-muted">{experiment.what}</p>
              <ul className="mt-4 mb-6 flex flex-wrap gap-1.5">
                {experiment.tags.map((tag) => (
                  <li key={tag}>
                    <Chip>{tag}</Chip>
                  </li>
                ))}
              </ul>
              {experiment.awaiting ? (
                <div className="bg-dots crosshair grid aspect-[16/9] place-items-center border border-line">
                  <p className="label bg-ink px-2">{experiment.awaiting}</p>
                </div>
              ) : (
                <SwarmSandbox />
              )}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
