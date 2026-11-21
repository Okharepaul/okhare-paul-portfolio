"use client";

import type { Ref } from "react";
import type { Step } from "@/content/quote";
import { pad2 } from "@/content/projects";
import { selectedIds, type Answers } from "@/lib/quote";
import { OptionTile } from "./OptionTile";

type StepViewProps = {
  step: Step;
  /** Position among the questions, from 0. */
  index: number;
  total: number;
  answers: Answers;
  /** The heading takes focus when the question changes, so a screen reader starts from it. */
  headingRef: Ref<HTMLHeadingElement>;
  onChoose: (groupId: string, optionId: string) => void;
};

/** Tiles per row: fewer, larger tiles for a short list of answers. */
function columnsFor(count: number): string {
  if (count <= 2) return "sm:grid-cols-2";
  // Seven or eight read as two full rows of four rather than leaving one tile alone.
  if (count === 4 || count === 7 || count === 8) return "sm:grid-cols-2 xl:grid-cols-4";
  return "sm:grid-cols-2 xl:grid-cols-3";
}

/**
 * One question of "Build your stack": its number, the question set very large, a
 * line of help, and the answers as tiles. Every piece carries `data-step-item`
 * so the wizard can send the pieces off and bring the next ones in.
 */
export function StepView({ step, index, total, answers, headingRef, onChoose }: StepViewProps) {
  return (
    <div>
      <p data-step-item className="label">
        <span className="text-accent-text">{pad2(index + 1)}</span> / {pad2(total)} · {step.label}
      </p>
      <h2
        ref={headingRef}
        tabIndex={-1}
        data-step-item
        className="display mt-4 text-[clamp(2.7rem,6.4vw,6.5rem)] outline-none"
      >
        {step.title}
      </h2>
      <p data-step-item className="mt-4 max-w-xl leading-relaxed text-paper/70 sm:mt-5 sm:text-lg">
        {step.lead}
      </p>

      {step.groups.map((group) => {
        const chosen = selectedIds(answers, group.id);
        return (
          <fieldset key={group.id} className="mt-7 min-w-0 sm:mt-9">
            <legend data-step-item className="label mb-4 flex w-full items-baseline justify-between gap-4">
              <span className="text-paper">{group.legend}</span>
              <span>{group.hint ?? (group.kind === "single" ? "Choose one." : null)}</span>
            </legend>
            <div className={`grid gap-3 ${columnsFor(group.options.length)}`}>
              {group.options.map((option, optionIndex) => (
                // The wrapper is what flies in and out; the tile inside keeps its own lean towards the pointer.
                <div key={option.id} data-step-item data-step-tile>
                  <OptionTile
                    name={`${step.id}-${group.id}`}
                    kind={group.kind}
                    index={optionIndex}
                    label={option.label}
                    detail={option.detail}
                    isSelected={chosen.includes(option.id)}
                    onChoose={() => onChoose(group.id, option.id)}
                  />
                </div>
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
