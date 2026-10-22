import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/app-shell";
import { AccountProfile } from "@/components/profile/account-profile";
import { telegramBotUrl } from "@/lib/app-url";
import { hasLinkToken } from "@/lib/link-token";
import { requireSession } from "@/lib/require-session";
import { getServices } from "@/services";

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    passwordError?: string;
    nameError?: string;
  }>;
}) {
  const { locale } = await params;
  const { passwordError, nameError } = await searchParams;
  const t = await getTranslations();
  const session = await requireSession(locale);
  const { teammates, users } = getServices();
  const { user } = session;
  const teammate =
    user.role === "teammate" ? await teammates.getTeammate(user.id, { session }) : null;

  const telegramStatus = teammate?.telegramStatus ?? user.telegramStatus ?? "pending";
  const telegramToken =
    telegramStatus === "pending"
      ? await users.getTelegramLinkToken(user.id, { session })
      : null;
  const telegramUrl = telegramToken ? telegramBotUrl(telegramToken) : "";

  const passwordErrorMessage =
    passwordError === "invalid"
      ? t("auth.currentPasswordInvalid")
      : passwordError === "short" || passwordError === "weak"
        ? t(passwordError === "weak" ? "auth.passwordTooWeak" : "auth.passwordTooShort")
        : passwordError === "mismatch"
          ? t("auth.passwordMismatch")
          : null;

  const showTelegram = Boolean(teammate || user.role === "operator");
  const linkTokenActive = await hasLinkToken(user.id);

  return (
    <>
      <PageHeader
        title={t("common.account")}
        subtitle={t("profile.accountScopeHint")}
      />
      <AccountProfile
        locale={locale}
        user={user}
        hasLinkToken={linkTokenActive}
        telegramStatus={telegramStatus}
        telegramUrl={telegramUrl}
        showTelegram={showTelegram}
        nameError={nameError}
        passwordErrorMessage={passwordErrorMessage}
      />
    </>
  );
}
