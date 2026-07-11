import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { mockCreateTeammate } from "@/app/actions/mock-teammates";
import { getServices } from "@/services";
import { requireRole } from "@/lib/require-session";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { localeNames, locales, type AppLocale } from "@/i18n/config";

export default async function NewTeammatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();
  const { auth } = getServices();
  const session = await auth.getSession();
  if (!session) return null;
  requireRole(session, "operator", locale);

  return (
    <>
      <PageHeader title={t("teammate.addTeammate")} />
      <Card className="max-w-xl">
        <CardBody className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">{t("teammate.newSubtitle")}</p>
          <form action={mockCreateTeammate.bind(null, locale)} className="space-y-4">
            <div>
              <Label htmlFor="name">{t("teammate.name")}</Label>
              <Input id="name" name="name" required placeholder={t("teammate.namePlaceholder")} />
            </div>
            <div>
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="teammate@example.com"
              />
            </div>
            <div>
              <Label htmlFor="locale">{t("profile.language")}</Label>
              <Select id="locale" name="locale" defaultValue={session.user.locale}>
                {locales.map((loc) => (
                  <option key={loc} value={loc}>
                    {localeNames[loc as AppLocale]}
                  </option>
                ))}
              </Select>
              <p className="mt-1.5 text-xs text-[var(--text-muted)]">{t("teammate.localeHint")}</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit">{t("teammate.createTeammate")}</Button>
              <Link href={`/${locale}/teammates`}>
                <Button variant="secondary">{t("common.cancel")}</Button>
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </>
  );
}
