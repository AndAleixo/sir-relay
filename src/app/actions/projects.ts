"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAppSession } from "@/lib/require-session";
import { getServices } from "@/services";

function projectsPage(locale: string, query?: string) {
  return query ? `/${locale}/projects?${query}` : `/${locale}/projects`;
}

function projectErrorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message === "Invalid acronym") return "acronym";
  if (message === "Invalid name") return "name";
  if (message === "Taken") return "taken";
  if (message === "Limit") return "limit";
  if (message === "PendingLimit") return "pendingLimit";
  return "failed";
}

function categoryErrorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message === "Invalid name") return "name";
  if (message === "Taken") return "taken";
  if (message === "Limit") return "limit";
  return "failed";
}

export async function createProjectForm(locale: string, formData: FormData) {
  const session = await requireAppSession(locale);
  if (session.user.role !== "operator") {
    redirect(projectsPage(locale));
  }

  const { projects } = getServices();
  try {
    await projects.create(
      {
        name: String(formData.get("name") ?? ""),
        acronym: String(formData.get("acronym") ?? ""),
      },
      { session },
    );
  } catch (error) {
    redirect(projectsPage(locale, `projectError=${projectErrorCode(error)}`));
  }

  revalidatePath("/", "layout");
  redirect(projectsPage(locale, "projectSaved=1"));
}

export async function requestProjectForm(locale: string, formData: FormData) {
  const session = await requireAppSession(locale);
  if (session.user.role !== "teammate") {
    redirect(projectsPage(locale));
  }

  const { projects } = getServices();
  try {
    await projects.request(
      {
        name: String(formData.get("name") ?? ""),
        acronym: String(formData.get("acronym") ?? ""),
      },
      { session },
    );
  } catch (error) {
    redirect(projectsPage(locale, `projectError=${projectErrorCode(error)}`));
  }

  revalidatePath("/", "layout");
  redirect(projectsPage(locale, "projectRequested=1"));
}

export async function acceptProjectForm(locale: string, formData: FormData) {
  const session = await requireAppSession(locale);
  if (session.user.role !== "operator") {
    redirect(projectsPage(locale));
  }

  const id = String(formData.get("projectId") ?? "").trim();
  if (!id) redirect(projectsPage(locale, "projectError=failed"));

  const { projects } = getServices();
  try {
    await projects.accept(id, { session });
  } catch (error) {
    redirect(projectsPage(locale, `projectError=${projectErrorCode(error)}`));
  }

  revalidatePath("/", "layout");
  redirect(projectsPage(locale, "projectAccepted=1"));
}

export async function archiveProjectForm(locale: string, formData: FormData) {
  const session = await requireAppSession(locale);
  if (session.user.role !== "operator") {
    redirect(projectsPage(locale));
  }

  const id = String(formData.get("projectId") ?? "").trim();
  if (!id) redirect(projectsPage(locale, "projectError=failed"));

  const { projects } = getServices();
  try {
    await projects.archive(id, { session });
  } catch {
    redirect(projectsPage(locale, "projectError=failed"));
  }

  revalidatePath("/", "layout");
  redirect(projectsPage(locale, "projectRemoved=1"));
}

export async function createCategoryForm(locale: string, formData: FormData) {
  const session = await requireAppSession(locale);

  const { projects } = getServices();
  try {
    await projects.createCategory(
      {
        projectId: String(formData.get("projectId") ?? ""),
        name: String(formData.get("name") ?? ""),
      },
      { session },
    );
  } catch (error) {
    redirect(projectsPage(locale, `categoryError=${categoryErrorCode(error)}`));
  }

  revalidatePath("/", "layout");
  redirect(projectsPage(locale, "categorySaved=1"));
}

export async function archiveCategoryForm(locale: string, formData: FormData) {
  const session = await requireAppSession(locale);

  const id = String(formData.get("categoryId") ?? "").trim();
  if (!id) redirect(projectsPage(locale, "categoryError=failed"));

  const { projects } = getServices();
  try {
    await projects.archiveCategory(id, { session });
  } catch {
    redirect(projectsPage(locale, "categoryError=failed"));
  }

  revalidatePath("/", "layout");
  redirect(projectsPage(locale, "categoryRemoved=1"));
}
