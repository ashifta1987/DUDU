import Fastify, { type FastifyInstance } from "fastify";
import websocket from "@fastify/websocket";

export interface GatewayOptions {
  logger?: boolean;
}

/** Build the gateway HTTP + WebSocket server. Device protocol handlers are registered in Phase 7. */
export async function buildServer(opts: GatewayOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: opts.logger ?? true });
  await app.register(websocket, { options: { maxPayload: 1024 * 1024 } });

  const startedAt = Date.now();

  app.get("/healthz", async () => ({
    ok: true,
    service: "dudu-gateway",
    uptime_s: Math.round((Date.now() - startedAt) / 1000),
    connections: app.websocketServer?.clients.size ?? 0,
  }));

  app.get("/ws", { websocket: true }, (socket) => {
    socket.send(JSON.stringify({ type: "face", state: "boot" }));
    socket.on("message", (raw, isBinary) => {
      if (isBinary) return;
      try {
        const msg = JSON.parse(raw.toString()) as { type?: string };
        if (msg.type === "ping") socket.send(JSON.stringify({ type: "pong" }));
      } catch {
        socket.send(JSON.stringify({ type: "error", message: "invalid_json" }));
      }
    });
  });

  return app;
}
