import type { Services } from "@/services/contracts";
import { mockOperatorAlertService } from "@/services/mock/alerts.mock";
import { mockAuthService } from "@/services/mock/auth.mock";
import { mockExportService } from "@/services/mock/export.mock";
import { mockGroupService } from "@/services/mock/groups.mock";
import { mockTaskService } from "@/services/mock/task.mock";
import {
  mockTeammateService,
  mockUserService,
} from "@/services/mock/teammate.mock";

export type ServiceMode = "mock" | "api";

const mode: ServiceMode =
  (process.env.NEXT_PUBLIC_SERVICE_MODE as ServiceMode) ?? "mock";

/**
 * Single entry point for data access.
 * UI and pages import `getServices()` — swap mock → API by changing mode / env.
 */
export function getServices(): Services {
  if (mode === "mock") {
    return {
      auth: mockAuthService,
      groups: mockGroupService,
      tasks: mockTaskService,
      teammates: mockTeammateService,
      users: mockUserService,
      alerts: mockOperatorAlertService,
      export: mockExportService,
    };
  }

  throw new Error(
    "API services not implemented. Set NEXT_PUBLIC_SERVICE_MODE=mock",
  );
}

export { mode as serviceMode };
