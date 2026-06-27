import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { buttonBase, buttonVariants } from "./button.styles";

export type ButtonVariant = keyof typeof buttonVariants;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonBase, buttonVariants[variant], className)}
      {...props}
    />
  );
}
