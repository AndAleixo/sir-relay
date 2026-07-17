import type { Services } from "@/services/contracts";
import { createApiServices } from "@/services/api";
import { mockOperatorAlertService } from "@/services/mock/alerts.mock";
import { mockAuthService } from "@/services/mock/auth.mock";
import { mockExportService } from "@/services/mock/export.mock";
import { mockGroupService } from "@/services/mock/groups.mock";
import { mockTaskService } from "@/services/mock/task.mock";
import { mockGroupInvitationService } from "@/services/mock/invitations.mock";
import {
  mockTeammateService,
  mockUserService,
} from "@/services/mock/teammate.mock";

export type ServiceMode = "mock" | "api";

const mode = process.env.NEXT_PUBLIC_SERVICE_MODE;

function requireServiceMode(): ServiceMode {
  if (mode === "mock" || mode === "api") return mode;
  throw new Error(
    `NEXT_PUBLIC_SERVICE_MODE must be mock or api (got ${mode ?? "unset"}). Set it in .env — see .env.example`,
  );
}

export const serviceMode = requireServiceMode();
/**
 * Single entry point for data access.
 * UI and pages import `getServices()` — mode comes from `.env` only.
 */
export function getServices(): Services {
  if (serviceMode === "mock") {
    return {
      auth: mockAuthService,
      groups: mockGroupService,
      tasks: mockTaskService,
      teammates: mockTeammateService,
      invitations: mockGroupInvitationService,
      users: mockUserService,
      alerts: mockOperatorAlertService,
      export: mockExportService,
    };
  }

  if (serviceMode === "api") {
    return createApiServices();
  }

  throw new Error(`Unexpected service mode: ${serviceMode}`);
}
