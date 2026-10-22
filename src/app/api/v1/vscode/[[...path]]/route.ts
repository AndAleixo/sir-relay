import { upgradeRequiredResponse } from "@/lib/client-upgrade";

/** Retired bearer API — old extension / MCP builds called /api/v1/vscode/*. */
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
