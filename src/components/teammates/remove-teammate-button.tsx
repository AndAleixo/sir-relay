"use client";

import { removeTeammate } from "@/app/actions/teammates";
import { Button, buttonCompact } from "@/components/ui/button";

type RemoveTeammateButtonProps = {
  locale: string;
  teammateId: string;
  label: string;
  confirmMessage: string;
};

export function RemoveTeammateButton({
  locale,
  teammateId,
  label,
  confirmMessage,
}: RemoveTeammateButtonProps) {
  return (
    <Button
      type="button"
      variant="severity"
      className={buttonCompact}
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        void removeTeammate(locale, teammateId);
      }}
    >
      {label}
    </Button>
  );
}
