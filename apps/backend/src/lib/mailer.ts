import { Resend } from "resend";
import { env } from "../config/env.js";

const resend = new Resend(env.RESEND_API_KEY);

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  if (env.NODE_ENV === "test") return;

  if (!env.RESEND_API_KEY) {
    console.warn("[mailer] RESEND_API_KEY not set — skipping email:", opts.subject);
    return;
  }

  const result = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: Array.isArray(opts.to) ? opts.to : [opts.to],
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });

  if (result.error) {
    throw new Error(`Email send failed: ${result.error.message}`);
  }
}