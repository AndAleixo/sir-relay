"use client";

import { useState } from "react";
import { exportDataAction } from "@/app/actions/export";
import { Button, type ButtonVariant } from "@/components/ui/button";

type ExportDataButtonProps = {
  userId?: string;
  label: string;
  variant?: ButtonVariant;
};

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ExportDataButton({
  userId,
  label,
  variant = "secondary",
}: ExportDataButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleExport() {
    setPending(true);
    try {
      const { csv, filename } = await exportDataAction(userId);
      downloadCsv(filename, csv);
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleExport}
      disabled={pending}
    >
      {label}
    </Button>
  );
}
