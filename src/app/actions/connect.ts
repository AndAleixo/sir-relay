"use server";

import {
  createClientApiKey,
  deleteClientApiKey,
  type ClientApiKeyPublic,
} from "@/lib/link-token";
import { getServices } from "@/services";

export async function createClientApiKeyAction(input: {
  name: string;
  groupIds: string[];
}): Promise<
  | { token: string; key: ClientApiKeyPublic }
  | { error: "unauthorized" | "bad_name" | "limit" | "bad_groups" }
> {
  const session = await getServices().auth.getSession();
  if (!session) return { error: "unauthorized" };

  const memberships = await getServices().groups.listForUser(session.user.id);
  const memberIds = new Set(memberships.map((g) => g.id));
  const groupIds = [
    ...new Set(input.groupIds.map((id) => id.trim()).filter(Boolean)),
  ];
  if (groupIds.some((id) => !memberIds.has(id))) {
    return { error: "bad_groups" };
  }

  const result = await createClientApiKey(session.user.id, {
    name: input.name,
    groupIds,
  });
  if ("error" in result) return { error: result.error };
  return result;
}

export async function deleteClientApiKeyAction(
  keyId: string,
): Promise<{ ok: true } | { error: "unauthorized" | "not_found" }> {
  const session = await getServices().auth.getSession();
  if (!session) return { error: "unauthorized" };
  const deleted = await deleteClientApiKey(session.user.id, keyId);
  if (!deleted) return { error: "not_found" };
  return { ok: true };
}
