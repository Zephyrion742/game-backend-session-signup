import { z } from "zod";
import { infraiRequest, InfraiError } from "./infrai_client.ts";

export const signupBody = z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(1), captchaToken: z.string().min(1), widgetRecordId: z.string().min(1) });
export const loginBody = z.object({ userId: z.string().min(1), method: z.string().min(1) });

export type PlayerAsset = { id: string; ownerId: string; kind: string; status: "queued" | "approved" };
export type LiveEvent = { id: string; title: string; moderation: "pending" | "cleared" };

export async function signup(input: unknown) {
  const body = signupBody.parse(input);
  await infraiRequest("/v1/captcha/verify", "POST", { widget_record_id: body.widgetRecordId, token: body.captchaToken, action: "signup" });
  return infraiRequest<{ user_id: string }>("/v1/auth/user/create", "POST", { email: body.email, password: body.password, name: body.name, idempotency_key: `signup:${body.email}` });
}

export async function login(input: unknown) {
  const body = loginBody.parse(input);
  return infraiRequest<{ session_id: string; refresh_token?: string }>("/v1/auth/session/create", "POST", { user_id: body.userId, method: body.method, require_mfa: false });
}

export function mapAuthError(error: unknown): { status: number; body: { error: string } } {
  if (error instanceof InfraiError && error.status >= 400 && error.status < 500) return { status: error.status, body: { error: error.code } };
  return { status: 500, body: { error: "AUTH_REQUEST_FAILED" } };
}
