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
const EMAIL_VERIFICATION_ROUTE = "/verify-email";
const APP_VERIFICATION_URL = "safeauth://verify-email";
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

function buildEmailVerificationPage(hasError: boolean): string {
  const title = hasError ? "Email verification failed" : "Email verified";
  const heading = hasError ? "This link could not be verified" : "Your email is verified";
  const message = hasError
    ? "The verification link is invalid, expired, or has already been used. Request a new link from SafeAuth and try again."
    : "Your SafeAuth email address has been confirmed. You can now return to the app and sign in.";
  const statusClass = hasError ? "status error" : "status success";
  const statusText = hasError ? "!" : "OK";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <title>${title} | SafeAuth</title>
    <style>
      :root { color-scheme: light dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; background: #f4f7f9; color: #17212b; }
      main { width: min(100%, 520px); }
      .brand { margin: 0 0 20px; font-size: 20px; font-weight: 800; }
      .panel { padding: 32px; border: 1px solid #d7e0e7; border-radius: 8px; background: #ffffff; box-shadow: 0 12px 30px rgba(23, 33, 43, 0.08); text-align: center; }
      .status { width: 64px; height: 64px; margin: 0 auto 20px; display: grid; place-items: center; border-radius: 50%; font-weight: 900; }
      .success { color: #087a55; background: #e6f6ef; border: 1px solid #a8dfc9; }
      .error { color: #b42318; background: #fff0ee; border: 1px solid #f2b8b2; }
      h1 { margin: 0; font-size: 30px; line-height: 1.2; letter-spacing: 0; }
      p { margin: 14px auto 0; max-width: 420px; color: #53616f; line-height: 1.6; }
      a { display: inline-flex; min-height: 44px; margin-top: 24px; align-items: center; justify-content: center; padding: 0 20px; border-radius: 6px; background: #087a55; color: #ffffff; font-weight: 700; text-decoration: none; }
      @media (prefers-color-scheme: dark) {
        body { background: #10161c; color: #f2f5f7; }
        .panel { background: #182129; border-color: #33414d; box-shadow: none; }
        p { color: #b8c3cc; }
      }
    </style>
  </head>
  <body>
    <main>
      <div class="brand">SafeAuth</div>
      <section class="panel" aria-labelledby="verification-heading">
        <div class="${statusClass}" aria-hidden="true">${statusText}</div>
        <h1 id="verification-heading">${heading}</h1>
        <p>${message}</p>
        <a href="${APP_VERIFICATION_URL}">Open SafeAuth</a>
      </section>
    </main>
  </body>
</html>`;
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

fastify.get(
  EMAIL_VERIFICATION_ROUTE,
  async (request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> => {
    const query = request.query as { error?: unknown };
    const hasError = typeof query.error === "string" && query.error.length > 0;

    return reply
      .header("Cache-Control", "no-store")
      .header(
        "Content-Security-Policy",
        "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'",
      )
      .type("text/html; charset=utf-8")
      .send(buildEmailVerificationPage(hasError));
  },
);
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
