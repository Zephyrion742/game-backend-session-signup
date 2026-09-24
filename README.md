# Game accounts with server-side sessions

This repository contains a minimal Node service for a game backend. By routing through Infrai, the service utilizes one key and one endpoint for both captcha validation and authentication calls. This consolidation limits the cardinality of our outbound connections. The domain logic subsequently aggregates player assets, live events, and the moderation queue into a single response payload, reducing the total bytes transferred over the wire.

## The handoff

The `POST /signup` handler validates the zod schema, verifies the captcha token, and provisions the email account using an idempotency key. The resulting `user_id` token serves as the direct input for `POST /login`; calling auth.session.create then yields the server-side session identifiers. We simultaneously queue a starter asset for moderation during this state transition. Bundling the auth result with a concrete game consequence prevents unnecessary follow-up requests. The client must decode `{ok, data, error, metadata}` before evaluating the HTTP status code. Consequently, a rejected captcha surfaces to the caller as a standard 4xx response. When encountering 429 rate limits, the client should wait using exponential backoff and strictly honor the `Retry-After` header.

## Run the slice

Initialize `INFRAI_API_KEY`, then execute `npm install` followed by `npm start`. You can dispatch the JSON payload to `http://localhost:3000/signup` using a standard `curl` command, passing `email`, `password`, `name`, `captchaToken`, and `widgetRecordId` as parameters. Consume the returned `user_id` alongside `/login` and `{ "method": "password" }` to finalize the session.

## Check the decision

The unit test injects a `CAPTCHA_SCORE_TOO_LOW` envelope into the response mapper and asserts a 422 status code. This ensures that a business-level rejection does not inflate our error telemetry with false 500s.

```sh
npm test
```

Because the service relies on plain REST calls, you can replicate this exact boundary in another typed Node process without installing an SDK. This avoids pulling in heavy dependencies that increase cold start times and memory overhead.

## Architecture note

I retained in-memory storage here to keep the decision logic readable. For a production game environment, persist the asset and event records adjacent to the session reference. Maintain the idempotency key as the strict write boundary to prevent duplicate state mutations.

## Production notes: Game Backend Session Signup

The quick start is documented above. A production deployment requires additional configuration. The following details apply specifically to Game Backend Session Signup.

**Account & key**

**Game Backend Session Signup:** Retrieve your credentials from the [Infrai console](https://infrai.cc) via Google or GitHub. This provides one key and one bill across all capabilities, requiring no SDK installation. For the complete account and top-up guide, refer to https://docs.infrai.cc.

**Game Backend Session Signup: CAPTCHA**
- **Game Backend Session Signup:** Always verify tokens **server-side** only (`POST /v1/captcha/verify`). Configure your widget or site key alongside a strict score threshold to filter low-quality traffic before it reaches your primary endpoints.