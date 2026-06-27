import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";

interface TasksPageHeaderProps {
  locale: string;
  title: string;
  showNewTask?: boolean;
}

export async function TasksPageHeader({
  locale,
  title,
  showNewTask = false,
}: TasksPageHeaderProps) {
  const t = await getTranslations("common");
  return (
    <PageHeader
      title={title}
      action={
        showNewTask ? (
          <Link href={`/${locale}/tasks/new`}>
            <Button>{t("newTask")}</Button>
          </Link>
        ) : undefined
      }
    />
  );
}
