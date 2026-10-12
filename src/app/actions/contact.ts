"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sendContactMail } from "@/lib/mail/mail";
import {
  clientIpFromHeaders,
  consumeRateLimit,
  type RateLimitStore,
} from "@/lib/rate-limit";

const contactRateStore: RateLimitStore = new Map();
const CONTACT_RATE = { limit: 5, windowMs: 60 * 60 * 1000 } as const;

export async function contactForm(locale: string, formData: FormData) {
  // Honeypot — bots fill hidden fields; humans leave empty.
  if (String(formData.get("company") ?? "").trim()) {
    redirect(`/${locale}/contact?sent=1`);
  }

  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);
  const message = String(formData.get("message") ?? "").trim().slice(0, 4000);

  if (name.length < 2 || !email.includes("@") || message.length < 10) {
    redirect(`/${locale}/contact?error=invalid`);
  }

  const h = await headers();
  const ip = clientIpFromHeaders(h);
  const limited = consumeRateLimit(
    contactRateStore,
    `contact:${ip}`,
    CONTACT_RATE.limit,
    CONTACT_RATE.windowMs,
  );
  if (!limited.ok) {
    redirect(`/${locale}/contact?error=rate`);
  }

  try {
    await sendContactMail({ name, email, message });
  } catch {
    redirect(`/${locale}/contact?error=failed`);
  }

  redirect(`/${locale}/contact?sent=1`);
}
