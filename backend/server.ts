// server.ts - Fastify backend server for Better Auth API
import cors from "@fastify/cors";
import { fromNodeHeaders } from "better-auth/node";
import dotenv from "dotenv";
import Fastify from "fastify";
import { fileURLToPath } from "node:url";
import { auth } from "./auth.ts";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const fastify = Fastify({
  logger: process.env.NODE_ENV === "development",
});

// Register CORS plugin
fastify.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
});

// Test database connectivity before starting server
const testDatabase = async () => {
  try {
    // Get the underlying pool from the adapter
    const adapter = (auth as any).options?.database;
    if (!adapter) {
      throw new Error('Database adapter not initialized');
    }

    // For memory adapter, we don't need to test a connection
    if (adapter.constructor.name === 'MemoryAdapter') {
      console.log('✅ Memory adapter initialized');
      return true;
    }

    // Try to get a connection from a pg Pool or compatible adapter.
    if (typeof adapter.connect === 'function') {
      const client = await adapter.connect();
      client.release();
      console.log('✅ Database connection verified');
    } else if (adapter.pool && typeof adapter.pool.connect === 'function') {
      const client = await adapter.pool.connect();
      client.release();
      console.log('✅ Database connection verified');
    } else if (adapter.client) {
      // For Supabase or other adapters
      console.log('✅ Database adapter ready');
    }

    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Initialize database and start server
const start = async () => {
  try {
    // Verify database connectivity first
    const databaseReady = await testDatabase();

    if (!databaseReady) {
      console.warn(
        '⚠️ Starting server without confirmed database connectivity. The auth routes will still load, but requests may fail until DATABASE_URL or SUPABASE_POOLER_URL is reachable.'
      );
    }

    // Initialize database schema if method exists
    if (typeof (auth as any).initDatabase === 'function') {
      console.log('🔧 Initializing database schema...');
      try {
        await (auth as any).initDatabase();
        console.log('✅ Database schema initialized');
      } catch (dbError) {
        console.error('⚠️ Database initialization warning (may be already initialized):', dbError);
      }
    } else {
      console.log('ℹ️ Database auto-initialization will occur on first request');
    }
    
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
           console.error('Auth handler error:', error);
           // Provide more detailed error information for 400 Bad Request
           if (error.statusCode === 400) {
             fastify.log.error({ err: error as Error, url: request.url, method: request.method, body: request.body }, "Bad Request Error");
             return reply.status(400).send({
               error: "Bad Request",
               message: error.message || "Invalid request data",
               code: "BAD_REQUEST",
               details: error.validation ? error.validation : undefined
             });
           }
           
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

    const port = parseInt(process.env.PORT || "3000", 10);
    // Use localhost instead of 0.0.0.0 to avoid binding issues on Windows
    const host = process.env.HOST || "localhost";
    await fastify.listen({ port, host });
    console.log(`\n🚀 Better Auth server running on http://${host}:${port}`);
    console.log(`🔒 Auth API endpoint: http://${host}:${port}/api/auth/*`);
    console.log(`🏥 Health check: http://${host}:${port}/health\n`);
  } catch (err) {
    console.error('Failed to start server:', err);
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

export default fastify;
