import { NextRequest, NextResponse } from "next/server";

// Next.js 15 route context type
type RouteContext<T = Record<string, string>> = {
  params: Promise<T>;
};
import { verifyJWT } from "./auth";
import { verifyApiKey } from "./api-keys";
import type { AuthUser } from "./auth";
import type { ApiKey } from "./database";
import { z } from "zod";

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
  apiKey?: ApiKey;
}

export function withAuth<T = Record<string, string>>(
  handler: (req: AuthenticatedRequest, context?: RouteContext<T>) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: RouteContext<T>) => {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const user = verifyJWT(token);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.user = user;

    return handler(authenticatedReq, context);
  };
}

export function withApiKey<T = Record<string, string>>(
  handler: (req: AuthenticatedRequest, context?: RouteContext<T>) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: RouteContext<T>) => {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization header" },
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7);

    try {
      const verifiedKey = await verifyApiKey(apiKey);

      if (!verifiedKey) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
      }

      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.apiKey = verifiedKey;

      return handler(authenticatedReq, context);
    } catch (error) {
      console.error("API key verification error:", error);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 }
      );
    }
  };
}

export function cors(response: NextResponse): NextResponse {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return response;
}

export function withCors<T = Record<string, string>>(
  handler: (req: NextRequest, context?: { params: Promise<T> }) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: { params: Promise<T> } | undefined) => {
    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return cors(new NextResponse(null, { status: 200 }));
    }

    const response = await handler(req, context);
    return cors(response);
  };
}

export function validateRequest<T, P = Record<string, string>>(schema: z.ZodSchema<T>) {
  return function (
    handler: (
      req: NextRequest,
      body: T,
      context?: { params: Promise<P> }
    ) => Promise<NextResponse>
  ) {
    return async (req: NextRequest, context?: { params: Promise<P> } | undefined) => {
      try {
        const body = await req.json();
        const validatedData = schema.parse(body);
        return handler(req, validatedData, context);
      } catch (error: unknown) {
        const errorObj = error as { errors?: unknown; message?: string };
        return NextResponse.json(
          {
            error: "Invalid request data",
            details: errorObj.errors || errorObj.message,
          },
          { status: 400 }
        );
      }
    };
  };
}

export function handleError(error: unknown): NextResponse {
  const errorObj = error as { message?: string };
  console.error("API Error:", error);

  if (errorObj.message?.includes("rate limit")) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  if (errorObj.message?.includes("not found")) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  if (
    errorObj.message?.includes("unauthorized") ||
    errorObj.message?.includes("permission")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json(
    {
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development" ? errorObj.message : undefined,
    },
    { status: 500 }
  );
}

// Simple in-memory rate limiter for expensive operations
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export function withRateLimit<T = Record<string, string>>(
  handler: (req: AuthenticatedRequest, context?: RouteContext<T>) => Promise<NextResponse>,
  options: { maxRequests: number; windowMs: number } = { maxRequests: 10, windowMs: 60000 }
) {
  return async (req: AuthenticatedRequest, context?: RouteContext<T>) => {
    // Use user ID or IP address as rate limit key
    const userId = req.user?.id;
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const rateLimitKey = userId || ip;

    const now = Date.now();
    const entry = rateLimitStore.get(rateLimitKey);

    if (entry) {
      if (entry.resetTime > now) {
        // Within the time window
        if (entry.count >= options.maxRequests) {
          return NextResponse.json(
            {
              error: "Rate limit exceeded. Please try again later.",
              retryAfter: Math.ceil((entry.resetTime - now) / 1000)
            },
            { status: 429 }
          );
        }
        entry.count++;
      } else {
        // Time window has passed, reset
        entry.count = 1;
        entry.resetTime = now + options.windowMs;
      }
    } else {
      // First request from this key
      rateLimitStore.set(rateLimitKey, {
        count: 1,
        resetTime: now + options.windowMs,
      });
    }

    return handler(req, context);
  };
}
