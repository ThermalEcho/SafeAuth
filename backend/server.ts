// server.ts - Fastify backend server for Better Auth API
import Fastify from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth";
import cors from "@fastify/cors";

const fastify = Fastify({
  logger: process.env.NODE_ENV === "development",
});

// Register CORS plugin
fastify.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
});

// Register authentication endpoint
fastify.route({
  method: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  url: "/api/auth/*",
  async handler(request, reply) {
    try {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const headers = fromNodeHeaders(request.headers);

      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        ...(request.body ? { body: JSON.stringify(request.body) } : {}),
      });

      const response = await auth.handler(req);

      reply.status(response.status);
      response.headers.forEach((value, key) => reply.header(key, value));
      return reply.send(response.body ? await response.text() : null);
    } catch (error) {
      fastify.log.error({ err: error as Error }, "Authentication Error");
      return reply.status(500).send({
        error: "Internal authentication error",
        code: "AUTH_FAILURE",
      });
    }
  },
});

// Health check endpoint
fastify.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "3000", 10);
    const host = process.env.HOST || "0.0.0.0";
    await fastify.listen({ port, host });
    console.log(`\n🚀 Better Auth server running on http://${host}:${port}`);
    console.log(`🔒 Auth API endpoint: http://${host}:${port}/api/auth/*`);
    console.log(`🏥 Health check: http://${host}:${port}/health\n`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

export default fastify;
