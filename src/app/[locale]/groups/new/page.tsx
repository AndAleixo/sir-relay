import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { mockCreateGroup } from "@/app/actions/mock-groups";
import { authShellStyles } from "@/components/layout/auth-shell.styles";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { requireSession } from "@/lib/require-session";
import { getServices } from "@/services";

export default async function NewGroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  const t = await getTranslations();
  const session = await requireSession(locale);

  if (session.user.mustChangePassword) {
    redirect(`/${locale}/change-password`);
  }

  return (
    <div className={`${authShellStyles.shell} flex min-h-screen flex-col`}>
      <div className={authShellStyles.loginWrap}>
        <Card>
          <CardBody className="space-y-4">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                {t("groups.newTitle")}
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{t("groups.newSubtitle")}</p>
            </div>
            {error === "short" ? (
              <p className="rounded-button border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700">
                {t("groups.nameTooShort")}
              </p>
            ) : null}
            <form action={mockCreateGroup.bind(null, locale)} className="space-y-4">
              <div>
                <Label htmlFor="name">{t("groups.name")}</Label>
                <Input id="name" name="name" required placeholder={t("groups.namePlaceholder")} />
              </div>
              <Button type="submit" className="w-full">
                {t("groups.create")}
              </Button>
            </form>
            <p className="text-center">
              <Link
                href={`/${locale}/groups`}
                className="text-sm text-brand-accent hover:text-brand-accent-hover"
              >
                {t("common.back")}
              </Link>
            </p>
          </CardBody>
        </Card>
      </div>
      <SiteFooter locale={locale} />
    </div>
  );
}
