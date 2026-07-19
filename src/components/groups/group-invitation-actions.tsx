"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  acceptGroupInvitation,
  declineGroupInvitation,
  type InvitationActionState,
} from "@/app/actions/invitations";
import { Button } from "@/components/ui/button";

const initialState: InvitationActionState = { error: null };

export function GroupInvitationActions({
  locale,
  invitationId,
}: {
  locale: string;
  invitationId: string;
}) {
  const t = useTranslations();
  const [acceptState, acceptAction] = useActionState(
    acceptGroupInvitation.bind(null, locale, invitationId),
    initialState,
  );
  const [declineState, declineAction] = useActionState(
    declineGroupInvitation.bind(null, locale, invitationId),
    initialState,
  );
  const error = acceptState.error ?? declineState.error;

  return (
    <div className="space-y-2">
      {error ? (
        <p className="text-xs text-[var(--danger)]">{t("groups.invitationInvalid")}</p>
      ) : null}
      <div className="flex gap-2">
        <form action={acceptAction} className="flex-1">
          <Button type="submit" className="min-h-9 w-full px-3 py-1.5 text-xs">
            {t("groups.acceptInvitation")}
          </Button>
        </form>
        <form action={declineAction} className="flex-1">
          <Button
            type="submit"
            variant="secondary"
            className="min-h-9 w-full px-3 py-1.5 text-xs"
          >
            {t("groups.declineInvitation")}
          </Button>
        </form>
      </div>
    </div>
  );
}
