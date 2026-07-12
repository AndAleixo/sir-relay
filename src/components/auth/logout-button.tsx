import { logoutAction } from "@/app/actions/auth";
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
    <form action={logoutAction.bind(null, locale)}>
      <Button type="submit" variant={variant} className={className}>
        {label}
      </Button>
    </form>
  );
}
