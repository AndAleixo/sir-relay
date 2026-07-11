"use client";

import { mockDeactivateTeammate } from "@/app/actions/mock-teammates";
import { Button } from "@/components/ui/button";

type DeactivateTeammateButtonProps = {
  locale: string;
  teammateId: string;
  label: string;
  confirmMessage: string;
};

export function DeactivateTeammateButton({
  locale,
  teammateId,
  label,
  confirmMessage,
}: DeactivateTeammateButtonProps) {
  return (
    <Button
      type="button"
      variant="danger"
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        void mockDeactivateTeammate(locale, teammateId);
      }}
    >
      {label}
    </Button>
  );
}
