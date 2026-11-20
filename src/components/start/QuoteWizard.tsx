"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { pad2 } from "@/content/projects";
import { Arrow } from "@/components/ui/primitives";
import { prefersReducedMotion } from "@/lib/motion";
import { EMPTY_ANSWERS, buildQuote, choose, isStepComplete, quoteNumber, stepsFor, type Answers, type QuoteClient } from "@/lib/quote";
import { onSiteReady } from "@/lib/ready";
import { BuildSequence } from "./BuildSequence";
import { CountedTotal, LiveEstimate } from "./LiveEstimate";
import { QuoteActions } from "./QuoteActions";
import { QuoteSheet } from "./QuoteSheet";
import { StepView } from "./StepView";

gsap.registerPlugin(CustomEase);

/** The same curve the site's pages arrive on. */
const ARRIVE_EASE = CustomEase.create("start-arrive", "0.22, 1, 0.36, 1");
const VIEW_DISTANCE_PX = 1000;

/** "steps": answering. "building": the beat before the estimate. "quote": the finished estimate. */
type Phase = "steps" | "building" | "quote";

const everyItem = (stage: HTMLElement): HTMLElement[] => Array.from(stage.querySelectorAll<HTMLElement>("[data-step-item]"));

/**
 * A question arrives the way the site's pages do: its words stand up from
 * their bottom edge, and its tiles swing in like doors from the side the
 * visitor is heading towards. Returns the function that undoes it.
 */
function arrive(stage: HTMLElement, direction: number): () => void {
  const items = everyItem(stage);
  const tiles = items.filter((item) => item.hasAttribute("data-step-tile"));
  const words = items.filter((item) => !item.hasAttribute("data-step-tile"));
  gsap.set(words, { opacity: 0, rotationX: 62, y: 16, transformPerspective: VIEW_DISTANCE_PX, transformOrigin: "50% 100%" });
  gsap.set(tiles, {
    opacity: 0,
    rotationY: -58 * direction,
    z: -160,
    transformPerspective: VIEW_DISTANCE_PX,
    transformOrigin: direction > 0 ? "100% 50%" : "0% 50%",
  });
  const play = (): void => {
    gsap.to(items, {
      opacity: 1,
      rotationX: 0,
      rotationY: 0,
      y: 0,
      z: 0,
      duration: 1.1,
      ease: ARRIVE_EASE,
      stagger: 0.045,
      // Handed back clean, so a tile's own lean towards the pointer is not overridden.
      clearProps: "transform,transformOrigin,opacity",
    });
  };
  // On a first visit the loader is still up: hold the arrival until it has lifted.
  const stopWaiting = onSiteReady(play);
  return () => {
    stopWaiting();
    gsap.killTweensOf(items);
    gsap.set(items, { clearProps: "transform,transformOrigin,opacity" });
  };
}

/**
 * A question leaves towards the side the visitor is coming from. Resolves when
 * it has gone, or when something else takes its pieces over, so the wizard is
 * never left waiting on a tween that will not finish.
 */
function leave(stage: HTMLElement, direction: number): Promise<void> {
  return new Promise((resolve) => {
    gsap.to(everyItem(stage), {
      opacity: 0,
      x: -44 * direction,
      rotationY: 32 * direction,
      transformPerspective: VIEW_DISTANCE_PX,
      transformOrigin: direction > 0 ? "0% 50%" : "100% 50%",
      duration: 0.34,
      ease: "power2.in",
      stagger: { amount: 0.14 },
      overwrite: true,
      onComplete: resolve,
      onInterrupt: resolve,
    });
  });
}

/**
 * The estimator. It asks what is being built, then the questions that kind
 * of project needs, one screen at a time; a receipt beside the questions
 * gains a line with every answer. The last answer produces the estimate as a
 * document that can be saved, sent or changed.
 */
export function QuoteWizard() {
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("steps");
  const [client, setClient] = useState<QuoteClient>({ name: "", business: "" });
  const [issue, setIssue] = useState<{ reference: string; issued: Date } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const quoteTitleRef = useRef<HTMLHeadingElement>(null);
  const isMoving = useRef(false);
  const direction = useRef(1);
  const hasMoved = useRef(false);

  const steps = useMemo(() => stepsFor(answers.type), [answers.type]);
  /** Before a kind of project is chosen, the bar shows the usual run of questions as a preview. */
  const shownSteps = answers.type ? steps : stepsFor("website");
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const quote = useMemo(() => buildQuote(answers), [answers]);
  const canContinue = isStepComplete(step, answers);
  const isLastStep = answers.type !== null && stepIndex === steps.length - 1;
  const progress = phase === "steps" ? stepIndex / shownSteps.length : 1;

  // Each new question arrives in 3D. Changing an answer on the same question does not replay it.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || phase !== "steps" || prefersReducedMotion()) return;
    return arrive(stage, direction.current);
  }, [stepIndex, phase]);

  // After a move, bring what is new into view and start a screen reader at its heading:
  // the question's, or the estimate's once it has been built.
  useEffect(() => {
    if (!hasMoved.current) return;
    const root = rootRef.current;
    if (root && root.getBoundingClientRect().top < 0) root.scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    if (phase === "steps") headingRef.current?.focus({ preventScroll: true });
    if (phase === "quote") quoteTitleRef.current?.focus({ preventScroll: true });
  }, [stepIndex, phase]);

  /** Sends the current question off, then shows what comes next. */
  const move = (next: () => void, towards: number): void => {
    if (isMoving.current) return;
    hasMoved.current = true;
    direction.current = towards;
    const stage = stageRef.current;
    if (!stage || prefersReducedMotion()) {
      next();
      return;
    }
    isMoving.current = true;
    // Nothing on a question that is on its way out can be pressed.
    stage.style.pointerEvents = "none";
    leave(stage, towards).then(() => {
      isMoving.current = false;
      stage.style.pointerEvents = "";
      next();
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!canContinue) return;
    if (isLastStep) move(() => setPhase("building"), 1);
    else move(() => setStepIndex((index) => index + 1), 1);
  };

  const handleChoose = (groupId: string, optionId: string): void => {
    const group = step.groups.find((candidate) => candidate.id === groupId);
    if (group) setAnswers((current) => choose(current, group, optionId));
  };

  const handleBuilt = useCallback((): void => {
    const issued = new Date();
    setIssue({ reference: quoteNumber(issued, Math.floor(Math.random() * 10000)), issued });
    setPhase("quote");
  }, []);

  const handleRestart = (): void => {
    hasMoved.current = true;
    direction.current = -1;
    setAnswers(EMPTY_ANSWERS);
    setStepIndex(0);
    setIssue(null);
    setPhase("steps");
  };

  const handleEdit = (): void => {
    hasMoved.current = true;
    direction.current = -1;
    setPhase("steps");
  };

  /** Back to an earlier question from the bar: from the questions, or from the finished estimate. */
  const handleJump = (index: number): void => {
    if (phase === "steps") {
      move(() => setStepIndex(index), -1);
      return;
    }
    setStepIndex(index);
    handleEdit();
  };

  return (
    <div ref={rootRef} data-enter="none" className="scroll-mt-20">
      <div className="start-chrome">
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
          <h1 className="label text-paper">
            <span className="text-accent-text">[</span> Start a project <span className="text-accent-text">]</span>
          </h1>
          <p className="label max-sm:hidden">An estimate in pounds, built from your answers</p>
        </div>

        <nav aria-label="Questions" className="mt-4 sm:mt-6">
          {/* On a phone the bar alone shows progress; the question's own number says where you are, and Back goes back. */}
          <ol className="flex flex-wrap gap-x-6 gap-y-2 max-sm:hidden">
            {shownSteps.map((shown, i) => {
              const isCurrent = phase === "steps" && i === stepIndex;
              const isBehind = answers.type !== null && (phase !== "steps" || i < stepIndex);
              return (
                <li key={shown.id}>
                  <button
                    type="button"
                    disabled={!isBehind || phase === "building"}
                    aria-current={isCurrent ? "step" : undefined}
                    onClick={() => handleJump(i)}
                    className={`label flex items-center gap-2 py-1 transition-colors ${isCurrent ? "text-paper" : isBehind ? "text-paper/70 hover:text-accent" : "text-paper/35"}`}
                  >
                    <span className={isCurrent || isBehind ? "text-accent-text" : ""}>{pad2(i + 1)}</span>
                    {shown.label}
                  </button>
                </li>
              );
            })}
            <li className={`label flex items-center gap-2 py-1 ${phase === "quote" ? "text-paper" : "text-paper/35"}`}>
              <span className={phase === "quote" ? "text-accent-text" : ""}>£</span>
              Estimate
            </li>
          </ol>
          <div className="start-track mt-3">
            <div className="start-track-fill" style={{ transform: `scaleX(${progress})` }} />
          </div>
        </nav>
      </div>

      {phase === "quote" && quote && issue ? (
        <div className="mt-7 grid gap-10 sm:mt-10 lg:grid-cols-[minmax(0,1fr)_19rem] xl:grid-cols-[minmax(0,1fr)_21rem]">
          <QuoteSheet quote={quote} reference={issue.reference} issued={issue.issued} client={client} titleRef={quoteTitleRef} />
          <div className="self-start lg:sticky lg:top-24">
            <QuoteActions quote={quote} reference={issue.reference} client={client} onClientChange={setClient} onEdit={handleEdit} onRestart={handleRestart} />
          </div>
        </div>
      ) : (
        <div className="start-chrome mt-7 grid gap-10 sm:mt-10 lg:grid-cols-[minmax(0,1fr)_21rem] xl:grid-cols-[minmax(0,1fr)_25rem] xl:gap-14">
          <form ref={stageRef} onSubmit={handleSubmit} noValidate>
            {phase === "building" ? (
              <BuildSequence onDone={handleBuilt} />
            ) : (
              <>
                <StepView step={step} index={stepIndex} total={shownSteps.length} answers={answers} headingRef={headingRef} onChoose={handleChoose} />
                {/* Pinned to the bottom of the screen while the question is in view, so the way on is never out of reach. */}
                <div className="sticky bottom-0 z-20 mt-10 flex flex-wrap items-center gap-x-3 gap-y-2.5 border-t border-line bg-ink/95 py-3 backdrop-blur-sm sm:gap-x-4 sm:py-4">
                  {stepIndex > 0 ? (
                    <button type="button" onClick={() => move(() => setStepIndex((index) => index - 1), -1)} className="btn">
                      <Arrow direction="left" />
                      <span className="max-sm:sr-only">Back</span>
                    </button>
                  ) : null}
                  <button type="submit" disabled={!canContinue} data-magnetic className="btn-accent disabled:cursor-not-allowed disabled:opacity-40 max-sm:flex-1 max-sm:justify-between">
                    {isLastStep ? "Build my estimate" : "Continue"}
                    <Arrow />
                  </button>
                  <p className="label max-sm:hidden">
                    {canContinue ? "Or press Enter" : "Choose one to continue"}
                  </p>
                  {/* On small screens the receipt is below the questions, so the running figure rides here:
                      beside the buttons on a tablet, on its own line above them on a phone. */}
                  {quote ? (
                    <p aria-hidden="true" className="flex items-baseline gap-3 max-sm:order-first max-sm:w-full max-sm:justify-between sm:ml-auto lg:hidden">
                      <span className="label">So far</span>
                      <CountedTotal amount={quote.total} className="heading text-2xl text-accent" />
                    </p>
                  ) : null}
                </div>
              </>
            )}
          </form>
          <div className="self-start lg:sticky lg:top-24">
            <LiveEstimate quote={quote} />
          </div>
        </div>
      )}
    </div>
  );
}
