import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { contactForm } from "@/app/actions/contact";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { authShellStyles } from "@/components/layout/auth-shell.styles";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { locale } = await params;
  const { sent, error } = await searchParams;
  const t = await getTranslations();

  return (
    <div className={`${authShellStyles.shell} flex min-h-screen flex-col`}>
      <div className={authShellStyles.loginWrap}>
        <AuthPageHeader locale={locale} />
        <Card>
          <CardBody className="space-y-4">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                {t("contact.title")}
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {t("contact.subtitle")}
              </p>
            </div>
            {sent === "1" ? (
              <p className="rounded-button border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-900">
                {t("contact.sent")}
              </p>
            ) : null}
            {error === "invalid" ? (
              <p className="rounded-button border border-[var(--severity-soft-hover)] bg-[var(--severity-soft)] px-3 py-2 text-center text-sm text-[var(--severity)]">
                {t("contact.errorInvalid")}
              </p>
            ) : null}
            {error === "rate" ? (
              <p className="rounded-button border border-[var(--severity-soft-hover)] bg-[var(--severity-soft)] px-3 py-2 text-center text-sm text-[var(--severity)]">
                {t("contact.errorRate")}
              </p>
            ) : null}
            {error === "failed" ? (
              <p className="rounded-button border border-[var(--severity-soft-hover)] bg-[var(--severity-soft)] px-3 py-2 text-center text-sm text-[var(--severity)]">
                {t("contact.errorFailed")}
              </p>
            ) : null}
            {sent !== "1" ? (
              <form action={contactForm.bind(null, locale)} className="space-y-4">
                <div className="hidden" aria-hidden="true">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" name="company" tabIndex={-1} autoComplete="off" />
                </div>
                <div>
                  <Label htmlFor="name">{t("contact.name")}</Label>
                  <Input id="name" name="name" required maxLength={80} autoComplete="name" />
                </div>
                <div>
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    maxLength={200}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label htmlFor="message">{t("contact.message")}</Label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    maxLength={4000}
                    rows={5}
                    className="min-h-[8rem]"
                  />
                </div>
                <Button type="submit" className="w-full">
                  {t("contact.send")}
                </Button>
              </form>
            ) : (
              <p className="text-center text-sm">
                <Link
                  href={`/${locale}`}
                  className="font-medium text-brand-accent hover:text-brand-accent-hover"
                >
                  {t("auth.backToHome")}
                </Link>
              </p>
            )}
          </CardBody>
        </Card>
      </div>
      <SiteFooter locale={locale} />
    </div>
  );
}
