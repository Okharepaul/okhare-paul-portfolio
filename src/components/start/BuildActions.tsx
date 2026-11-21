"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { site } from "@/content/site";
import { Arrow } from "@/components/ui/primitives";
import { buildBrief, buildLink, type Build, type BuildClient } from "@/lib/build";
import { ASK_NOTE_MIN, BUILD_NOTE_MAX, type BuildFieldErrors } from "@/lib/build-request";
import type { ApiResponse } from "@/lib/contact";
import type { BuildStatus } from "./BuildSheet";

type Intent = "send" | "ask";

/** The visitor's address and note. Kept by the wizard, so they survive a trip back to the questions. */
export type BuildDraft = { email: string; note: string };

type BuildActionsProps = {
  build: Build;
  /** The build as a link code, which is what is sent. */
  code: string;
  reference: string;
  client: BuildClient;
  onClientChange: (client: BuildClient) => void;
  draft: BuildDraft;
  onDraftChange: (draft: BuildDraft) => void;
  status: BuildStatus;
  onApprove: (isApproved: boolean) => void;
  onSent: () => void;
  /** Back to the questions, answers kept. */
  onEdit: () => void;
  /** Back to the first question, answers cleared. */
  onRestart: () => void;
};

type SendState = { kind: "idle" } | { kind: "sending"; intent: Intent } | { kind: "failed"; message: string };

const SEND_TIMEOUT_MS = 15000;
/** An email link is a web address, and long ones are cut short by mail programs: its text is kept well under theirs. */
const EMAIL_LINK_MAX = 900;
const NAME_MIN = 2;

const inputClass =
  "w-full border-b border-line bg-transparent px-0 py-2.5 text-paper transition-colors placeholder:text-paper/30 focus:border-paper focus:outline-none aria-[invalid=true]:border-accent";

/** Reads the endpoint's answer, or null when what came back was not its JSON (a gateway's error page, say). */
async function readResult(response: Response): Promise<ApiResponse<null, BuildFieldErrors> | null> {
  try {
    return (await response.json()) as ApiResponse<null, BuildFieldErrors>;
  } catch {
    return null;
  }
}

/** A numbered stage of the panel: details, approval, sending. */
function Stage({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <div>
      <p className="label flex items-center gap-2 text-paper">
        <span className="text-accent-text">{n}</span> {title}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="label mt-2 text-accent-text normal-case tracking-normal">
      {message}
    </p>
  ) : null;
}

/**
 * What a visitor does with a finished build, in order: put their name and
 * address on it, approve it (which signs the sheet), then send it to the
 * owner as it is, or with questions for him. Nothing goes until it is
 * approved. Sending uses the site's own endpoint; if that is not connected,
 * it says so and offers the build as an email instead, with a link that
 * opens it whole.
 */
export function BuildActions({
  build,
  code,
  reference,
  client,
  onClientChange,
  draft,
  onDraftChange,
  status,
  onApprove,
  onSent,
  onEdit,
  onRestart,
}: BuildActionsProps) {
  const id = useId();
  const { email, note } = draft;
  const [sendState, setSendState] = useState<SendState>({ kind: "idle" });
  const [errors, setErrors] = useState<BuildFieldErrors>({});
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const sentRef = useRef<HTMLParagraphElement>(null);

  // The button that sent it goes with the form, so focus moves to the confirmation and a screen reader reads it.
  useEffect(() => {
    if (status.kind === "sent") sentRef.current?.focus();
  }, [status.kind]);

  const canSign = client.name.trim().length >= NAME_MIN;
  const isApproved = status.kind === "approved";
  const isSending = sendState.kind === "sending";

  const handleSend = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!isApproved || isSending) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const intent: Intent = submitter?.value === "ask" ? "ask" : "send";
    if (intent === "ask" && note.trim().length < ASK_NOTE_MIN) {
      setErrors({ note: "Tell me what you would like to add or ask, in a sentence or two." });
      noteRef.current?.focus();
      return;
    }

    const data = new FormData(event.currentTarget);
    setErrors({});
    setSendState({ kind: "sending", intent });
    try {
      const response = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
        body: JSON.stringify({
          intent,
          build: code,
          name: client.name.trim(),
          business: client.business.trim(),
          email: email.trim(),
          note: note.trim(),
          approved: true,
          ref_code: String(data.get("ref_code") ?? ""),
        }),
      });
      const result = await readResult(response);
      if (result?.success) {
        setSendState({ kind: "idle" });
        onSent();
        return;
      }
      setErrors(result?.fields ?? {});
      setSendState({ kind: "failed", message: result?.error ?? "Your build did not send. Something went wrong on my side." });
    } catch {
      setSendState({ kind: "failed", message: "Your build did not send. Check your connection and try again." });
    }
  };

  /**
   * The build handed to the visitor's own email program, in its short form
   * with the link that opens it whole. The address is put together here,
   * never in the page source.
   */
  const handleEmailInstead = (): void => {
    const address = `${site.email.user}@${site.email.domain}`;
    const link = buildLink(window.location.origin, code);
    const subject = encodeURIComponent(`Build ${reference} · ${build.type.label}`);
    const body = encodeURIComponent(buildBrief(build, reference, { max: EMAIL_LINK_MAX, client, note, link }));
    window.location.href = `mailto:${address}?subject=${subject}&body=${body}`;
  };

  const tools = (
    <div className="flex flex-col gap-4 border-t border-line pt-5">
      <button type="button" onClick={() => window.print()} data-magnetic className="btn-solid justify-between">
        Save as PDF
        <Arrow direction="down" />
      </button>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <button type="button" onClick={onEdit} className="label flex items-center gap-2 py-1 hover:text-paper">
          <Arrow direction="left" className="size-3!" />
          Change an answer
        </button>
        <button type="button" onClick={onRestart} className="label py-1 hover:text-paper">
          Start again
        </button>
      </div>
    </div>
  );

  if (status.kind === "sent") {
    return (
      <div className="start-chrome flex flex-col gap-8">
        <div role="status" className="border border-line px-5 py-5">
          <p className="label flex items-center gap-2 text-paper">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
            Sent to Paul
          </p>
          <p ref={sentRef} tabIndex={-1} className="heading mt-3 text-3xl uppercase outline-none">
            Your build is with me
          </p>
          <p className="mt-3 text-sm leading-relaxed text-paper/70">
            I will reply to {email.trim() || "you"} within two working days. Save a copy as a PDF for your own records.
          </p>
        </div>
        {tools}
      </div>
    );
  }

  return (
    <div className="start-chrome flex flex-col gap-8">
      <form onSubmit={handleSend} noValidate className="flex flex-col gap-8">
        <Stage n="01" title="Your details">
          <div className="grid gap-4">
            <div>
              <label htmlFor={`${id}-name`} className="label">
                Your name
              </label>
              <input
                id={`${id}-name`}
                name="name"
                type="text"
                required
                autoComplete="name"
                maxLength={80}
                value={client.name}
                onChange={(event) => onClientChange({ ...client, name: event.target.value })}
                aria-invalid={errors.name !== undefined}
                aria-describedby={errors.name ? `${id}-name-error` : undefined}
                className={inputClass}
              />
              <FieldError id={`${id}-name-error`} message={errors.name} />
            </div>
            <div>
              <label htmlFor={`${id}-email`} className="label">
                Email
              </label>
              <input
                id={`${id}-email`}
                name="email"
                type="email"
                required
                autoComplete="email"
                maxLength={160}
                value={email}
                onChange={(event) => onDraftChange({ ...draft, email: event.target.value })}
                aria-invalid={errors.email !== undefined}
                aria-describedby={errors.email ? `${id}-email-error` : undefined}
                className={inputClass}
              />
              <FieldError id={`${id}-email-error`} message={errors.email} />
            </div>
            <div>
              <label htmlFor={`${id}-business`} className="label flex justify-between">
                Business <span className="text-paper/40">Optional</span>
              </label>
              <input
                id={`${id}-business`}
                name="business"
                type="text"
                autoComplete="organization"
                maxLength={80}
                value={client.business}
                onChange={(event) => onClientChange({ ...client, business: event.target.value })}
                aria-invalid={errors.business !== undefined}
                aria-describedby={errors.business ? `${id}-business-error` : undefined}
                className={inputClass}
              />
              <FieldError id={`${id}-business-error`} message={errors.business} />
            </div>
          </div>
        </Stage>

        <Stage n="02" title="Approve it">
          {/* The same tile as the answers: approving floods it, and signs the sheet. */}
          <label className="tile approve-tile" data-selected={isApproved} data-disabled={!canSign}>
            <input
              type="checkbox"
              checked={isApproved}
              disabled={!canSign}
              onChange={(event) => onApprove(event.target.checked)}
              aria-invalid={errors.approved !== undefined}
              aria-describedby={errors.approved ? `${id}-approve-hint ${id}-approved-error` : `${id}-approve-hint`}
              className="sr-only"
            />
            <span aria-hidden="true" className="tile-fill" />
            <span className="tile-top">
              <span aria-hidden="true" className="tile-index">
                Sign
              </span>
              <span aria-hidden="true" className="tile-mark">
                <svg viewBox="0 0 12 12" fill="none" strokeWidth="2" strokeLinecap="square">
                  <path d="M2 6.5l2.6 2.6L10 3.4" />
                </svg>
              </span>
            </span>
            <span className="tile-label">I approve this build</span>
            <span className="tile-detail">I have checked every part, and it is what I want to send.</span>
          </label>
          <p id={`${id}-approve-hint`} className="mt-2.5 text-[0.8125rem] leading-relaxed text-paper/60">
            {canSign
              ? isApproved
                ? "Signed. Your name is on the build."
                : "Your name goes on the build as its signature."
              : "Add your name above to sign it."}
          </p>
          <FieldError id={`${id}-approved-error`} message={errors.approved} />
        </Stage>

        <Stage n="03" title="Send it to Paul">
          <div>
            <label htmlFor={`${id}-note`} className="label flex justify-between">
              Anything to add <span className="text-paper/40">Needed to ask</span>
            </label>
            <textarea
              ref={noteRef}
              id={`${id}-note`}
              name="note"
              rows={3}
              maxLength={BUILD_NOTE_MAX}
              value={note}
              onChange={(event) => onDraftChange({ ...draft, note: event.target.value })}
              placeholder="Features you did not see, dates, questions"
              aria-invalid={errors.note !== undefined}
              aria-describedby={errors.note ? `${id}-note-error` : undefined}
              className={`${inputClass} resize-none`}
            />
            <FieldError id={`${id}-note-error`} message={errors.note} />
          </div>
          {/* Honeypot: people never see this field; bots fill it in. */}
          <input type="text" name="ref_code" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

          <div className="mt-5 flex flex-col gap-3">
            <button
              type="submit"
              value="send"
              disabled={!isApproved || isSending}
              data-magnetic
              className="btn-accent justify-between disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSending && sendState.intent === "send" ? "Sending" : "Send my build to Paul"}
              <Arrow />
            </button>
            <button type="submit" value="ask" disabled={!isApproved || isSending} className="btn justify-between disabled:cursor-not-allowed disabled:opacity-40">
              {isSending && sendState.intent === "ask" ? "Sending" : "Contact Paul for more details"}
              <Arrow />
            </button>
          </div>
          <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-paper/60">
            {isApproved
              ? "Send it as it is, or ask about more features first. Either way your build goes with it."
              : "Approve your build to send it."}
          </p>

          {sendState.kind === "failed" ? (
            <div role="alert" className="mt-4 border border-line px-4 py-3 text-sm leading-relaxed">
              <p>{sendState.message}</p>
              <button type="button" onClick={handleEmailInstead} className="mt-2 text-accent-text underline underline-offset-4">
                Email it to me instead
              </button>
            </div>
          ) : null}
        </Stage>
      </form>

      {tools}
    </div>
  );
}

type OpenedFromLinkProps = {
  /** Clears the build that came with the link and starts a new one. */
  onRestart: () => void;
};

/** In place of the actions when the build came from a link, as the owner opens one from his email. */
export function OpenedFromLink({ onRestart }: OpenedFromLinkProps) {
  return (
    <div className="start-chrome flex flex-col gap-6">
      <div className="border border-line px-5 py-5">
        <p className="label text-paper">Opened from a link</p>
        <p className="mt-3 text-sm leading-relaxed text-paper/70">
          This is a build as it was sent: every part, as it was approved. Save it as a PDF, or start one of your own.
        </p>
      </div>
      <button type="button" onClick={() => window.print()} data-magnetic className="btn-solid justify-between">
        Save as PDF
        <Arrow direction="down" />
      </button>
      <button type="button" onClick={onRestart} className="btn justify-between">
        Build your own
        <Arrow />
      </button>
    </div>
  );
}
