"use server";

import type { SirRelayExport } from "@/domain/export";
import { getServices } from "@/services";
import {
  buildMockExport,
  mockExportFilename,
} from "@/services/mock/export.mock";

export async function mockExportDataAction(
  userId?: string,
): Promise<{ export: SirRelayExport; filename: string }> {
  const { auth } = getServices();
  const session = await auth.getSession();
  if (!session || session.user.role !== "operator") {
    throw new Error("Forbidden");
  }

  return {
    export: await buildMockExport(userId),
    filename: mockExportFilename(userId),
  };
}
