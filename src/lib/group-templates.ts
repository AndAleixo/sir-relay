import type { Locale, Task } from "@/domain/types";
import type { AppLocale } from "@/i18n/config";
import { defaultLocale, locales } from "@/i18n/config";
import type { Prisma } from "@prisma/client";
import enGb from "../../messages/en-gb.json";
import esEs from "../../messages/es-es.json";
import ptBr from "../../messages/pt-br.json";

export const GROUP_TEMPLATE_IDS = [
  "personal",
  "shop",
  "software",
  "operations",
] as const;

export type GroupTemplateId = (typeof GROUP_TEMPLATE_IDS)[number];

type SampleTaskKey =
  | "completeCheck"
  | "askAiWeek"
  | "payBill"
  | "bookAppointment"
  | "buyGroceries"
  | "planWeekend"
  | "countStockShelfA"
  | "logSupplierDeliveries"
  | "restockOutOfStock"
  | "reviewNearExpiry"
  | "reviewPendingPr"
  | "fixReportedBug"
  | "prepareWeekRelease"
  | "writeReleaseNotes"
  | "checkEquipmentStatus"
  | "updateShiftProcedure"
  | "walkTheFloor"
  | "confirmOpeningChecklist";

type SeedProjectMsg = {
  name: string;
  acronym: string;
  categories: string[];
};

type GroupsTemplatesMsg = {
  personal: { nameSuggestion: string };
  shop: { nameSuggestion: string };
  software: { nameSuggestion: string };
  operations: { nameSuggestion: string };
  sampleTasks: Record<SampleTaskKey, string>;
  seedProjects: Record<GroupTemplateId, SeedProjectMsg[]>;
};

const messagesByLocale: Record<AppLocale, { groups: { templates: GroupsTemplatesMsg } }> = {
  "en-gb": enGb as typeof enGb,
  "es-es": esEs as typeof esEs,
  "pt-br": ptBr as typeof ptBr,
};

const TEMPLATE_TASK_LAYOUT: Record<
  GroupTemplateId,
  Array<{ titleKey: SampleTaskKey; projectIndex: number; categoryIndex?: number }>
> = {
  personal: [
    { titleKey: "payBill", projectIndex: 0, categoryIndex: 0 },
    { titleKey: "bookAppointment", projectIndex: 0, categoryIndex: 1 },
    { titleKey: "buyGroceries", projectIndex: 0, categoryIndex: 2 },
    { titleKey: "planWeekend", projectIndex: 0, categoryIndex: 3 },
    { titleKey: "completeCheck", projectIndex: 0, categoryIndex: 4 },
    { titleKey: "askAiWeek", projectIndex: 0, categoryIndex: 4 },
  ],
  shop: [
    { titleKey: "countStockShelfA", projectIndex: 0, categoryIndex: 1 },
    { titleKey: "logSupplierDeliveries", projectIndex: 0, categoryIndex: 1 },
    { titleKey: "restockOutOfStock", projectIndex: 0, categoryIndex: 1 },
    { titleKey: "reviewNearExpiry", projectIndex: 0, categoryIndex: 1 },
    { titleKey: "completeCheck", projectIndex: 0, categoryIndex: 0 },
    { titleKey: "askAiWeek", projectIndex: 0, categoryIndex: 1 },
  ],
  software: [
    { titleKey: "reviewPendingPr", projectIndex: 0, categoryIndex: 0 },
    { titleKey: "fixReportedBug", projectIndex: 0, categoryIndex: 0 },
    { titleKey: "prepareWeekRelease", projectIndex: 0, categoryIndex: 1 },
    { titleKey: "writeReleaseNotes", projectIndex: 0, categoryIndex: 1 },
    { titleKey: "completeCheck", projectIndex: 0, categoryIndex: 0 },
    { titleKey: "askAiWeek", projectIndex: 0, categoryIndex: 0 },
  ],
  operations: [
    { titleKey: "checkEquipmentStatus", projectIndex: 0, categoryIndex: 0 },
    { titleKey: "updateShiftProcedure", projectIndex: 0, categoryIndex: 1 },
    { titleKey: "walkTheFloor", projectIndex: 0, categoryIndex: 0 },
    { titleKey: "confirmOpeningChecklist", projectIndex: 0, categoryIndex: 0 },
    { titleKey: "completeCheck", projectIndex: 0, categoryIndex: 0 },
    { titleKey: "askAiWeek", projectIndex: 0, categoryIndex: 1 },
  ],
};

function resolveLocale(locale: Locale): AppLocale {
  return (locales as readonly string[]).includes(locale) ? (locale as AppLocale) : defaultLocale;
}

function templateMessages(locale: Locale): GroupsTemplatesMsg {
  return messagesByLocale[resolveLocale(locale)].groups.templates;
}

export function isGroupTemplateId(raw: string): raw is GroupTemplateId {
  return (GROUP_TEMPLATE_IDS as readonly string[]).includes(raw);
}

export function personalGroupName(locale: Locale): string {
  return templateMessages(locale).personal.nameSuggestion;
}

export function templateNameSuggestion(
  templateId: GroupTemplateId,
  locale: Locale,
): string {
  return templateMessages(locale)[templateId].nameSuggestion;
}

export type TemplateSeedPlan = {
  projects: Array<{
    name: string;
    acronym: string;
    categories: string[];
  }>;
  tasks: Array<{
    title: string;
    projectIndex: number;
    categoryIndex?: number;
  }>;
};

export function buildTemplateSeedPlan(
  templateId: GroupTemplateId,
  locale: Locale,
): TemplateSeedPlan {
  const msg = templateMessages(locale);
  const projects = msg.seedProjects[templateId] ?? [];
  const tasks = TEMPLATE_TASK_LAYOUT[templateId].map((row) => ({
    title: msg.sampleTasks[row.titleKey],
    projectIndex: row.projectIndex,
    categoryIndex: row.categoryIndex,
  }));
  return { projects, tasks };
}

export async function seedGroupTemplateInTransaction(
  tx: Prisma.TransactionClient,
  input: {
    groupId: string;
    userId: string;
    templateId: GroupTemplateId;
    locale: Locale;
  },
): Promise<void> {
  const plan = buildTemplateSeedPlan(input.templateId, input.locale);
  const projectIds: string[] = [];
  const categoryIdsByProject: string[][] = [];

  for (const project of plan.projects) {
    const row = await tx.project.create({
      data: {
        groupId: input.groupId,
        name: project.name.slice(0, 20),
        acronym: project.acronym.slice(0, 3).toUpperCase(),
      },
    });
    projectIds.push(row.id);
    const categoryIds: string[] = [];
    for (const categoryName of project.categories) {
      const category = await tx.projectCategory.create({
        data: {
          projectId: row.id,
          name: categoryName.slice(0, 20),
        },
      });
      categoryIds.push(category.id);
    }
    categoryIdsByProject.push(categoryIds);
  }

  let sortOrder = 0;
  const now = Date.now();
  for (const task of plan.tasks) {
    const projectId = projectIds[task.projectIndex] ?? null;
    const categoryId =
      projectId && task.categoryIndex !== undefined
        ? categoryIdsByProject[task.projectIndex]?.[task.categoryIndex] ?? null
        : null;
    await tx.task.create({
      data: {
        id: `task-${now}-${sortOrder}`,
        groupId: input.groupId,
        title: task.title.slice(0, 200),
        description: "",
        assigneeId: input.userId,
        createdById: input.userId,
        status: "todo",
        sortOrder,
        projectId,
        categoryId,
      },
    });
    sortOrder += 1;
  }
}

/** Mock mode — same plan as API; caller supplies project/task persistence. */
export function buildMockSeedTasks(
  userId: string,
  assigneeName: string,
  plan: TemplateSeedPlan,
  projectMeta: Array<{ projectId: string; acronym: string; categoryIds: string[] }>,
): Task[] {
  const now = new Date().toISOString();
  return plan.tasks.map((task, index) => {
    const meta = projectMeta[task.projectIndex];
    const projectId = meta?.projectId ?? null;
    const categoryId =
      task.categoryIndex !== undefined
        ? meta?.categoryIds[task.categoryIndex] ?? null
        : null;
    const categoryName =
      task.categoryIndex !== undefined && meta
        ? plan.projects[task.projectIndex]?.categories[task.categoryIndex] ?? null
        : null;
    return {
      id: `task-seed-${Date.now()}-${index}`,
      title: task.title,
      description: "",
      assigneeId: userId,
      assigneeName,
      status: "todo",
      difficulty: null,
      dueDate: null,
      telegramNotifyFailed: false,
      sortOrder: index,
      projectId,
      projectAcronym: meta?.acronym ?? null,
      categoryId,
      categoryName,
      updatedAt: now,
      createdAt: now,
    };
  });
}

// ponytail: self-check — every template has projects + teaching tasks in all locales
if (process.env.NODE_ENV !== "production") {
  for (const locale of locales) {
    for (const templateId of GROUP_TEMPLATE_IDS) {
      const plan = buildTemplateSeedPlan(templateId, locale);
      if (plan.projects.length === 0 || plan.tasks.length < 6) {
        console.error(`group-templates seed plan failed for ${templateId}@${locale}`);
      }
      const personal = personalGroupName(locale);
      if (!personal.trim()) {
        console.error(`group-templates personal name missing for ${locale}`);
      }
    }
  }
}