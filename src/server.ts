import { createServer } from "node:http";
import { signup, login, mapAuthError } from "./game_auth.ts";

const assets: { id: string; ownerId: string; kind: string; status: "queued" | "approved" }[] = [];
const events: { id: string; title: string; moderation: "pending" | "cleared" }[] = [];

const server = createServer(async (req, res) => {
  if (req.method !== "POST" || !req.url || !["/signup", "/login"].includes(req.url)) { res.writeHead(404).end(); return; }
  let raw = ""; for await (const chunk of req) raw += chunk;
  try {
    let result;
    if (req.url === "/signup") {
      result = await signup(JSON.parse(raw));
      assets.push({ id: `asset-${assets.length + 1}`, ownerId: result.user_id, kind: "starter-skin", status: "queued" });
    } else {
      result = await login(JSON.parse(raw));
    }
    res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ ok: true, data: result, assets, events }));
  } catch (error) { const mapped = mapAuthError(error); res.writeHead(mapped.status, { "Content-Type": "application/json" }).end(JSON.stringify(mapped.body)); }
});

server.listen(Number(process.env.PORT ?? 3000), () => console.log("game auth service listening"));
