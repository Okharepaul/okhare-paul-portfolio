import { z } from "zod";
import { contact } from "@/content/home";

export const MESSAGE_MAX = 2000;

const singleLine = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    // Header-injection guard: these fields end up in an email subject and reply-to.
    .refine((value) => !/[\r\n]/.test(value), "Remove the line breaks from this field.");

export const contactSchema = z.object({
  name: singleLine(80).min(2, "Enter your name."),
  email: z.email("Enter an email address like name@example.com.").max(160),
  need: z.enum(contact.needs, { error: "Choose what you need." }),
  budget: singleLine(80).optional().default(""),
  timeline: singleLine(80).optional().default(""),
  message: z
    .string()
    .trim()
    .min(10, "Write at least a sentence about what you're working on.")
    .max(MESSAGE_MAX, `Keep the message under ${MESSAGE_MAX} characters.`),
  /** Honeypot. People never see this field; bots fill it in. */
  ref_code: z.string().max(0).optional().default(""),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type FieldErrors = Partial<Record<keyof ContactInput, string>>;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  fields?: FieldErrors;
}

/** First message per field, ready to show next to the input. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  return error.issues.reduce<FieldErrors>((fields, issue) => {
    const key = issue.path[0];
    if (typeof key !== "string" || key in fields) return fields;
    return { ...fields, [key]: issue.message };
  }, {});
}

/** Plain-text email body. No HTML, so nothing a visitor types can be rendered as markup. */
export function formatMessage(input: ContactInput): string {
  return [
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Need: ${input.need}`,
    `Budget: ${input.budget || "—"}`,
    `Timeline: ${input.timeline || "—"}`,
    "",
    input.message,
  ].join("\n");
}
