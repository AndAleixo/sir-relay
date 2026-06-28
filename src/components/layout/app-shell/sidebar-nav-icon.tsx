import { cn } from "@/lib/cn";

export type SidebarNavIconName = "tasks" | "teammates" | "alerts" | "settings";

type IconElement =
  | { type: "path"; d: string }
  | { type: "circle"; cx: number; cy: number; r: number };

const icons: Record<SidebarNavIconName, IconElement[]> = {
  tasks: [
    {
      type: "path",
      d: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2",
    },
  ],
  teammates: [
    { type: "path", d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" },
    { type: "circle", cx: 9, cy: 7, r: 4 },
    { type: "path", d: "M22 21v-2a4 4 0 0 0-3-3.87" },
    { type: "path", d: "M16 3.13a4 4 0 0 1 0 7.75" },
  ],
  alerts: [
    { type: "path", d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" },
    { type: "path", d: "M13.73 21a2 2 0 0 1-3.46 0" },
  ],
  settings: [
    {
      type: "path",
      d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
    },
  ],
};

interface SidebarNavIconProps {
  name: SidebarNavIconName;
  className?: string;
}

export function SidebarNavIcon({ name, className }: SidebarNavIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden
    >
      {icons[name].map((element, index) =>
        element.type === "circle" ? (
          <circle key={index} cx={element.cx} cy={element.cy} r={element.r} />
        ) : (
          <path key={index} d={element.d} />
        ),
      )}
    </svg>
  );
}
