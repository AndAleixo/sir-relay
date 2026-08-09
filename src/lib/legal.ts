import legalEn from "../../legal/en.json";

export type LegalSection = { title: string; body: string };

export type LegalDocument = {
  version: string;
  termsTitle: string;
  privacyTitle: string;
  updated: string;
  termsIntro: string;
  privacyIntro: string;
  terms: LegalSection[];
  privacy: LegalSection[];
};

/** Canonical English legal pack — bump `version` in legal/en.json when text changes. */
export const LEGAL_DOCUMENT = legalEn as LegalDocument;

export const CURRENT_LEGAL_VERSION = LEGAL_DOCUMENT.version;

/** Public contact on Privacy / Terms (override with CONTACT_EMAIL). */
export const DEFAULT_CONTACT_EMAIL = "contact@sirrelay.com";

export function resolveContactEmail(): string {
  return process.env.CONTACT_EMAIL?.trim() || DEFAULT_CONTACT_EMAIL;
}

export function needsLegalAccept(termsVersion: string | null | undefined): boolean {
  return !termsVersion?.trim() || termsVersion.trim() !== CURRENT_LEGAL_VERSION;
}
