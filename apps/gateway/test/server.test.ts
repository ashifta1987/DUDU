import { afterAll, beforeAll, describe, expect, it } from "vitest";
import WebSocket from "ws";
import type { FastifyInstance } from "fastify";
import { buildServer } from "../src/server";

let app: FastifyInstance;
let base: string;

beforeAll(async () => {
  app = await buildServer({ logger: false });
  await app.listen({ port: 0, host: "127.0.0.1" });
  const addr = app.server.address();
  if (!addr || typeof addr === "string") throw new Error("no address");
  base = `127.0.0.1:${addr.port}`;
});

afterAll(async () => {
  await app.close();
});

describe("gateway", () => {
  it("serves /healthz", async () => {
    const res = await app.inject({ method: "GET", url: "/healthz" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ ok: true, service: "dudu-gateway" });
  });

  it("greets a websocket client with a boot face and answers ping", async () => {
    const ws = new WebSocket(`ws://${base}/ws`);
    const messages: unknown[] = [];
    await new Promise<void>((resolve, reject) => {
      ws.on("message", (d) => {
        messages.push(JSON.parse(d.toString()));
        if (messages.length === 1) ws.send(JSON.stringify({ type: "ping" }));
        if (messages.length === 2) resolve();
      });
      ws.on("error", reject);
    });
    ws.close();
    expect(messages[0]).toEqual({ type: "face", state: "boot" });
    expect(messages[1]).toEqual({ type: "pong" });
  });
});
