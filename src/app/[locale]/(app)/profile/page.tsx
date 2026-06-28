import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/app-shell";
import { mockLogout } from "@/app/actions/mock-auth";
import { ProfileAvatarEditor } from "@/components/profile/profile-avatar-editor";
import { ChangePasswordSection } from "@/components/profile/change-password-section";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { getServices } from "@/services";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const { auth } = getServices();
  const session = await auth.getSession();
  if (!session) return null;

  const { user } = session;

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

        <Card>
          <CardBody className="space-y-4">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {t("profile.security")}
            </p>
            <ChangePasswordSection />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {t("profile.appPreferences")}
            </p>
            <p className="text-sm text-[var(--text-muted)]">{t("profile.appPreferencesHint")}</p>
            <Link href={`/${locale}/settings`}>
              <Button variant="secondary">{t("common.settings")}</Button>
            </Link>
          </CardBody>
        </Card>

        <form action={mockLogout.bind(null, locale)}>
          <Button type="submit" variant="ghost">
            {t("common.logout")}
          </Button>
        </form>
      </div>
    </>
  );
}
