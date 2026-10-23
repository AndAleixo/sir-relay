import { upgradeRequiredResponse } from "@/lib/client-upgrade";

/** Old clients — 410, update. */
export function GET() {
  return upgradeRequiredResponse();
}

export function POST() {
  return upgradeRequiredResponse();
}

export function PATCH() {
  return upgradeRequiredResponse();
}

export function PUT() {
  return upgradeRequiredResponse();
}

export function DELETE() {
  return upgradeRequiredResponse();
}
