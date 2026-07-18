export function telegramBotToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || undefined;
}

export function telegramConfigured(): boolean {
  return Boolean(telegramBotToken() && process.env.TELEGRAM_WEBHOOK_SECRET?.trim());
}
