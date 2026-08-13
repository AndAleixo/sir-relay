import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { signupForm } from "@/app/actions/auth";
import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { PasswordFormFields } from "@/components/auth/password-form-fields";
import { authShellStyles } from "@/components/layout/auth-shell.styles";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { resolveEntryPath } from "@/lib/entry-route";
import { getServices } from "@/services";

const errorKeys = {
  short: "passwordTooShort",
  weak: "passwordTooWeak",
  mismatch: "passwordMismatch",
  taken: "emailTaken",
  legal: "legalRequired",
} as const;

export default async function SignupPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  const t = await getTranslations();
  const session = await getServices().auth.getSession();

  if (session) {
    redirect(resolveEntryPath(locale, session));
  }

  const errorKey =
    error && error in errorKeys ? errorKeys[error as keyof typeof errorKeys] : null;

  return (
    <div className={`${authShellStyles.shell} flex min-h-screen flex-col`}>
      <div className={authShellStyles.loginWrap}>
        <AuthPageHeader locale={locale} />
        <Card>
          <CardBody className="space-y-4">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                {t("auth.signupTitle")}
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{t("auth.signupSubtitle")}</p>
            </div>
            {errorKey ? (
              <p className="rounded-button border border-[var(--severity-soft-hover)] bg-[var(--severity-soft)] px-3 py-2 text-center text-sm text-[var(--severity)]">
                {t(`auth.${errorKey}`)}
              </p>
            ) : null}
            <form action={signupForm.bind(null, locale)} className="space-y-4">
              <div>
                <Label htmlFor="name">{t("auth.name")}</Label>
                <Input id="name" name="name" required autoComplete="name" />
              </div>
              <div>
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input id="email" name="email" type="email" required autoComplete="email" />
              </div>
              <PasswordFormFields
                requireCurrent={false}
                labels={{
                  currentPassword: t("auth.currentPassword"),
                  newPassword: t("auth.newPassword"),
                  confirmPassword: t("auth.confirmPassword"),
                  passwordHint: t("auth.passwordHint"),
                }}
              />
              <label className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  name="acceptLegal"
                  value="1"
                  required
                  className="mt-1"
                />
                <span>
                  {t.rich("legal.signupAccept", {
                    terms: (chunks) => (
                      <Link
                        href={`/${locale}/terms`}
                        className="font-medium text-brand-accent hover:text-brand-accent-hover"
                      >
                        {chunks}
                      </Link>
                    ),
                    privacy: (chunks) => (
                      <Link
                        href={`/${locale}/privacy`}
                        className="font-medium text-brand-accent hover:text-brand-accent-hover"
                      >
                        {chunks}
                      </Link>
                    ),
                  })}
                </span>
              </label>
              <Button type="submit" className="w-full">
                {t("auth.signup")}
              </Button>
            </form>
            <p className="text-center text-sm text-[var(--text-muted)]">
              {t("auth.hasAccount")}{" "}
              <Link
                href={`/${locale}/login`}
                className="font-medium text-brand-accent hover:text-brand-accent-hover"
              >
                {t("auth.login")}
              </Link>
            </p>
          </CardBody>
        </Card>
      </div>
      <SiteFooter locale={locale} />
    </div>
  );
}
