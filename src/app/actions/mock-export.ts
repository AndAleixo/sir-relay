"use server";

import { getServices } from "@/services";

export async function mockExportDataAction(
  userId?: string,
): Promise<{ export: import("@/domain/export").SirRelayExport; filename: string }> {
  const session = await getServices().auth.getSession();
  if (!session?.activeGroupId || session.user.role !== "operator") {
    throw new Error("Forbidden");
  }

  const { export: exportSvc } = getServices();
  return {
    export: await exportSvc.buildExport({ session }, userId),
    filename: exportSvc.filename(userId),
  };
}
