import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyJWT } from "@/lib/auth";
import { generateApiKey, getUserApiKeys } from "@/lib/api-keys";
import { getDomainById } from "@/lib/domains";

const createApiKeySchema = z.object({
  domainId: z.string().uuid("Invalid domain ID"),
  keyName: z.string().min(1, "Key name is required"),
  permissions: z.array(z.string()).optional().default(["send"]),
});

function cors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

export async function GET(request: NextRequest) {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return cors(new NextResponse(null, { status: 200 }));
  }

  try {
    // Check authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return cors(NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      ));
    }

    const token = authHeader.substring(7);
    const user = verifyJWT(token);
    if (!user) {
      return cors(NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      ));
    }

    const apiKeys = await getUserApiKeys(user.id);

    return cors(NextResponse.json({
      success: true,
      data: { apiKeys },
    }));
  } catch (error) {
    console.error("API Error:", error);
    return cors(NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    ));
  }
}

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return cors(new NextResponse(null, { status: 200 }));
  }

  try {
    // Check authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return cors(NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      ));
    }

    const token = authHeader.substring(7);
    const user = verifyJWT(token);
    if (!user) {
      return cors(NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      ));
    }

    // Parse and validate request
    const body = await request.json();
    const validatedData = createApiKeySchema.parse(body);
    const { domainId, keyName, permissions = ["send"] } = validatedData;

    // Verify domain belongs to user
    const domain = await getDomainById(domainId);
    if (!domain || domain.user_id !== user.id) {
      return cors(NextResponse.json(
        { error: "Domain not found or unauthorized" },
        { status: 404 }
      ));
    }

    // Check if domain is verified
    if (domain.status !== "verified") {
      return cors(NextResponse.json(
        { error: "Domain must be verified before creating API keys" },
        { status: 400 }
      ));
    }

    const apiKey = await generateApiKey(
      user.id,
      domainId,
      keyName,
      permissions
    );

    return cors(NextResponse.json({
      success: true,
      data: { apiKey },
      message:
        "API key created successfully. Save it securely - it will not be shown again.",
    }));
  } catch (error: unknown) {
    const errorObj = error as { errors?: unknown; message?: string };
    if (errorObj.errors || errorObj.message?.includes('validation') || errorObj.message?.includes('parse')) {
      return cors(NextResponse.json(
        {
          error: "Invalid request data",
          details: errorObj.errors || errorObj.message,
        },
        { status: 400 }
      ));
    }

    console.error("API Error:", error);
    return cors(NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    ));
  }
}
