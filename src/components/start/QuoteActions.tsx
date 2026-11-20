"use client";

import { useId, useState, type FormEvent } from "react";
import { contact } from "@/content/home";
import type { ProjectTypeId } from "@/content/quote";
import { site } from "@/content/site";
import { Arrow } from "@/components/ui/primitives";
import { MESSAGE_MAX, type ApiResponse } from "@/lib/contact";
import { formatGBP, quoteMessage, type Quote, type QuoteClient } from "@/lib/quote";

type QuoteActionsProps = {
  quote: Quote;
  reference: string;
  client: QuoteClient;
  onClientChange: (client: QuoteClient) => void;
  /** Back to the questions, answers kept. */
  onEdit: () => void;
  /** Back to the first question, answers cleared. */
  onRestart: () => void;
};

type SendStatus = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "failed"; message: string };

type FieldErrors = { name?: string; email?: string };

type ContactNeed = (typeof contact.needs)[number];

/** The contact form's own categories, so an estimate arrives filed like any other message. */
const NEED_FOR: Record<ProjectTypeId, ContactNeed> = {
  website: "Web app",
  store: "Web app",
  webapp: "Web app",
  automation: "AI",
  chatbot: "AI",
  brand: "Brand & design",
};

const NOTE_MAX = 400;
const SEND_TIMEOUT_MS = 15000;
/** An email link is a web address, and long ones are cut short by mail programs: its text is kept well under theirs. */
const EMAIL_LINK_MAX = 900;

const inputClass =
  "w-full border-b border-line bg-transparent px-0 py-2.5 text-paper transition-colors placeholder:text-paper/30 focus:border-paper focus:outline-none aria-[invalid=true]:border-accent";

/** Reads the endpoint's answer, or null when what came back was not its JSON (a gateway's error page, say). */
async function readResult(response: Response): Promise<ApiResponse<null> | null> {
  try {
    return (await response.json()) as ApiResponse<null>;
  } catch {
    return null;
  }
}

/**
 * What a visitor can do with a finished estimate: put their name on it, save
 * it as a PDF, send it to the owner, or go back and change an answer. Sending
 * uses the site's contact form; if that is not connected, it says so and
 * offers the same message as an email instead.
 */
export function QuoteActions({ quote, reference, client, onClientChange, onEdit, onRestart }: QuoteActionsProps) {
  const id = useId();
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [status, setStatus] = useState<SendStatus>({ kind: "idle" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [note, setNote] = useState("");

  const handleSend = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setErrors({});
    setStatus({ kind: "sending" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
        body: JSON.stringify({
          name: client.name.trim(),
          email: String(data.get("email") ?? "").trim(),
          need: NEED_FOR[quote.type.id],
          budget: formatGBP(quote.total),
          timeline: quote.summary.find((row) => row.label === "Pace")?.value ?? "",
          message: quoteMessage(quote, reference, { max: MESSAGE_MAX, client, note }),
          ref_code: String(data.get("ref_code") ?? ""),
        }),
      });
      const result = await readResult(response);
      if (result?.success) {
        setStatus({ kind: "sent" });
        return;
      }
      setErrors({ name: result?.fields?.name, email: result?.fields?.email });
      setStatus({ kind: "failed", message: result?.error ?? "The estimate did not send. Something went wrong on my side." });
    } catch {
      setStatus({ kind: "failed", message: "The estimate did not send. Check your connection and try again." });
    }
  };

  /**
   * The estimate handed to the visitor's own email program, in its short form
   * so the link survives. The address is put together here, never in the page source.
   */
  const handleEmailInstead = (): void => {
    const address = `${site.email.user}@${site.email.domain}`;
    const subject = encodeURIComponent(`Estimate ${reference} · ${quote.type.label}`);
    const body = encodeURIComponent(quoteMessage(quote, reference, { max: EMAIL_LINK_MAX, client, note, isBrief: true }));
    window.location.href = `mailto:${address}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="start-chrome flex flex-col gap-8">
      <div>
        <p className="label text-paper">Put your name on it</p>
        <div className="mt-3 grid gap-4">
          <div>
            <label htmlFor={`${id}-name`} className="label">
              Your name
            </label>
            <input
              id={`${id}-name`}
              type="text"
              autoComplete="name"
              maxLength={80}
              value={client.name}
              onChange={(event) => onClientChange({ ...client, name: event.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor={`${id}-business`} className="label flex justify-between">
              Business <span className="text-paper/40">Optional</span>
            </label>
            <input
              id={`${id}-business`}
              type="text"
              autoComplete="organization"
              maxLength={80}
              value={client.business}
              onChange={(event) => onClientChange({ ...client, business: event.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button type="button" onClick={() => window.print()} data-magnetic className="btn-solid justify-between">
          Save as PDF
          <Arrow direction="down" />
        </button>
        <button
          type="button"
          aria-expanded={isSendOpen}
          aria-controls={`${id}-send`}
          onClick={() => setIsSendOpen((open) => !open)}
          data-magnetic
          className="btn-accent justify-between"
        >
          Send it to Paul
          <Arrow direction={isSendOpen ? "up" : "right"} />
        </button>
      </div>

      <div id={`${id}-send`} hidden={!isSendOpen}>
        {status.kind === "sent" ? (
          <p role="status" className="border border-line px-4 py-4 text-sm leading-relaxed">
            Sent. I have your estimate and will reply within two working days.
          </p>
        ) : (
          <form onSubmit={handleSend} noValidate className="flex flex-col gap-4 border border-line px-4 py-4">
            {/* The same name as on the estimate: typing in either place changes both. */}
            <div>
              <label htmlFor={`${id}-send-name`} className="label">
                Your name
              </label>
              <input
                id={`${id}-send-name`}
                name="name"
                type="text"
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
                value={client.name}
                onChange={(event) => onClientChange({ ...client, name: event.target.value })}
                aria-invalid={errors.name !== undefined}
                aria-describedby={errors.name ? `${id}-name-error` : undefined}
                className={inputClass}
              />
              {errors.name ? (
                <p id={`${id}-name-error`} className="label mt-2 text-accent normal-case tracking-normal">
                  {errors.name}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor={`${id}-send-email`} className="label">
                Email
              </label>
              <input
                id={`${id}-send-email`}
                name="email"
                type="email"
                required
                maxLength={160}
                autoComplete="email"
                aria-invalid={errors.email !== undefined}
                aria-describedby={errors.email ? `${id}-email-error` : undefined}
                className={inputClass}
              />
              {errors.email ? (
                <p id={`${id}-email-error`} className="label mt-2 text-accent normal-case tracking-normal">
                  {errors.email}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor={`${id}-send-note`} className="label flex justify-between">
                Anything to add <span className="text-paper/40">Optional</span>
              </label>
              <textarea
                id={`${id}-send-note`}
                name="note"
                rows={3}
                maxLength={NOTE_MAX}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className={`${inputClass} resize-none`}
              />
            </div>
            {/* Honeypot: people never see this field; bots fill it in. */}
            <input type="text" name="ref_code" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

            <button type="submit" disabled={status.kind === "sending"} className="btn btn-solid justify-between">
              {status.kind === "sending" ? "Sending" : "Send the estimate"}
              <Arrow />
            </button>

            {status.kind === "failed" ? (
              <div role="alert" className="text-sm leading-relaxed">
                <p>{status.message}</p>
                <button type="button" onClick={handleEmailInstead} className="mt-2 text-accent-text underline underline-offset-4">
                  Email it to me instead
                </button>
              </div>
            ) : null}
          </form>
        )}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-5">
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
}
