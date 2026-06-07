import cors from "@fastify/cors";
import { fromNodeHeaders } from "better-auth/node";
import dotenv from "dotenv";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import { fileURLToPath } from "node:url";
import { auth } from "./auth.ts";
import { testConnection } from "./db.ts";
import { ensureOtpSchema } from "./otp-schema.ts";
import { registerOtpRoutes } from "./otp.ts";

// -----------------------------------------------------------------------------
// Environment and runtime constants
// -----------------------------------------------------------------------------

const ENV_FILE_PATH = fileURLToPath(String(new URL("../.env", import.meta.url)));
const DEVELOPMENT_LOGGER_ENABLED = process.env.NODE_ENV === "development";
const DEFAULT_SERVER_PORT = 3000;
const DEFAULT_SERVER_HOST = "localhost";
const HEALTH_CHECK_STATUS = "ok";
const AUTH_ROUTE_PATTERN = "/api/auth/*";
const HEALTH_ROUTE = "/health";
const INTERNAL_SERVER_ERROR_MESSAGE = "Internal server error";
const AUTH_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
const CORS_METHODS = [...AUTH_METHODS, "OPTIONS"] as const;

dotenv.config({ path: ENV_FILE_PATH });

/**
 * Converts a Fastify request body into a Fetch API body payload.
 *
 * @param body - The parsed Fastify request body.
 * @returns A body value compatible with the Request constructor.
 */
function serializeRequestBody(body: unknown): string | Buffer | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (typeof body === "string") {
    return body;
  }

  if (Buffer.isBuffer(body)) {
    return body;
  }

  return JSON.stringify(body);
}

/**
 * Resolves the base URL used to forward the request into Better Auth.
 *
 * @param request - The original Fastify request.
 * @returns The request origin derived from the host header.
 */
function resolveRequestOrigin(request: FastifyRequest): string {
  const hostHeader = request.headers.host;
  const resolvedHost = typeof hostHeader === "string" && hostHeader.length > 0
    ? hostHeader
    : `${DEFAULT_SERVER_HOST}:${DEFAULT_SERVER_PORT}`;

  return `http://${resolvedHost}`;
}

/**
 * Copies the headers from the Better Auth response onto the Fastify reply.
 *
 * @param response - The response returned by the Better Auth handler.
 * @param reply - The Fastify reply being built for the client.
 */
function applyResponseHeaders(response: Response, reply: FastifyReply): void {
  response.headers.forEach((value: string, key: string) => {
    reply.header(key, value);
  });
}

/**
 * Reads the response body as text when present.
 *
 * @param response - The response returned by the Better Auth handler.
 * @returns The textual response body, or `null` when the response is empty.
 */
async function readResponseBody(response: Response): Promise<string | null> {
  if (response.body === null) {
    return null;
  }

  return response.text();
}

/**
 * Converts a Fastify request into a Fetch API request for Better Auth.
 *
 * @param request - The incoming Fastify request.
 * @returns A Request object compatible with the Better Auth handler.
 */
function createAuthRequest(request: FastifyRequest): Request {
  const requestUrl = new URL(request.url, resolveRequestOrigin(request));
  const requestHeaders = fromNodeHeaders(request.headers);
  const requestBody = serializeRequestBody(request.body);

  return new Request(requestUrl.toString(), {
    method: request.method,
    headers: requestHeaders,
    ...(requestBody === undefined ? {} : { body: requestBody as unknown as BodyInit }),
  });
}

/**
 * Handles unexpected errors from the auth proxy route.
 *
 * @param error - The unknown error thrown by the handler.
 * @param reply - The Fastify reply that will be returned to the client.
 * @returns A Fastify reply with a stable error payload.
 */
function handleAuthRouteError(error: unknown, reply: FastifyReply): FastifyReply {
  if (error instanceof Error) {
    console.error("Auth handler error:", error.message);
    console.error(error.stack);
  } else {
    console.error("Auth handler error:", error);
  }

  return reply.status(500).send({
    error: INTERNAL_SERVER_ERROR_MESSAGE,
  });
}

// -----------------------------------------------------------------------------
// Fastify application
// -----------------------------------------------------------------------------

const fastify = Fastify({
  logger: DEVELOPMENT_LOGGER_ENABLED,
});

// Register CORS before routes
// Fastify's plugin types can be incompatible across versions; cast to `any`.
fastify.register(cors as any, {
  origin: true,
  methods: [...CORS_METHODS],
  credentials: true,
});

// Log all incoming requests
fastify.addHook('onRequest', async (request, reply) => {
  console.log(`[Server] ${request.method} ${request.url} - Headers:`, {
    'content-type': request.headers['content-type'],
    'content-length': request.headers['content-length'],
  });
});

fastify.route({
  method: [...AUTH_METHODS],
  url: AUTH_ROUTE_PATTERN,
  async handler(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
    try {
      console.log(`[Auth API] ${request.method} ${request.url}`);
      console.log(`[Auth API] Request body:`, request.body);
      console.log(`[Auth API] Request headers:`, request.headers);
      
      const authRequest = createAuthRequest(request);
      const authResponse = await auth.handler(authRequest);

      console.log(`[Auth API] Response status: ${authResponse.status}`);
      // Log response headers for diagnostics
      try {
        const headersObj: Record<string, string> = {};
        authResponse.headers.forEach((value: string, key: string) => {
          headersObj[key] = value;
        });
        console.log("[Auth API] Response headers:", headersObj);
      } catch (e) {
        console.log("[Auth API] Failed to read response headers", e);
      }

      // Diagnostic: when Better Auth returns a server error, attempt to
      // clone and log the raw body (and parsed JSON when possible) so we
      // can see the underlying error details instead of a null payload.
      if (authResponse.status >= 500) {
        try {
          const diagnosticClone = authResponse.clone();
          const raw = await diagnosticClone.text();
          console.error("[Auth API] Better Auth error body (raw):", raw);
          try {
            const parsed = JSON.parse(raw);
            console.error("[Auth API] Better Auth error body (json):", parsed);
          } catch (_) {
            // ignore JSON parse errors
          }
        } catch (e) {
          console.error("[Auth API] Failed to read error body:", e);
        }
      }

      const responseBody = await readResponseBody(authResponse);
      console.log("[Auth API] Response body:", responseBody);

      reply.status(authResponse.status);
      applyResponseHeaders(authResponse, reply);

      return reply.send(responseBody);
    } catch (error: unknown) {
      return handleAuthRouteError(error, reply);
    }
  },
});

fastify.get(HEALTH_ROUTE, async (): Promise<{ status: string }> => {
  return { status: HEALTH_CHECK_STATUS };
});

// Root route for Render and browsers
fastify.get("/", async (): Promise<{ status: string; message: string }> => {
  return { status: HEALTH_CHECK_STATUS, message: "SafeAuth backend running" };
});

// Debug: ping the database connection (helps diagnose remote 500s)
fastify.get("/debug/db", async (_request, reply) => {
  try {
    await testConnection();
    return reply.send({ ok: true, message: "Database connection successful" });
  } catch (error: unknown) {
    console.error("DB debug error:", error);
    return reply.status(500).send({ ok: false, error: String(error) });
  }
});

registerOtpRoutes(fastify);

/**
 * Starts the HTTP server using the configured host and port.
 */
async function startServer(): Promise<void> {
  try {
    await ensureOtpSchema();

    const parsedPort = Number.parseInt(process.env.PORT ?? String(DEFAULT_SERVER_PORT), 10);
    const serverPort = Number.isNaN(parsedPort) ? DEFAULT_SERVER_PORT : parsedPort;
    const serverHost =
      process.env.HOST ??
      (process.env.NODE_ENV === "production" ? "0.0.0.0" : DEFAULT_SERVER_HOST);

    await fastify.listen({ port: serverPort, host: serverHost });
    console.log(`Server running on http://${serverHost}:${serverPort}`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Failed to start server:", error.message);
      console.error(error.stack);
    } else {
      console.error("Failed to start server:", error);
    }

    process.exit(1);
  }
}

void startServer();

export default fastify;
