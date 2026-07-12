import { getTranslations } from "next-intl/server";
import { renameGroupForm } from "@/app/actions/settings";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { UserGroup } from "@/domain/types";

type GroupGeneralSettingsProps = {
  locale: string;
  group: UserGroup;
  memberCount: number;
  isOperator: boolean;
  renameError?: string;
  renamed?: boolean;
};

export async function GroupGeneralSettings({
  locale,
  group,
  memberCount,
  isOperator,
  renameError,
  renamed,
}: GroupGeneralSettingsProps) {
  const t = await getTranslations();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {t("settings.general")}
        </p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">{t("settings.generalHint")}</p>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[var(--text-muted)]">{t("settings.yourRole")}</dt>
          <dd className="font-medium text-[var(--text-primary)]">
            {t(`roles.${group.role}`)}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--text-muted)]">{t("settings.memberCount")}</dt>
          <dd className="font-medium text-[var(--text-primary)]">
            {t("settings.memberCountValue", { count: memberCount })}
          </dd>
        </div>
      </dl>

      {renamed ? (
        <Banner variant="info">{t("settings.groupRenamed")}</Banner>
      ) : null}
      {renameError === "short" ? (
        <Banner variant="danger">{t("groups.nameTooShort")}</Banner>
      ) : null}
      {renameError === "failed" ? (
        <Banner variant="danger">{t("settings.renameFailed")}</Banner>
      ) : null}

      {isOperator ? (
        <form action={renameGroupForm.bind(null, locale)} className="space-y-3">
          <input type="hidden" name="groupId" value={group.id} />
          <div>
            <Label htmlFor="group-name">{t("groups.name")}</Label>
            <Input
              id="group-name"
              name="name"
              defaultValue={group.name}
              required
              minLength={2}
            />
          </div>
          <Button type="submit">{t("common.save")}</Button>
        </form>
      ) : (
        <p className="text-sm font-medium text-[var(--text-primary)]">{group.name}</p>
      )}
    </div>
  );
}
