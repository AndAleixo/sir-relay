import assert from "node:assert/strict";
import {
  AVATAR_MAX_BYTES,
  AVATAR_OUTPUT_SIZE,
  avatarCoverScale,
  clampAvatarOffset,
} from "../src/lib/profile-avatar";

assert.equal(AVATAR_MAX_BYTES, 1024 * 1024);
assert.equal(AVATAR_OUTPUT_SIZE, 512);

assert.equal(avatarCoverScale(1000, 500, 280), 280 / 500);
assert.equal(avatarCoverScale(500, 1000, 280), 280 / 500);

const clamped = clampAvatarOffset(-50, -50, 400, 400, 280);
assert.equal(clamped.x, -50);
assert.equal(clamped.y, -50);

const over = clampAvatarOffset(20, 20, 400, 400, 280);
assert.equal(over.x, 0);
assert.equal(over.y, 0);

const under = clampAvatarOffset(-200, -200, 400, 400, 280);
assert.equal(under.x, 280 - 400);
assert.equal(under.y, 280 - 400);

console.log("check-profile-avatar: ok");
