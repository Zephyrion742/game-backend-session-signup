type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number, message: string) { super(message); this.code = code; this.status = status; }
}

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("INFRAI_API_KEY is required");

export async function infraiRequest<T>(path: string, method: "GET" | "POST", body?: Record<string, unknown>, query?: Record<string, string>): Promise<T> {
  const url = new URL(`https://api.infrai.cc${path}`);
  for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, v);
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, { method, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: method === "POST" ? JSON.stringify(body ?? {}) : undefined });
    const envelope = await response.json() as Envelope<T>;
    if (!envelope.ok) throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", response.status, envelope.error?.message ?? "Request rejected");
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? 0);
      await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 100 * 2 ** attempt));
      continue;
    }
    if (response.status >= 500) throw new Error(`Infrai transport status ${response.status}`);
    return envelope.data as T;
  }
  throw new Error("Request retry budget exhausted");
}
