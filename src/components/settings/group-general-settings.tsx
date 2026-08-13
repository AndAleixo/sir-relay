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
  isOwner?: boolean;
  renameError?: string;
  renamed?: boolean;
};

export async function GroupGeneralSettings({
  locale,
  group,
  memberCount,
  isOperator,
  isOwner = false,
  renameError,
  renamed,
}: GroupGeneralSettingsProps) {
  const t = await getTranslations();

  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="min-w-0">
          <dt className="text-[var(--text-muted)]">{t("settings.yourRole")}</dt>
          <dd className="font-medium text-[var(--text-primary)]">
            {t(`roles.${group.role}`)}
            {isOwner ? (
              <span className="mt-0.5 block text-xs font-normal text-[var(--text-muted)]">
                {t("settings.groupOwner")}
              </span>
            ) : null}
          </dd>
        </div>
        <div className="min-w-0">
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
        <Banner variant="severity">{t("groups.nameTooShort")}</Banner>
      ) : null}
      {renameError === "failed" ? (
        <Banner variant="severity">{t("settings.renameFailed")}</Banner>
      ) : null}

      {isOperator ? (
        <form
          action={renameGroupForm.bind(null, locale)}
          className="space-y-2 sm:flex sm:items-end sm:gap-3 sm:space-y-0"
        >
          <input type="hidden" name="groupId" value={group.id} />
          <div className="min-w-0 flex-1">
            <Label htmlFor="group-name">{t("groups.name")}</Label>
            <Input
              id="group-name"
              name="name"
              defaultValue={group.name}
              required
              minLength={2}
            />
          </div>
          <Button type="submit" className="w-full shrink-0 sm:w-auto">
            {t("common.save")}
          </Button>
        </form>
      ) : (
        <div>
          <p className="text-xs text-[var(--text-muted)]">{t("groups.name")}</p>
          <p className="text-sm font-medium text-[var(--text-primary)]">{group.name}</p>
        </div>
      )}
    </div>
  );
}
