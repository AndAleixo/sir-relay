"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useDemoTutorial } from "@/components/demo/demo-provider";
import { Button, buttonCompact } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { TUTORIAL_STEP_TARGETS } from "@/lib/demo-tutorial";
import type { TasksComposeMode } from "@/lib/tasks-url";

type Rect = { top: number; left: number; width: number; height: number };

function readTargetRect(selectors: string | string[]): Rect | null {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  let top = Infinity;
  let left = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  let found = false;
  for (const selector of list) {
    if (!selector) continue;
    const node = document.querySelector(`[data-tour="${selector}"]`);
    if (!node) continue;
    const box = node.getBoundingClientRect();
    if (box.width < 1 && box.height < 1) continue;
    found = true;
    top = Math.min(top, box.top);
    left = Math.min(left, box.left);
    right = Math.max(right, box.right);
    bottom = Math.max(bottom, box.bottom);
  }
  if (!found) return null;
  const pad = 6;
  return {
    top: Math.max(8, top - pad),
    left: Math.max(8, left - pad),
    width: right - left + pad * 2,
    height: bottom - top + pad * 2,
  };
}

function resolveTourTargets(
  step: number,
  composeMode: TasksComposeMode | null,
): string[] {
  if (step < 0 || step > 6) return [];
  if (step === 0) {
    // Title + Save together once the compose drawer is open.
    return composeMode === "manual"
      ? ["demo-compose-title", "demo-compose-save"]
      : [TUTORIAL_STEP_TARGETS[0]!];
  }
  if (step === 5) {
    return composeMode === "ai"
      ? ["demo-compose-ai-input"]
      : [TUTORIAL_STEP_TARGETS[5]!];
  }
  if (step === 6) {
    return composeMode === "ai"
      ? ["demo-compose-ai-review"]
      : [TUTORIAL_STEP_TARGETS[5]!];
  }
  const target = TUTORIAL_STEP_TARGETS[step];
  return target ? [target] : [];
}

function cardPosition(rect: Rect, cardHeight: number): { top: number; left: number } {
  const margin = 12;
  const maxLeft = Math.max(
    margin,
    Math.min(rect.left, window.innerWidth - 320 - margin),
  );
  const below = rect.top + rect.height + margin;
  if (below + cardHeight < window.innerHeight - margin) {
    return { top: below, left: maxLeft };
  }
  const above = rect.top - margin - cardHeight;
  return {
    top: Math.max(margin, above),
    left: maxLeft,
  };
}

export function DemoTutorial({
  composeMode,
}: {
  composeMode: TasksComposeMode | null;
}) {
  const locale = useLocale();
  const t = useTranslations("demo.tutorial");
  const { step, showSteps, showFinish, skipTutorial, finishTutorial } =
    useDemoTutorial();
  const [rect, setRect] = useState<Rect | null>(null);

  const refresh = useCallback(() => {
    if (!showSteps) {
      setRect(null);
      return;
    }
    const targets = resolveTourTargets(step, composeMode);
    setRect(targets.length > 0 ? readTargetRect(targets) : null);
  }, [composeMode, showSteps, step]);

  useEffect(() => {
    refresh();
    const onLayout = () => refresh();
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, true);
    const id = window.setInterval(onLayout, 400);
    return () => {
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout, true);
      window.clearInterval(id);
    };
  }, [refresh]);

  if (!showSteps && !showFinish) return null;

  const stepKey = String(step + 1) as
    | "1"
    | "2"
    | "3"
    | "4"
    | "5"
    | "6"
    | "7";
  const title = showFinish ? t("finishTitle") : t(`steps.${stepKey}.title`);
  const body = showFinish ? t("finishBody") : t(`steps.${stepKey}.body`);
  const stepTotal = 7;

  const cardHeight = showFinish ? 200 : 160;
  const cardPos = rect ? cardPosition(rect, cardHeight) : null;
  const cardStyle: CSSProperties | undefined = showFinish
    ? undefined
    : cardPos
      ? { top: cardPos.top, left: cardPos.left }
      : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

  return (
    <>
      {showSteps && rect ? (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[90] rounded-lg ring-2 ring-brand-accent ring-offset-2 ring-offset-transparent transition-all duration-200"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.62)",
          }}
        />
      ) : (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[89] bg-slate-900/55"
        />
      )}

      <div
        className={cn(
          "fixed z-[91] w-[min(100vw-1.5rem,20rem)] rounded-card border border-[var(--border)] bg-surface-card p-4 shadow-lg",
          showFinish &&
            "left-1/2 top-1/2 w-[min(100vw-1.5rem,22rem)] -translate-x-1/2 -translate-y-1/2",
        )}
        style={showFinish ? undefined : cardStyle}
        role="dialog"
        aria-modal="true"
        aria-live="polite"
        aria-label={title}
      >
        <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-brand-accent">
          {showFinish
            ? t("finishBadge")
            : t("progress", { current: step + 1, total: stepTotal })}
        </p>
        <h2 className="mt-1 text-base font-semibold text-[var(--text-primary)]">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
          {body}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {showFinish ? (
            <>
              <Link
                href={`/${locale}/signup`}
                className={cn(buttonCompact, "inline-flex items-center justify-center bg-brand-accent text-[var(--text-primary)] hover:opacity-90")}
                onClick={finishTutorial}
              >
                {t("signupCta")}
              </Link>
              <Button
                type="button"
                variant="secondary"
                className={buttonCompact}
                onClick={finishTutorial}
              >
                {t("continueDemo")}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="secondary"
              className={buttonCompact}
              onClick={skipTutorial}
            >
              {t("skip")}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}