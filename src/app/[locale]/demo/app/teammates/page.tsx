"use client";

import { useLocale } from "next-intl";
import { DemoAddMember } from "@/components/demo/demo-add-member";
import { useDemoWorkspace } from "@/components/demo/demo-provider";
import { TeammatesManager } from "@/components/teammates/teammates-manager";
import { demoMemberAsUser } from "@/lib/demo-workspace";

export default function DemoTeammatesPage() {
  const locale = useLocale();
  const workspace = useDemoWorkspace();
  if (!workspace) return null;

  const users = workspace.members.map((member) =>
    demoMemberAsUser(member, workspace.selfId, locale),
  );

  return (
    <TeammatesManager
      locale={locale}
      currentUserId={workspace.selfId}
      users={users}
      invitations={[]}
      isOperator
      profileHref={`/${locale}/demo/app/profile`}
    >
      <DemoAddMember />
    </TeammatesManager>
  );
}
