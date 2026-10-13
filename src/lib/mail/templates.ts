import { appBaseUrl } from "@/lib/mail/mail";
import type { Locale } from "@/domain/types";

const copy = {
  "en-gb": {
    verifySubject: "Confirm your SRelay email",
    verifyText: (url: string) =>
      `Confirm your email (valid 24 hours): open this link, then click Confirm email:\n\n${url}\n\nIf you did not sign up, ignore this message.`,
    resetSubject: "Reset your SRelay password",
    resetText: (url: string) =>
      `Reset your password with this link (valid 1 hour):\n\n${url}\n\nIf you did not request this, ignore this message.`,
  },
  "es-es": {
    verifySubject: "Confirma tu email de SRelay",
    verifyText: (url: string) =>
      `Confirma tu email (válido 24 horas): abre este enlace y pulsa Confirmar correo:\n\n${url}\n\nSi no te registraste, ignora este mensaje.`,
    resetSubject: "Restablece tu contraseña de SRelay",
    resetText: (url: string) =>
      `Restablece tu contraseña con este enlace (válido 1 hora):\n\n${url}\n\nSi no lo pediste, ignora este mensaje.`,
  },
  "pt-br": {
    verifySubject: "Confirme o seu email SRelay",
    verifyText: (url: string) =>
      `Confirme o email (válido 24 horas): abra este link e clique em Confirmar e-mail:\n\n${url}\n\nSe não criou a conta, ignore esta mensagem.`,
    resetSubject: "Redefina a sua senha SRelay",
    resetText: (url: string) =>
      `Redefina a senha com este link (válido 1 hora):\n\n${url}\n\nSe não pediu isto, ignore esta mensagem.`,
  },
} as const;

function pack(locale: Locale) {
  return copy[locale] ?? copy["en-gb"];
}

export function verifyEmailMail(locale: Locale, token: string) {
  const url = `${appBaseUrl()}/${locale}/verify-email?token=${encodeURIComponent(token)}`;
  const t = pack(locale);
  return { subject: t.verifySubject, text: t.verifyText(url) };
}

export function resetPasswordMail(locale: Locale, token: string) {
  const url = `${appBaseUrl()}/${locale}/reset-password?token=${encodeURIComponent(token)}`;
  const t = pack(locale);
  return { subject: t.resetSubject, text: t.resetText(url) };
}
