"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useFadeOpen } from "@/hooks/use-fade-open";
import { Toast, TOAST_DURATION_MS } from "@/components/ui/toast";
import {
  readSuccessFlash,
  stripSuccessFlash,
  SUCCESS_FLASH_MESSAGES,
} from "@/lib/flash-url";

export function ConsumeFlash() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [messageKey, setMessageKey] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [wave, setWave] = useState(0);
  const remainingMs = useRef(TOAST_DURATION_MS);
  const { rendered, visible, onTransitionEnd } = useFadeOpen(open);

  useEffect(() => {
    const search = searchParams.toString();
    const query = search ? `?${search}` : "";
    const key = readSuccessFlash(query);
    if (key) {
      remainingMs.current = TOAST_DURATION_MS;
      setPaused(false);
      setMessageKey(SUCCESS_FLASH_MESSAGES[key]);
      setOpen(true);
      setWave((count) => count + 1);
    }
    const next = stripSuccessFlash(query);
    if (next === null) return;
    router.replace(pathname + next, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!open || paused) return;
    const started = Date.now();
    const id = window.setTimeout(() => setOpen(false), remainingMs.current);
    return () => {
      window.clearTimeout(id);
      remainingMs.current = Math.max(
        0,
        remainingMs.current - (Date.now() - started),
      );
    };
  }, [open, paused, wave]);

  useEffect(() => {
    if (!open && !rendered) setMessageKey(null);
  }, [open, rendered]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!rendered || !messageKey) return null;

  return (
    <Toast
      closeLabel={t("common.close")}
      visible={visible}
      onTransitionEnd={onTransitionEnd}
      onClose={() => setOpen(false)}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      {t(messageKey)}
    </Toast>
  );
}
