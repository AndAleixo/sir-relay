"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AvatarCropDialog } from "@/components/profile/avatar-crop-dialog";
import { UserAvatar } from "@/components/profile/user-avatar";
import { popoverStyles } from "@/components/ui/popover";
import { useDismissable } from "@/hooks/use-dismissable";
import { useFadeOpen } from "@/hooks/use-fade-open";
import { useProfileAvatar } from "@/hooks/use-profile-avatar";
import { cn } from "@/lib/cn";

interface ProfileAvatarEditorProps {
  userId: string;
  userName: string;
  readOnly?: boolean;
}

export function ProfileAvatarEditor({
  userId,
  userName,
  readOnly = false,
}: ProfileAvatarEditorProps) {
  const t = useTranslations("profile");
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const { avatarUrl, saveAvatar, removeAvatar } = useProfileAvatar(userId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { rendered, visible, onTransitionEnd } = useFadeOpen(menuOpen);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useDismissable(menuOpen, closeMenu, rootRef);

  if (readOnly) {
    return (
      <div className="flex items-center gap-3">
        <UserAvatar userId={userId} userName={userName} size="lg" />
      </div>
    );
  }

  function openPicker() {
    setError(null);
    setMenuOpen(false);
    inputRef.current?.click();
  }

  function onAvatarClick() {
    setError(null);
    if (!avatarUrl) {
      openPicker();
      return;
    }
    setMenuOpen((open) => !open);
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("photoInvalid"));
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
  }

  function closeCrop() {
    if (cropSrc?.startsWith("blob:")) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  function onCropConfirm(dataUrl: string) {
    saveAvatar(dataUrl);
    closeCrop();
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div ref={rootRef} className="relative shrink-0">
          <button
            type="button"
            onClick={onAvatarClick}
            aria-label={avatarUrl ? t("photoMenu") : t("uploadPhoto")}
            aria-haspopup={avatarUrl ? "menu" : undefined}
            aria-expanded={avatarUrl ? menuOpen : undefined}
            className="group relative rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
          >
            <UserAvatar userId={userId} userName={userName} size="lg" />
            <span
              className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              aria-hidden
            >
              <CameraIcon />
            </span>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={onFileChange}
          />

          {rendered ? (
            <div
              role="menu"
              aria-label={t("photoMenu")}
              onTransitionEnd={onTransitionEnd}
              className={cn(
                popoverStyles.panel,
                popoverStyles.panelDropdownLeft,
                "min-w-[10rem]",
                visible ? popoverStyles.panelMotionOpen : popoverStyles.panelMotionClose,
                visible ? popoverStyles.panelOpen : popoverStyles.panelClosed,
              )}
            >
              <button
                type="button"
                role="menuitem"
                className={popoverStyles.item}
                onClick={openPicker}
              >
                {t("changePhoto")}
              </button>
              <button
                type="button"
                role="menuitem"
                className={cn(popoverStyles.item, "text-[var(--severity)]")}
                onClick={() => {
                  removeAvatar();
                  closeMenu();
                }}
              >
                {t("removePhoto")}
              </button>
            </div>
          ) : null}
        </div>

        <p className="min-w-0 flex-1 text-xs text-[var(--text-muted)]">
          {t("photoHint")}
        </p>
      </div>

      {error ? <p className="text-sm text-[var(--severity)]">{error}</p> : null}

      {cropSrc ? (
        <AvatarCropDialog
          imageSrc={cropSrc}
          onCancel={closeCrop}
          onConfirm={onCropConfirm}
        />
      ) : null}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
      aria-hidden
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
