import type { Services } from "@/services/contracts";
import { apiAuthService } from "@/services/api/auth";
import { apiGroupService } from "@/services/api/groups";
import { apiTaskService } from "@/services/api/tasks";
import { apiTeammateService, apiUserService } from "@/services/api/teammates";
import { apiOperatorAlertService } from "@/services/api/alerts";
import { apiExportService } from "@/services/api/export";
import { apiGroupInvitationService } from "@/services/api/invitations";

export function createApiServices(): Services {
  return {
    auth: apiAuthService,
    groups: apiGroupService,
    tasks: apiTaskService,
    teammates: apiTeammateService,
    invitations: apiGroupInvitationService,
    users: apiUserService,
    alerts: apiOperatorAlertService,
    export: apiExportService,
  };
}
