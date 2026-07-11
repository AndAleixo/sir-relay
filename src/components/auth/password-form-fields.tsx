import { Input, Label } from "@/components/ui/input";

type PasswordFormFieldsProps = {
  labels: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    passwordHint: string;
  };
  requireCurrent?: boolean;
};

export function PasswordFormFields({
  labels,
  requireCurrent = true,
}: PasswordFormFieldsProps) {
  return (
    <>
      {requireCurrent ? (
        <div>
          <Label htmlFor="currentPassword">{labels.currentPassword}</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
      ) : null}
      <div>
        <Label htmlFor="newPassword">{labels.newPassword}</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
        <p className="mt-1.5 text-xs text-[var(--text-muted)]">{labels.passwordHint}</p>
      </div>
      <div>
        <Label htmlFor="confirmPassword">{labels.confirmPassword}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="off"
        />
      </div>
    </>
  );
}
