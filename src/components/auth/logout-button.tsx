import { mockLogout } from "@/app/actions/mock-auth";
import { Button } from "@/components/ui/button";

type LogoutButtonProps = {
  locale: string;
  label: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
};

export function LogoutButton({
  locale,
  label,
  variant = "secondary",
  className,
}: LogoutButtonProps) {
  return (
    <form action={mockLogout.bind(null, locale)}>
      <Button type="submit" variant={variant} className={className}>
        {label}
      </Button>
    </form>
  );
}
