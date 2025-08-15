import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "./auth";
import { verifyApiKey } from "./api-keys";
import type { AuthUser, ApiKey } from "./database";

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
  apiKey?: ApiKey;
}

export function withAuth(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
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

export function withApiKey(
  handler: (req: AuthenticatedRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
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

export function withCors(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (req: NextRequest, context?: any) => {
    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return cors(new NextResponse(null, { status: 200 }));
    }

    const response = await handler(req, context);
    return cors(response);
  };
}

export function validateRequest(schema: any) {
  return function (
    handler: (
      req: NextRequest,
      body: any,
      context?: any
    ) => Promise<NextResponse>
  ) {
    return async (req: NextRequest, context?: any) => {
      try {
        const body = await req.json();
        const validatedData = schema.parse(body);
        return handler(req, validatedData, context);
      } catch (error: any) {
        return NextResponse.json(
          {
            error: "Invalid request data",
            details: error.errors || error.message,
          },
          { status: 400 }
        );
      }
    };
  };
}

export function handleError(error: any): NextResponse {
  console.error("API Error:", error);

  if (error.message.includes("rate limit")) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  if (error.message.includes("not found")) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  if (
    error.message.includes("unauthorized") ||
    error.message.includes("permission")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json(
    {
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    },
    { status: 500 }
  );
}
