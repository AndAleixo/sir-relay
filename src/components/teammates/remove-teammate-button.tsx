"use client";

import { removeTeammate } from "@/app/actions/teammates";
import { Button } from "@/components/ui/button";

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
      variant="danger"
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        void removeTeammate(locale, teammateId);
      }}
    >
      {label}
    </Button>
  );
}
