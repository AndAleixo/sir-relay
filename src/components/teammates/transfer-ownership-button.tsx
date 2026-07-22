"use client";

import { transferGroupOwnership } from "@/app/actions/teammates";
import { Button } from "@/components/ui/button";

type TransferOwnershipButtonProps = {
  locale: string;
  memberId: string;
  label: string;
  confirmMessage: string;
};

export function TransferOwnershipButton({
  locale,
  memberId,
  label,
  confirmMessage,
}: TransferOwnershipButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        void transferGroupOwnership(locale, memberId);
      }}
    >
      {label}
    </Button>
  );
}
