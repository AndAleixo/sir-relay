"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { ManagedProject } from "@/domain/types";
import type { OrganizationUser } from "@/services/contracts";
import { useDemoActions, useDemoWorkspace } from "@/components/demo/demo-provider";
import { useSync } from "@/components/sync";
import { PageHeader } from "@/components/layout/app-shell";
import { StatusKanban } from "@/components/tasks/status-kanban";
import { TaskListWithFilters } from "@/components/tasks/task-list/task-list-with-filters";
import { TaskFormFields } from "@/components/tasks/task-form";
import { TeamBoard } from "@/components/tasks/team-board";
import {
  ProjectSelect,
  ScopeToggle,
  ViewToggle,
} from "@/components/tasks/view-toggle";
import { viewToggleStyles } from "@/components/tasks/view-toggle/view-toggle.styles";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { groupMemberLabel } from "@/lib/group-member-label";
import { demoMemberAsUser } from "@/lib/demo-workspace";
import { parseTaskDifficulty } from "@/lib/task-difficulty";
import type { TasksScope, TasksView } from "@/lib/tasks-url";

export function DemoBoard() {
  const locale = useLocale();
  const t = useTranslations();
  const workspace = useDemoWorkspace();
  const { tasks } = useSync();
  const [scope, setScope] = useState<TasksScope>("team");
  const [view, setView] = useState<TasksView>("board");
  const [project, setProject] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  if (!workspace) return null;

  const self =
    workspace.members.find((member) => member.id === workspace.selfId) ??
    workspace.members[0];
  if (!self) return null;

  const members: OrganizationUser[] = workspace.members
    .filter((member) => member.id !== self.id)
    .map((member) => ({
      ...demoMemberAsUser(member, workspace.selfId, locale),
      role: "teammate" as const,
      accountStatus: "active" as const,
      telegramStatus: "pending" as const,
    }));

  const openProjects = workspace.projects.filter(
    (row) => !row.archivedAt && !row.pendingAt,
  );
  const boardProjects = openProjects.map((row) => ({
    id: row.id,
    name: row.name,
    acronym: row.acronym,
  }));

  const labels = {
    todo: t("status.todo"),
    doing: t("status.doing"),
    done: t("status.done"),
    addTask: t("tasks.addTask"),
    titlePlaceholder: t("tasks.titlePlaceholder"),
    showMore: t("common.showMore"),
    linked: t("teammate.linked"),
    pending: t("teammate.pending"),
    invited: t("teammate.invited"),
    inactive: t("teammate.inactive"),
    emptyBoard: t("tasks.emptyBoard"),
    dueDate: t("tasks.dueDate"),
    overdue: t("tasks.overdue"),
    dragHandle: t("common.dragHandle"),
    addDueDate: t("tasks.addDueDate"),
    startDoing: t("tasks.startDoing"),
    markDone: t("tasks.markDone"),
    completedMark: t("tasks.completedMark"),
    taskMenu: t("tasks.taskMenu"),
    menuOpen: t("tasks.menuOpen"),
    menuClone: t("tasks.menuClone"),
    menuDelete: t("tasks.menuDelete"),
    deleteConfirm: t("tasks.deleteConfirm"),
    telegramFailed: t("tasks.telegramFailed"),
    project: t("tasks.project"),
    projectNone: t("tasks.projectNone"),
    projectScrollLeft: t("tasks.projectScrollLeft"),
    projectScrollRight: t("tasks.projectScrollRight"),
  };

  const selfTasks = tasks.filter((task) => task.assigneeId === self.id);
  const scopedTasks = scope === "mine" ? selfTasks : tasks;
  const visibleTasks = project
    ? scopedTasks.filter((task) => task.projectId === project)
    : scopedTasks;
  const emptyMyWork = scope === "mine" && scopedTasks.length === 0;

  return (
    <>
      <PageHeader
        title={creating ? t("common.newTask") : t("common.tasks")}
        action={
          creating ? (
            <Button type="button" variant="secondary" onClick={() => setCreating(false)}>
              {t("common.back")}
            </Button>
          ) : null
        }
      />
      {creating ? (
        <DemoNewTask
          selfId={self.id}
          selfName={self.name}
          members={workspace.members}
          projects={openProjects}
          defaultProjectId={project}
          onDone={() => setCreating(false)}
        />
      ) : (
        <div className="space-y-4">
          <div className={viewToggleStyles.toolbar}>
            <div className={viewToggleStyles.toolbarStart}>
              <div className={viewToggleStyles.toggleCluster}>
                <ScopeToggle
                  value={scope}
                  onChange={setScope}
                  mineLabel={t("tasks.myWork")}
                  teamLabel={t("tasks.team")}
                  ariaLabel={t("tasks.scopeAria")}
                />
                <ViewToggle
                  value={view}
                  onChange={setView}
                  boardLabel={t("common.board")}
                  listLabel={t("common.list")}
                  ariaLabel={t("tasks.viewAria")}
                />
              </div>
              <ProjectSelect
                projects={openProjects}
                value={project}
                onChange={setProject}
                allLabel={t("tasks.filterAll")}
                projectLabel={t("tasks.project")}
                addProjectHref={`/${locale}/demo/app/projects`}
                addProjectLabel={t("tasks.addProject")}
              />
            </div>
            <div className={viewToggleStyles.newTaskWrap}>
              <Button
                type="button"
                className={viewToggleStyles.newTask}
                onClick={() => setCreating(true)}
              >
                {t("common.newTask")}
              </Button>
            </div>
          </div>
          {emptyMyWork ? (
            <p className="text-sm text-[var(--text-muted)]">{t("tasks.emptyMyWork")}</p>
          ) : view === "board" ? (
            scope === "mine" ? (
              <StatusKanban
                tasks={visibleTasks}
                locale={locale}
                scope="mine"
                view="board"
                self={{ id: self.id, name: self.name }}
                getTaskHref={() => null}
                openProjects={boardProjects}
                labels={labels}
              />
            ) : (
              <TeamBoard
                self={{ id: self.id, name: self.name }}
                members={members}
                tasks={visibleTasks}
                locale={locale}
                scope="team"
                view="board"
                editMode="all"
                getTaskHref={() => null}
                linkMembers={false}
                openProjects={boardProjects}
                labels={labels}
              />
            )
          ) : (
            <TaskListWithFilters
              tasks={visibleTasks}
              locale={locale}
              scope={scope}
              view="list"
              project={project}
              openProjects={openProjects}
              currentUserId={self.id}
              canEditAll
              assigneeOptions={[
                { id: self.id, label: self.name },
                ...members.map((member) => ({
                  id: member.id,
                  label: groupMemberLabel(member),
                })),
              ]}
              labels={{
                title: t("tasks.title"),
                assignee: t("tasks.assignee"),
                dueDate: t("tasks.dueDate"),
                addDueDate: t("tasks.addDueDate"),
                filterAssignee: t("tasks.filterAssignee"),
                filterStatus: t("tasks.filterStatus"),
                filterSort: t("tasks.filterSort"),
                filterAll: t("tasks.filterAll"),
                sortDue: t("tasks.sortDue"),
                sortUpdated: t("tasks.sortUpdated"),
                statusColumn: t("tasks.status"),
                status: {
                  todo: t("status.todo"),
                  doing: t("status.doing"),
                  done: t("status.done"),
                },
                project: t("tasks.project"),
                category: t("tasks.category"),
                projectNone: t("tasks.projectNone"),
                categoryNone: t("tasks.categoryNone"),
              }}
            />
          )}
        </div>
      )}
    </>
  );
}

function DemoNewTask({
  selfId,
  selfName,
  members,
  projects,
  defaultProjectId,
  onDone,
}: {
  selfId: string;
  selfName: string;
  members: { id: string; name: string }[];
  projects: ManagedProject[];
  defaultProjectId: string | null;
  onDone: () => void;
}) {
  const t = useTranslations();
  const { createTask } = useDemoActions();
  const [error, setError] = useState(false);

  const assigneeOptions = members.map((member) => ({
    id: member.id,
    label:
      member.id === selfId
        ? t("tasks.assignToMe", { name: selfName })
        : member.name,
  }));

  return (
    <Card className="max-w-xl">
      <CardBody>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const title = String(data.get("title") ?? "");
            const assigneeId = String(data.get("assigneeId") ?? selfId);
            const projectId = String(data.get("projectId") ?? "").trim() || null;
            const dueDate = String(data.get("dueDate") ?? "").trim() || null;
            const ok = createTask({
              title,
              assigneeId,
              projectId,
              description: String(data.get("description") ?? ""),
              dueDate,
              difficulty: parseTaskDifficulty(data.get("difficulty")),
            });
            if (!ok) {
              setError(true);
              return;
            }
            onDone();
          }}
        >
          {error ? (
            <p className="text-sm text-[var(--severity)]">{t("tasks.errorTitle")}</p>
          ) : null}
          <TaskFormFields
            mode="create"
            isOperator
            labels={{
              title: t("tasks.title"),
              titlePlaceholder: t("tasks.titlePlaceholder"),
              assignee: t("tasks.assignee"),
              assigneeHint: t("tasks.assigneeHint"),
              dueDate: t("tasks.dueDate"),
              description: t("tasks.description"),
              descriptionPlaceholder: t("tasks.descriptionPlaceholder"),
              status: t("tasks.status"),
              overdue: t("tasks.overdue"),
              difficulty: t("tasks.difficulty"),
              difficultyNone: t("tasks.difficultyNone"),
              difficultyEasy: t("tasks.difficultyEasy"),
              difficultyMedium: t("tasks.difficultyMedium"),
              difficultyHard: t("tasks.difficultyHard"),
              project: t("tasks.project"),
              projectNone: t("tasks.projectNone"),
            }}
            assigneeOptions={assigneeOptions}
            projectOptions={projects.map((row) => ({
              id: row.id,
              label: `${row.acronym} · ${row.name}`,
            }))}
            defaultValues={defaultProjectId ? { projectId: defaultProjectId } : undefined}
          />
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button type="submit">{t("common.save")}</Button>
            <Button type="button" variant="secondary" onClick={onDone}>
              {t("common.cancel")}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
