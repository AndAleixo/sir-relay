/**
 * ponytail: keyword parse self-check — fails if relay status keywords drift from REQUIREMENTS P1-TG-04.
 */
import { parseStatusKeyword } from "../src/lib/telegram/relay";

const cases: Array<[string, "done" | "doing" | null]> = [
  ["done", "done"],
  ["FEITO", "done"],
  ["concluída", "done"],
  ["listo", "done"],
  ["in progress", "doing"],
  ["em progresso", "doing"],
  ["working", "doing"],
  ["hello", null],
];

for (const [input, expected] of cases) {
  const got = parseStatusKeyword(input);
  if (got !== expected) {
    console.error(`fail: parseStatusKeyword(${JSON.stringify(input)}) = ${got}, want ${expected}`);
    process.exit(1);
  }
}

console.log("telegram keyword checks ok");
