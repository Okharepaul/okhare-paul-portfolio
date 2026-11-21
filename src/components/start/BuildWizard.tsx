"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { pad2 } from "@/content/projects";
import { Arrow } from "@/components/ui/primitives";
import { prefersReducedMotion } from "@/lib/motion";
import { buildNumber, buildStack, codeFromHash, decodeBuild, encodeBuild, type BuildClient } from "@/lib/build";
import { EMPTY_ANSWERS, choose, isStepComplete, selectedIds, stepsFor, type Answers } from "@/lib/quote";
import { onSiteReady } from "@/lib/ready";
import { BuildSequence } from "./BuildSequence";
import { BuildActions, OpenedFromLink, type BuildDraft } from "./BuildActions";
import { BuildSheet, type BuildStatus } from "./BuildSheet";
import { CountUp } from "./CountUp";
import { LiveBuild } from "./LiveBuild";
import { StepView } from "./StepView";

gsap.registerPlugin(CustomEase);

/** The same curve the site's pages arrive on. */
const ARRIVE_EASE = CustomEase.create("start-arrive", "0.22, 1, 0.36, 1");
const VIEW_DISTANCE_PX = 1000;

/** "steps": answering. "building": the beat before the build. "build": the finished build. */
type Phase = "steps" | "building" | "build";

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
 * "Build your stack", for visitors who already know what they want. It asks
 * what is being built, then the questions that kind of project needs, one
 * screen at a time; the stack beside the questions gains a part with every
 * answer. The last answer lays the build out as a document. The visitor
 * approves it, which signs it, and sends it to the owner. No prices: the
 * figure is agreed after a call. A link with "#build=..." opens a sent build
 * as it was, which is how the owner opens one from his email.
 */
export function BuildWizard() {
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("steps");
  const [client, setClient] = useState<BuildClient>({ name: "", business: "" });
  const [issue, setIssue] = useState<{ reference: string; issued: Date } | null>(null);
  const [approvedOn, setApprovedOn] = useState<Date | null>(null);
  const [sentOn, setSentOn] = useState<Date | null>(null);
  const [isFromLink, setIsFromLink] = useState(false);
  /** What the visitor typed beside the build, kept here so going back to change an answer does not lose it. */
  const [draft, setDraft] = useState<BuildDraft>({ email: "", note: "" });
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const buildTitleRef = useRef<HTMLHeadingElement>(null);
  const isMoving = useRef(false);
  const direction = useRef(1);
  const hasMoved = useRef(false);

  const steps = useMemo(() => stepsFor(answers.type), [answers.type]);
  /** Before a kind of project is chosen, the bar shows the usual run of questions as a preview. */
  const shownSteps = answers.type ? steps : stepsFor("website");
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const build = useMemo(() => buildStack(answers), [answers]);
  const code = useMemo(() => (issue && answers.type ? encodeBuild({ answers, ...issue }) : ""), [answers, issue]);
  /** An approval is a signature, so it holds only while there is a name to sign with. */
  const status: BuildStatus = isFromLink
    ? { kind: "sent", on: issue?.issued ?? new Date() }
    : sentOn
      ? { kind: "sent", on: sentOn }
      : approvedOn && client.name.trim().length >= 2
        ? { kind: "approved", on: approvedOn }
        : { kind: "draft" };
  const canContinue = isStepComplete(step, answers);
  /** When a step asks more than one must-answer question, the hint names the one still waiting. */
  const unanswered = step.groups.filter((group) => group.kind === "single").length > 1
    ? step.groups.find((group) => group.kind === "single" && selectedIds(answers, group.id).length !== 1)
    : undefined;
  const isLastStep = answers.type !== null && stepIndex === steps.length - 1;
  const progress = phase === "steps" ? stepIndex / shownSteps.length : 1;

  // A sent build's link ("#build=...") opens it as it was, ready to save as a PDF: on arrival, and if
  // another link is pasted into the address bar. Read in the browser, since the server never sees the
  // part of the address after "#".
  useEffect(() => {
    const openFromLink = (): void => {
      const linkCode = codeFromHash(window.location.hash);
      const record = linkCode ? decodeBuild(linkCode) : null;
      if (!record) return;
      setAnswers(record.answers);
      setIssue({ reference: record.reference, issued: record.issued });
      // The link carries no name: who sent it is in the email it came in.
      setClient({ name: "", business: "" });
      setApprovedOn(null);
      setSentOn(null);
      setIsFromLink(true);
      setPhase("build");
    };
    const frame = window.requestAnimationFrame(openFromLink);
    window.addEventListener("hashchange", openFromLink);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", openFromLink);
    };
  }, []);

  // Each new question arrives in 3D. Changing an answer on the same question does not replay it.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || phase !== "steps" || prefersReducedMotion()) return;
    return arrive(stage, direction.current);
  }, [stepIndex, phase]);

  // After a move, bring what is new into view and start a screen reader at its heading:
  // the question's, or the build's once it has been laid out.
  useEffect(() => {
    if (!hasMoved.current) return;
    const root = rootRef.current;
    if (root && root.getBoundingClientRect().top < 0) root.scrollIntoView({ block: "start", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    if (phase === "steps") headingRef.current?.focus({ preventScroll: true });
    if (phase === "build") buildTitleRef.current?.focus({ preventScroll: true });
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
    setIssue({ reference: buildNumber(issued, Math.floor(Math.random() * 10000)), issued });
    setPhase("build");
  }, []);

  /** Out of a build opened from a link, and its code out of the address. */
  const leaveLink = (): void => {
    if (!isFromLink) return;
    window.history.replaceState(null, "", window.location.pathname);
    setIsFromLink(false);
  };

  /** A signature is for a name: a new name, or a new business under it, has to be approved again. */
  const handleClientChange = (next: BuildClient): void => {
    if (next.name !== client.name || next.business !== client.business) setApprovedOn(null);
    setClient(next);
  };

  /** A changed build is a new one to check: the approval, and any sending, start again. */
  const clearApproval = (): void => {
    setApprovedOn(null);
    setSentOn(null);
  };

  const handleRestart = (): void => {
    hasMoved.current = true;
    direction.current = -1;
    leaveLink();
    setAnswers(EMPTY_ANSWERS);
    setStepIndex(0);
    setIssue(null);
    clearApproval();
    setPhase("steps");
  };

  const handleEdit = (): void => {
    hasMoved.current = true;
    direction.current = -1;
    // Changing a build that came from a link makes it the visitor's own: no longer "sent", and theirs to approve.
    leaveLink();
    clearApproval();
    setPhase("steps");
  };

  /** Back to an earlier question from the bar: from the questions, or from the finished build. */
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
            <span className="text-accent-text">[</span> Build your stack <span className="text-accent-text">]</span>
          </h1>
          <p className="label max-sm:hidden">For when you know what you want · Approve it, send it to me</p>
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
            <li className={`label flex items-center gap-2 py-1 ${phase === "build" ? "text-paper" : "text-paper/35"}`}>
              <span aria-hidden="true" className={phase === "build" ? "text-accent-text" : ""}>
                ✓
              </span>
              Your build
            </li>
          </ol>
          <div className="start-track mt-3">
            <div className="start-track-fill" style={{ transform: `scaleX(${progress})` }} />
          </div>
        </nav>
      </div>

      {phase === "build" && build && issue ? (
        // The sheet is drawn at the size of an A4 page, so it sits beside the actions only where a page's width fits.
        <div className="mt-7 grid gap-10 sm:mt-10 xl:grid-cols-[minmax(0,54rem)_21rem] xl:justify-center">
          <BuildSheet build={build} reference={issue.reference} issued={issue.issued} client={client} status={status} titleRef={buildTitleRef} />
          <div className="self-start xl:sticky xl:top-24">
            {isFromLink ? (
              <OpenedFromLink onRestart={handleRestart} />
            ) : (
              <BuildActions
                build={build}
                code={code}
                reference={issue.reference}
                client={client}
                onClientChange={handleClientChange}
                draft={draft}
                onDraftChange={setDraft}
                status={status}
                onApprove={(isApproved) => setApprovedOn(isApproved ? new Date() : null)}
                onSent={() => setSentOn(new Date())}
                onEdit={handleEdit}
                onRestart={handleRestart}
              />
            )}
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
                    {isLastStep ? "See my build" : "Continue"}
                    <Arrow />
                  </button>
                  <p className="label max-sm:hidden">
                    {canContinue ? "Or press Enter" : unanswered ? `Choose ${unanswered.legend.toLowerCase()} to continue` : "Choose one to continue"}
                  </p>
                  {/* On small screens the stack is below the questions, so its count rides here:
                      beside the buttons on a tablet, on its own line above them on a phone. */}
                  {build ? (
                    <p aria-hidden="true" className="flex items-baseline gap-3 max-sm:order-first max-sm:w-full max-sm:justify-between sm:ml-auto lg:hidden">
                      <span className="label">In your stack</span>
                      <span className="heading text-2xl text-accent">
                        <CountUp value={build.parts.length} announce="" /> parts
                      </span>
                    </p>
                  ) : null}
                </div>
              </>
            )}
          </form>
          <div className="self-start lg:sticky lg:top-24">
            <LiveBuild build={build} />
          </div>
        </div>
      )}
    </div>
  );
}
