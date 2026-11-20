"use client";

import { useId, useState, type FormEvent } from "react";
import { contact } from "@/content/home";
import { MESSAGE_MAX, type ApiResponse, type FieldErrors } from "@/lib/contact";
import { Email } from "@/components/ui/Email";
import { Arrow } from "@/components/ui/primitives";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; message: string; showEmail: boolean };

const inputClass =
  "w-full border-b border-line bg-transparent px-0 py-3 text-paper transition-colors placeholder:text-paper/30 focus:border-paper focus:outline-none aria-[invalid=true]:border-accent";

interface FieldProps {
  step: string;
  label: string;
  name: string;
  error?: string;
  optional?: boolean;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby": string | undefined }) => React.ReactNode;
}

function Field({ step, label, name, error, optional = false, children }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="label flex justify-between">
        <span>
          {step} · {label}
        </span>
        {optional ? <span className="text-paper/40">Optional</span> : null}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": error ? errorId : undefined })}
      {error ? (
        <p id={errorId} data-field-error={name} className="label mt-2 text-accent normal-case tracking-normal">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Field order on screen, so focus lands on the first problem a reader would meet. */
const FIELD_ORDER = ["name", "email", "need", "budget", "timeline", "message"] as const;

function focusFirstInvalid(form: HTMLFormElement, fields: FieldErrors): void {
  const first = FIELD_ORDER.find((name) => fields[name]);
  if (!first) return;
  form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
}

export function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [messageLength, setMessageLength] = useState(0);
  const isSending = status.kind === "sending";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    setStatus({ kind: "sending" });
    setErrors({});

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // A proxy or platform error page is not JSON; treat it as a failed send, not a lost connection.
      const result = (await response.json().catch(() => ({ success: false }))) as ApiResponse<null>;

      if (response.ok && result.success) {
        form.reset();
        setMessageLength(0);
        setStatus({ kind: "sent" });
        return;
      }
      const fields = result.fields ?? {};
      setErrors(fields);
      focusFirstInvalid(form, fields);
      setStatus({
        kind: "error",
        message: result.error ?? "The message didn't send. Try again in a moment.",
        showEmail: response.status >= 500,
      });
    } catch {
      setStatus({ kind: "error", message: "No connection. Check your network and send again.", showEmail: true });
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="contact-form crosshair border border-line bg-ink/80 p-5 backdrop-blur-sm md:p-8">
      <div className="label flex items-center justify-between">
        <span aria-hidden="true">
          &gt; new_message
          <span className="animate-blink">_</span>
        </span>
        <span className="text-paper/40">Reply in two working days</span>
      </div>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <Field step="01" label="Name" name="name" error={errors.name}>
          {(props) => <input {...props} name="name" type="text" autoComplete="name" required maxLength={80} placeholder="Your name" className={inputClass} />}
        </Field>
        <Field step="02" label="Email" name="email" error={errors.email}>
          {(props) => (
            <input {...props} name="email" type="email" autoComplete="email" required maxLength={160} placeholder="name@example.com" className={inputClass} />
          )}
        </Field>
      </div>

      <fieldset className="mt-8" aria-describedby={errors.need ? "need-error" : undefined}>
        <legend className="label">03 · What you need</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {contact.needs.map((need, i) => (
            <label key={need} className="cursor-pointer">
              <input type="radio" name="need" value={need} defaultChecked={i === 0} className="peer sr-only" />
              <span className="chip px-3! py-1.5! peer-checked:border-paper peer-checked:bg-paper peer-checked:text-ink peer-focus-visible:outline peer-focus-visible:outline-offset-2 peer-focus-visible:outline-paper">
                {need}
              </span>
            </label>
          ))}
        </div>
        {errors.need ? (
          <p id="need-error" className="label mt-2 text-accent normal-case tracking-normal">
            {errors.need}
          </p>
        ) : null}
      </fieldset>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <Field step="04" label="Budget" name="budget" error={errors.budget} optional>
          {(props) => <input {...props} name="budget" type="text" maxLength={80} placeholder="A range is fine" className={inputClass} />}
        </Field>
        <Field step="05" label="Timeline" name="timeline" error={errors.timeline} optional>
          {(props) => <input {...props} name="timeline" type="text" maxLength={80} placeholder="When it needs to be live" className={inputClass} />}
        </Field>
      </div>

      <div className="mt-8">
        <Field step="06" label="Message" name="message" error={errors.message}>
          {(props) => (
            <textarea
              {...props}
              name="message"
              required
              rows={5}
              maxLength={MESSAGE_MAX}
              placeholder="What you're working on"
              onChange={(event) => setMessageLength(event.target.value.length)}
              className={`${inputClass} resize-y`}
            />
          )}
        </Field>
        <p className="label mt-2 text-right text-paper/40 tabular-nums">
          {messageLength} / {MESSAGE_MAX}
        </p>
      </div>

      {/* Honeypot: hidden from people and assistive tech, tempting for bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <label>
          Leave this field empty
          <input type="text" name="ref_code" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <button type="submit" disabled={isSending} data-magnetic className="btn-solid mt-8 w-full py-4!">
        {isSending ? "Sending" : "Send message"}
        <Arrow />
      </button>

      <div role="status" aria-live="polite" className="mt-4 min-h-6 text-sm">
        {status.kind === "sent" ? <p className="text-paper">{contact.sent}</p> : null}
        {status.kind === "error" ? (
          <p className="text-accent">
            {status.message}
            {status.showEmail ? (
              <>
                {" "}
                Email me instead: <Email className="text-paper underline underline-offset-4" />
              </>
            ) : null}
          </p>
        ) : null}
      </div>
    </form>
  );
}
