import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/app-shell";
import { ProfileAvatarEditor } from "@/components/profile/profile-avatar-editor";
import { ChangePasswordSection } from "@/components/profile/change-password-section";
import { ToneBadge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { getServices } from "@/services";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  const t = await getTranslations();
  const { auth, teammates } = getServices();
  const session = await auth.getSession();
  if (!session) return null;

  const { user } = session;
  const teammate =
    user.role === "teammate" ? await teammates.getTeammate(user.id) : null;

  return (
    <>
      <PageHeader title={t("profile.title")} />
      <div className="grid max-w-lg gap-4">
        <Card>
          <CardBody className="space-y-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {t("profile.photo")}
              </p>
              <div className="mt-3">
                <ProfileAvatarEditor userId={user.id} userName={user.name} />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-4">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {t("profile.accountInfo")}
            </p>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[var(--text-muted)]">{t("auth.email")}</dt>
                <dd className="font-medium text-[var(--text-primary)]">{user.email}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">{t("profile.displayName")}</dt>
                <dd className="font-medium text-[var(--text-primary)]">{user.name}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-muted)]">{t("profile.role")}</dt>
                <dd>
                  <span className="inline-flex rounded-full bg-brand-accent-soft px-2.5 py-0.5 text-xs font-medium text-brand-accent">
                    {t(`roles.${user.role}`)}
                  </span>
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>

        {teammate ? (
          <Card>
            <CardBody className="space-y-4">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {t("profile.telegramSection")}
              </p>
              <ToneBadge tone={teammate.telegramStatus === "linked" ? "success" : "warning"}>
                {teammate.telegramStatus === "linked"
                  ? t("teammate.linked")
                  : t("teammate.pending")}
              </ToneBadge>
              <p className="text-sm text-[var(--text-muted)]">
                {teammate.telegramStatus === "linked"
                  ? t("profile.telegramLinkedHint")
                  : t("profile.telegramPendingHint")}
              </p>
            </CardBody>
          </Card>
        ) : null}

        <Card>
          <CardBody className="space-y-4">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {t("profile.security")}
            </p>
            <ChangePasswordSection />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
