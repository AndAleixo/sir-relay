"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useDemoActions, useDemoWorkspace } from "@/components/demo/demo-provider";
import { PageHeader } from "@/components/layout/app-shell";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { DEMO_PROFILE_EMAIL } from "@/lib/demo-workspace";

export default function DemoProfilePage() {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const workspace = useDemoWorkspace();
  const { leave } = useDemoActions();
  if (!workspace) return null;

  const self = workspace.members.find((member) => member.id === workspace.selfId);
  if (!self) return null;

  return (
    <>
      <PageHeader title={t("common.account")} subtitle={t("demo.banner")} />
      <Card className="max-w-lg">
        <CardBody className="space-y-4">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{self.name}</p>
            <p className="text-sm text-[var(--text-muted)]">{DEMO_PROFILE_EMAIL}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <ButtonLink href={`/${locale}/signup`} className="w-full sm:w-auto">
              {t("demo.bannerCta")}
            </ButtonLink>
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => {
                leave();
                router.push(`/${locale}`);
              }}
            >
              {t("demo.leave")}
            </Button>
          </div>
        </CardBody>
      </Card>
    </>
  );
}
