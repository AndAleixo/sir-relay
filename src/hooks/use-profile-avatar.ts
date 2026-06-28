"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearStoredAvatar,
  getStoredAvatar,
  setStoredAvatar,
} from "@/lib/profile-avatar";

export function useProfileAvatar(userId: string) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    setAvatarUrl(getStoredAvatar(userId));
  }, [userId]);

  const saveAvatar = useCallback(
    (dataUrl: string) => {
      setStoredAvatar(userId, dataUrl);
      setAvatarUrl(dataUrl);
    },
    [userId],
  );

  const removeAvatar = useCallback(() => {
    clearStoredAvatar(userId);
    setAvatarUrl(null);
  }, [userId]);

  return { avatarUrl, saveAvatar, removeAvatar };
}
