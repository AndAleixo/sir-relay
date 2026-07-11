"use client";

import { useState } from "react";
import { mockExportDataAction } from "@/app/actions/mock-export";
import { Button, type ButtonVariant } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type ExportDataButtonProps = {
  userId?: string;
  label: string;
  variant?: ButtonVariant | "link";
  className?: string;
};

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
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
  className,
}: ExportDataButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleExport() {
    setPending(true);
    try {
      const { export: payload, filename } = await mockExportDataAction(userId);
      downloadJson(filename, payload);
    } finally {
      setPending(false);
    }
  }

  if (variant === "link") {
    return (
      <button
        type="button"
        onClick={handleExport}
        disabled={pending}
        className={cn(
          "text-sm font-medium text-brand-accent hover:text-brand-accent-hover disabled:opacity-50",
          className,
        )}
      >
        {label}
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      onClick={handleExport}
      disabled={pending}
      className={className}
    >
      {label}
    </Button>
  );
}
