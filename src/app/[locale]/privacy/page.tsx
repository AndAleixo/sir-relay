import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { adminStyles } from "@/components/admin/admin.styles";
import { Card, CardBody } from "@/components/ui/card";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();

  return (
    <div className={adminStyles.shell}>
      <div className="mx-auto w-full max-w-2xl py-12">
        <Card>
          <CardBody className="space-y-4">
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              {t("privacy.title")}
            </h1>
            <p className="text-sm text-[var(--text-primary)]">{t("privacy.stub")}</p>
            <p className="text-sm text-[var(--text-muted)]">{t("privacy.cookies")}</p>
            <Link
              href={`/${locale}/admin`}
              className="inline-block text-sm font-medium text-brand-accent hover:text-brand-accent-hover"
            >
              {t("auth.login")}
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
