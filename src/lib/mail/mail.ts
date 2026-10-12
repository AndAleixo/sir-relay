import { Resend } from "resend";
import { resolveContactEmail } from "@/lib/legal";

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

function mailFrom(): string {
  return process.env.MAIL_FROM?.trim() || "noreply@sirrelay.com";
}

function apiKey(): string | null {
  const key = process.env.MAIL_API_KEY?.trim();
  return key || null;
}

/** Outbound mail. Without MAIL_API_KEY → log only (dev / local). */
export async function sendMail(message: MailMessage): Promise<void> {
  const key = apiKey();
  if (!key) {
    console.info("[mail:log]", {
      to: message.to,
      subject: message.subject,
      text: message.text.slice(0, 500),
    });
    return;
  }

  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: mailFrom(),
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html ?? message.text.replace(/\n/g, "<br>\n"),
    replyTo: message.replyTo,
  });
  if (error) {
    throw new Error(error.message || "Mail send failed");
  }
}

export async function sendContactMail(input: {
  name: string;
  email: string;
  message: string;
}): Promise<void> {
  const to = resolveContactEmail();
  await sendMail({
    to,
    replyTo: input.email,
    subject: `[SRelay contact] ${input.name}`,
    text: `From: ${input.name} <${input.email}>\n\n${input.message}`,
  });
}

export function appBaseUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
