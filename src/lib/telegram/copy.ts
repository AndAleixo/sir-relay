import type { Locale as DbLocale } from "@prisma/client";

type Copy = Record<DbLocale, string>;

function pick(locale: DbLocale, copy: Copy): string {
  return copy[locale] ?? copy.en;
}

export function welcomeLinked(name: string, locale: DbLocale, operator: boolean): string {
  if (operator) {
    return pick(locale, {
      en: `Welcome to SirRelay, ${name}!\nYour Telegram is linked — you'll receive assigned tasks here one at a time, plus operator alerts.`,
      es: `Bienvenido a SirRelay, ${name}.\nTelegram vinculado — recibirás tareas asignadas de una en una, más alertas de operador.`,
      pt: `Bem-vindo ao SirRelay, ${name}!\nTelegram ligado — receberá tarefas atribuídas uma de cada vez, e também alertas de operador.`,
    });
  }
  return pick(locale, {
    en: `Welcome to SirRelay, ${name}!\nYou'll receive tasks here one at a time.\nReply to each message to update your progress.`,
    es: `Bienvenido a SirRelay, ${name}.\nRecibirás tareas aquí de una en una.\nResponde a cada mensaje para actualizar tu progreso.`,
    pt: `Bem-vindo ao SirRelay, ${name}!\nReceberá tarefas aqui uma de cada vez.\nResponda a cada mensagem para atualizar o progresso.`,
  });
}

export function alreadyLinked(name: string, locale: DbLocale): string {
  return pick(locale, {
    en: `Hi ${name} — this SirRelay account is already linked to Telegram.`,
    es: `Hola ${name}: esta cuenta SirRelay ya está vinculada a Telegram.`,
    pt: `Olá ${name} — esta conta SirRelay já está ligada ao Telegram.`,
  });
}

export function linkInvalid(locale: DbLocale): string {
  return pick(locale, {
    en: "This link code is invalid, expired, or already used. Open Profile in SirRelay and tap New link code.",
    es: "Este código no es válido, expiró o ya se usó. Abre Cuenta en SirRelay y pulsa Nuevo código.",
    pt: "Este código é inválido, expirou ou já foi usado. Abra Conta no SirRelay e toque Novo código.",
  });
}

export function chatTaken(locale: DbLocale): string {
  return pick(locale, {
    en: "This Telegram chat is already linked to another SirRelay account.",
    es: "Este chat de Telegram ya está vinculado a otra cuenta SirRelay.",
    pt: "Este chat Telegram já está ligado a outra conta SirRelay.",
  });
}

export function startWithoutCode(locale: DbLocale): string {
  return pick(locale, {
    en: "Open the Telegram link from your SirRelay Profile to connect this chat.",
    es: "Abre el enlace de Telegram desde tu Cuenta en SirRelay para conectar este chat.",
    pt: "Abra o link Telegram a partir da sua Conta no SirRelay para ligar este chat.",
  });
}
