/**
 * Self-check: Telegram input sanitize (P2-SEC-09).
 * Run: npx tsx scripts/check-telegram-sanitize.ts
 */
import assert from "node:assert/strict";
import {
  sanitizeTelegramLinkCode,
  sanitizeTelegramText,
} from "../src/lib/telegram/sanitize";
import { parseStatusKeyword } from "../src/lib/telegram/relay";

assert.equal(sanitizeTelegramText("feito"), "feito");
assert.equal(sanitizeTelegramText("  done\u0000\u0007  "), "done");
assert.equal(sanitizeTelegramText("line1\nline2"), "line1\nline2");
assert.equal(sanitizeTelegramText("a\tb"), "a\tb");
assert.equal(sanitizeTelegramText("x".repeat(3000)).length, 2000);

assert.equal(parseStatusKeyword(sanitizeTelegramText("\u0000feito\u0007")), "done");

assert.equal(sanitizeTelegramLinkCode("abc-123"), "abc-123");
assert.equal(sanitizeTelegramLinkCode("ab\u0000c  "), "abc");
assert.equal(sanitizeTelegramLinkCode("a b"), "ab");

console.log("check-telegram-sanitize: ok");
