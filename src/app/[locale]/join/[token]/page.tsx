import { getTranslations } from "next-intl/server";
import { MockBanner } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  const t = await getTranslations();

  return (
    <div className="min-h-screen bg-surface-bg">
      <MockBanner />
      <div className="mx-auto flex min-h-[calc(100vh-36px)] max-w-md flex-col justify-center p-6">
        <Card>
          <CardBody className="space-y-4">
            <h1 className="text-xl font-semibold">{t("auth.joinTitle")}</h1>
            <p className="text-sm text-[var(--text-muted)]">{t("auth.joinSubtitle")}</p>
            <p className="text-xs text-[var(--text-muted)]">Token: {token}</p>
            <div>
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" />
            </div>
            <Button className="w-full" disabled>
              {t("common.save")} (mock)
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
