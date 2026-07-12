"use client";

import { promoteTeammate } from "@/app/actions/teammates";
import { Button } from "@/components/ui/button";

type PromoteTeammateButtonProps = {
  locale: string;
  teammateId: string;
  label: string;
  confirmMessage: string;
};

export function PromoteTeammateButton({
  locale,
  teammateId,
  label,
  confirmMessage,
}: PromoteTeammateButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        void promoteTeammate(locale, teammateId);
      }}
    >
      {label}
    </Button>
  );
}
