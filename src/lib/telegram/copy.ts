import type { DbLocale } from "@/i18n/config";
import type { TaskDifficulty } from "@/domain/types";

type Copy = Record<DbLocale, string>;

function pick(locale: DbLocale, copy: Copy): string {
  return copy[locale] ?? copy.en;
}

function truncateDescription(description: string): string {
  const trimmed = description.trim();
  if (trimmed.length <= 500) return trimmed;
  return `${trimmed.slice(0, 500)}…`;
}

export function welcomeLinked(name: string, locale: DbLocale, operator: boolean): string {
  if (operator) {
    return pick(locale, {
      en: `Welcome to SirRelay, ${name}!\nYour Telegram is linked — you'll receive assigned tasks here one at a time, plus operator alerts.\nWhen a task arrives, reply to THAT message (not a new chat line) with done or in progress.`,
      es: `Bienvenido a SirRelay, ${name}.\nTelegram vinculado — recibirás tareas asignadas de una en una, más alertas de operador.\nCuando llegue una tarea, responde a ESE mensaje (no una línea nueva) con listo o en progreso.`,
      pt: `Bem-vindo ao SirRelay, ${name}!\nTelegram vinculado — você receberá tarefas atribuídas uma de cada vez, e também alertas de operador.\nQuando chegar uma tarefa, responda a ESSA mensagem (não uma linha nova) com feito ou em progresso.`,
    });
  }
  return pick(locale, {
    en: `Welcome to SirRelay, ${name}!\nYou'll receive tasks here one at a time.\nWhen a task arrives, reply to THAT message (not a new chat line) with done or in progress.`,
    es: `Bienvenido a SirRelay, ${name}.\nRecibirás tareas aquí de una en una.\nCuando llegue una tarea, responde a ESE mensaje (no una línea nueva) con listo o en progreso.`,
    pt: `Bem-vindo ao SirRelay, ${name}!\nVocê receberá tarefas aqui uma de cada vez.\nQuando chegar uma tarefa, responda a ESSA mensagem (não uma linha nova) com feito ou em progresso.`,
  });
}

export function alreadyLinked(name: string, locale: DbLocale): string {
  return pick(locale, {
    en: `Hi ${name} — this SirRelay account is already linked to Telegram.`,
    es: `Hola ${name}: esta cuenta SirRelay ya está vinculada a Telegram.`,
    pt: `Olá ${name} — esta conta SirRelay já está vinculada ao Telegram.`,
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
    pt: "Este chat Telegram já está vinculado a outra conta SirRelay.",
  });
}

export function startWithoutCode(locale: DbLocale): string {
  return pick(locale, {
    en: "Open the Telegram link from your SirRelay Profile to connect this chat.",
    es: "Abre el enlace de Telegram desde tu Cuenta en SirRelay para conectar este chat.",
    pt: "Abra o link do Telegram pela sua Conta no SirRelay para vincular este chat.",
  });
}

export function taskNotify(
  locale: DbLocale,
  input: {
    title: string;
    description: string;
    dueDate: string | null;
    difficulty: TaskDifficulty | null;
    groupName: string;
    taskUrl: string;
  },
): string {
  const desc = truncateDescription(input.description);
  const groupLine = pick(locale, {
    en: `Group: ${input.groupName}`,
    es: `Grupo: ${input.groupName}`,
    pt: `Grupo: ${input.groupName}`,
  });
  const dueLine = input.dueDate
    ? pick(locale, {
        en: `Due: ${input.dueDate}`,
        es: `Vence: ${input.dueDate}`,
        pt: `Prazo: ${input.dueDate}`,
      })
    : null;
  const difficultyLine = input.difficulty
    ? pick(locale, {
        en: {
          easy: "Difficulty: Easy",
          medium: "Difficulty: Medium",
          hard: "Difficulty: Hard",
        }[input.difficulty],
        es: {
          easy: "Dificultad: Fácil",
          medium: "Dificultad: Media",
          hard: "Dificultad: Difícil",
        }[input.difficulty],
        pt: {
          easy: "Dificuldade: Fácil",
          medium: "Dificuldade: Média",
          hard: "Dificuldade: Difícil",
        }[input.difficulty],
      })
    : null;
  const replyHint = pick(locale, {
    en: "Reply to THIS message with: done · in progress (or hecho / feito / working).",
    es: "Responde a ESTE mensaje con: listo · en progreso (o done / feito / working).",
    pt: "Responda a ESTA mensagem com: feito · em progresso (ou done / listo / working).",
  });
  const openLine = pick(locale, {
    en: `Open: ${input.taskUrl}`,
    es: `Abrir: ${input.taskUrl}`,
    pt: `Abrir: ${input.taskUrl}`,
  });

  const parts = [input.title, groupLine];
  if (desc) parts.push(desc);
  if (dueLine) parts.push(dueLine);
  if (difficultyLine) parts.push(difficultyLine);
  parts.push(openLine, "", replyHint);
  return parts.join("\n");
}

/** Linked user sent text without a valid reply to a task notification. */
export function replyToTaskHint(locale: DbLocale): string {
  return pick(locale, {
    en: "To update a task, reply to the task message (tap and hold → Reply) with done or in progress.",
    es: "Para actualizar una tarea, responde al mensaje de la tarea (mantener pulsado → Responder) con listo o en progreso.",
    pt: "Para atualizar uma tarefa, responda à mensagem da tarefa (manter pressionado → Responder) com feito ou em progresso.",
  });
}

export function queueEmpty(locale: DbLocale): string {
  return pick(locale, {
    en: "All caught up — no more tasks.",
    es: "Estás al día — no hay más tareas.",
    pt: "Tudo em dia — não há mais tarefas.",
  });
}

export function operatorAlertDone(
  locale: DbLocale,
  input: { taskTitle: string; assigneeName: string; at: string },
): string {
  return pick(locale, {
    en: `Done: ${input.taskTitle}\nBy: ${input.assigneeName}\n${input.at}`,
    es: `Hecho: ${input.taskTitle}\nPor: ${input.assigneeName}\n${input.at}`,
    pt: `Concluída: ${input.taskTitle}\nPor: ${input.assigneeName}\n${input.at}`,
  });
}

export function operatorAlertDue(
  locale: DbLocale,
  input: {
    taskTitle: string;
    assigneeName: string;
    dueDate: string;
    overdue: boolean;
  },
): string {
  const flag = input.overdue
    ? pick(locale, { en: "OVERDUE", es: "VENCIDA", pt: "ATRASADA" })
    : pick(locale, { en: "Due today", es: "Vence hoy", pt: "Vence hoje" });
  return pick(locale, {
    en: `${flag}: ${input.taskTitle}\nAssignee: ${input.assigneeName}\nDue: ${input.dueDate}`,
    es: `${flag}: ${input.taskTitle}\nAsignado: ${input.assigneeName}\nVence: ${input.dueDate}`,
    pt: `${flag}: ${input.taskTitle}\nResponsável: ${input.assigneeName}\nPrazo: ${input.dueDate}`,
  });
}

export function statusAck(locale: DbLocale, status: "doing" | "done"): string {
  if (status === "done") {
    return pick(locale, {
      en: "Marked as done.",
      es: "Marcada como hecha.",
      pt: "Marcada como concluída.",
    });
  }
  return pick(locale, {
    en: "Marked as in progress.",
    es: "Marcada como en progreso.",
    pt: "Marcada como em progresso.",
  });
}
