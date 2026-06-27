import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { cardStyles } from "./card.styles";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(cardStyles.root, className)} {...props} />;
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(cardStyles.header, className)} {...props} />;
}

export function CardBody({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(cardStyles.body, className)} {...props} />;
}
