import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { authShellStyles } from "@/components/layout/auth-shell.styles";

type AuthPageHeaderProps = {
  locale: string;
};

export async function AuthPageHeader({ locale }: AuthPageHeaderProps) {
  const t = await getTranslations();

  return (
    <div className="mb-6 space-y-3">
      <Link href={`/${locale}`} aria-label={t("auth.backToHome")} className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo.svg" alt={t("common.appName")} className={authShellStyles.loginLogo} />
      </Link>
      <p className="text-center">
        <Link
          href={`/${locale}`}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          ← {t("auth.backToHome")}
        </Link>
      </p>
    </div>
  );
}
