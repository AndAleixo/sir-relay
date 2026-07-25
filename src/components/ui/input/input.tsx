import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { inputStyles } from "./input.styles";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputStyles.root, className)} {...props} />;
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn(inputStyles.label, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputStyles.textarea, className)} {...props} />;
}
