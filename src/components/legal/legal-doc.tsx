import Link from "next/link";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { authShellStyles } from "@/components/layout/auth-shell.styles";
import { SiteFooter } from "@/components/layout/site-footer";
import { Card, CardBody } from "@/components/ui/card";
import type { LegalSection } from "@/lib/legal";

export type { LegalSection };

type LegalDocProps = {
  locale: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
  contact: string;
  loginLabel: string;
  note?: string;
};

export function LegalDoc({
  locale,
  title,
  updated,
  intro,
  sections,
  contact,
  loginLabel,
  note,
}: LegalDocProps) {
  return (
    <div className={`${authShellStyles.shell} flex min-h-screen flex-col`}>
      <div className="mx-auto w-full max-w-2xl flex-1 py-12">
        <AuthPageHeader locale={locale} />
        <Card>
          <CardBody className="space-y-6">
            <header className="space-y-2">
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                {title}
              </h1>
              <p className="text-xs text-[var(--text-muted)]">{updated}</p>
              {note ? (
                <p className="text-xs text-[var(--text-muted)]">{note}</p>
              ) : null}
              <p className="text-sm text-[var(--text-primary)]">{intro}</p>
            </header>

            {sections.map((section) => (
              <section key={section.title} className="space-y-2">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  {section.title}
                </h2>
                <p className="text-sm leading-relaxed text-[var(--text-muted)] whitespace-pre-line">
                  {section.body}
                </p>
              </section>
            ))}

            <p className="text-sm text-[var(--text-primary)]">{contact}</p>

            <Link
              href={`/${locale}/login`}
              className="inline-block text-sm font-medium text-brand-accent hover:text-brand-accent-hover"
            >
              {loginLabel}
            </Link>
          </CardBody>
        </Card>
      </div>
      <SiteFooter locale={locale} />
    </div>
  );
}
