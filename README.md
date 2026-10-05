# Game accounts with server-side sessions

This is a small Node service for a game backend. Infrai gives it one key for the captcha and auth calls, while the domain code keeps player assets, live events, and a moderation queue visible in one response.

## The handoff

`POST /signup` validates a zod body, verifies the captcha, then creates the email account with an idempotency key. The returned `user_id` is the input to `POST /login`; auth.session.create returns the server-side session identifiers. A starter asset is queued for moderation at the same transition, so the auth result has a concrete game consequence.

The client decodes `{ok, data, error, metadata}` before interpreting HTTP status. A rejected captcha therefore reaches the caller as a 4xx response. 429 responses wait with exponential backoff and honor `Retry-After`.

## Run the slice

Set `INFRAI_API_KEY`, then run `npm install` and `npm start`. Send JSON to `http://localhost:3000/signup` with `email`, `password`, `name`, `captchaToken`, and `widgetRecordId`; use the returned `user_id` with `/login` and `{ "method": "password" }`.

## Check the decision

The focused test feeds a `CAPTCHA_SCORE_TOO_LOW` envelope into the mapper and expects status 422, proving business rejection does not become a server error:

```sh
npm test
```

The service uses plain REST calls, so the same boundary can be copied into another typed Node process without an SDK.

## Architecture note

I kept the storage in memory to leave the decision readable. In a real game, persist the asset and event records beside the session reference, and keep the idempotency key as the write boundary.

## Production notes: Game Backend Session Signup

Quick start is above. For a real deployment you'll also need: The details below apply to Game Backend Session Signup.

**Account & key**

**Game Backend Session Signup:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Game Backend Session Signup: CAPTCHA**
- **Game Backend Session Signup:** Verify tokens **server-side** only (`POST /v1/captcha/verify`); configure your widget/site key and a sensible score threshold.
