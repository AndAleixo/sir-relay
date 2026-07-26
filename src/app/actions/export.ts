"use server";

import { toExportCsv } from "@/domain/export";
import { getServices } from "@/services";

export async function exportDataAction(
  userId?: string,
): Promise<{ csv: string; filename: string }> {
  const session = await getServices().auth.getSession();
  if (!session?.activeGroupId || session.user.role !== "operator") {
    throw new Error("Forbidden");
  }

  const { export: exportSvc } = getServices();
  const payload = await exportSvc.buildExport({ session }, userId);
  return {
    csv: toExportCsv(payload),
    filename: exportSvc.filename(userId),
  };
}
