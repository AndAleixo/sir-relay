"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AVATAR_MAX_BYTES } from "@/lib/profile-avatar";
import { useProfileAvatar } from "@/hooks/use-profile-avatar";
import { UserAvatar } from "./user-avatar";

interface ProfileAvatarEditorProps {
  userId: string;
  userName: string;
}

export function ProfileAvatarEditor({ userId, userName }: ProfileAvatarEditorProps) {
  const t = useTranslations("profile");
  const inputRef = useRef<HTMLInputElement>(null);
  const { avatarUrl, saveAvatar, removeAvatar } = useProfileAvatar(userId);

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > AVATAR_MAX_BYTES) return;

    const dataUrl = await readFileAsDataUrl(file);
    saveAvatar(dataUrl);
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <UserAvatar userId={userId} userName={userName} size="lg" />
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={onFileChange}
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
            {avatarUrl ? t("changePhoto") : t("uploadPhoto")}
          </Button>
          {avatarUrl ? (
            <Button type="button" variant="ghost" onClick={removeAvatar}>
              {t("removePhoto")}
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-[var(--text-muted)]">{t("photoHint")}</p>
      </div>
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
