import assert from "node:assert/strict";
import { mapAuthError } from "../src/game_auth.ts";
import { InfraiError } from "../src/infrai_client.ts";

const mapped = mapAuthError(new InfraiError("CAPTCHA_SCORE_TOO_LOW", 422, "captcha rejected"));
assert.equal(mapped.status, 422);
assert.deepEqual(mapped.body, { error: "CAPTCHA_SCORE_TOO_LOW" });
console.log("captcha rejection stays a client error");
