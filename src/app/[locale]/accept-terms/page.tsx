import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { acceptLegalForm } from "@/app/actions/auth";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { authShellStyles } from "@/components/layout/auth-shell.styles";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { resolveEntryPath } from "@/lib/entry-route";
import { LEGAL_DOCUMENT } from "@/lib/legal";
import { getServices } from "@/services";

export default async function AcceptTermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const session = await getServices().auth.getSession();
  if (!session) redirect(`/${locale}/login`);
  if (session.user.mustChangePassword) {
    redirect(`/${locale}/change-password`);
  }
  if (!session.user.needsLegalAccept) {
    redirect(resolveEntryPath(locale, session));
  }

  const doc = LEGAL_DOCUMENT;

  return (
    <div className={`${authShellStyles.shell} flex min-h-screen flex-col`}>
      <div className="mx-auto w-full max-w-2xl flex-1 py-12">
        <AuthPageHeader locale={locale} />
        <Card>
          <CardBody className="space-y-6">
            <header className="space-y-2">
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                {t("legal.acceptTitle")}
              </h1>
              <p className="text-sm text-[var(--text-muted)]">
                {t("legal.acceptIntro", { version: doc.version })}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {t("legal.canonicalNote")}
              </p>
            </header>

            <section className="max-h-[50vh] space-y-6 overflow-y-auto rounded-button border border-[var(--border)] p-4">
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  {doc.termsTitle}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">{doc.updated}</p>
                <p className="text-sm text-[var(--text-primary)]">{doc.termsIntro}</p>
                {doc.terms.map((s) => (
                  <div key={s.title} className="space-y-1">
                    <h3 className="text-sm font-medium text-[var(--text-primary)]">
                      {s.title}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] whitespace-pre-line">
                      {s.body}
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-3 border-t border-[var(--border)] pt-4">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                  {doc.privacyTitle}
                </h2>
                <p className="text-sm text-[var(--text-primary)]">{doc.privacyIntro}</p>
                {doc.privacy.map((s) => (
                  <div key={s.title} className="space-y-1">
                    <h3 className="text-sm font-medium text-[var(--text-primary)]">
                      {s.title}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] whitespace-pre-line">
                      {s.body}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <form action={acceptLegalForm.bind(null, locale)} className="space-y-4">
              <label className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  name="acceptLegal"
                  value="1"
                  required
                  className="mt-1"
                />
                <span>{t("legal.acceptCheckbox", { version: doc.version })}</span>
              </label>
              <Button type="submit" className="w-full">
                {t("legal.acceptSubmit")}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
      <SiteFooter locale={locale} />
    </div>
  );
}
