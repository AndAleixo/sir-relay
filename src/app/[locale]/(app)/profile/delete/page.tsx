import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DeleteAccountForm } from "@/components/profile/delete-account-form";
import { PageHeader } from "@/components/layout/app-shell";
import { Card, CardBody } from "@/components/ui/card";
import { requireSession } from "@/lib/require-session";

export default async function DeleteAccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  const t = await getTranslations();
  await requireSession(locale);

  return (
    <>
      <PageHeader
        title={t("profile.deleteAccount")}
        subtitle={t("profile.deleteAccountHint")}
      />
      <Card className="max-w-md">
        <CardBody className="space-y-4">
          <DeleteAccountForm locale={locale} error={error} />
          <p className="text-sm">
            <Link
              href={`/${locale}/profile`}
              className="font-medium text-brand-accent hover:text-brand-accent-hover"
            >
              {t("common.back")}
            </Link>
          </p>
        </CardBody>
      </Card>
    </>
  );
}
