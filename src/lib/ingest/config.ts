/** OpenAI (or compatible) chat for task-from-text. Needs key + model; else AI composer hidden. */
export function openaiApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY?.trim() || undefined;
}

export function openaiModel(): string | undefined {
  return process.env.OPENAI_MODEL?.trim() || undefined;
}

export function openaiConfigured(): boolean {
  return Boolean(openaiApiKey() && openaiModel());
}

export function openaiBaseUrl(): string {
  return (
    process.env.OPENAI_BASE_URL?.trim().replace(/\/$/, "") ||
    "https://api.openai.com/v1"
  );
}
