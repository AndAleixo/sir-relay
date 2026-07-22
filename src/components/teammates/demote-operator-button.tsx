"use client";

import { demoteTeammate } from "@/app/actions/teammates";
import { Button } from "@/components/ui/button";

type DemoteOperatorButtonProps = {
  locale: string;
  memberId: string;
  label: string;
  confirmMessage: string;
};

export function DemoteOperatorButton({
  locale,
  memberId,
  label,
  confirmMessage,
}: DemoteOperatorButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        void demoteTeammate(locale, memberId);
      }}
    >
      {label}
    </Button>
  );
}
