import { NextRequest, NextResponse } from "next/server";
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
  handler: (req: AuthenticatedRequest, context?: { params: Promise<T> }) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: { params: Promise<T> }) => {
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
  handler: (req: AuthenticatedRequest, context?: { params: Promise<T> }) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: { params: Promise<T> } | undefined) => {
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
