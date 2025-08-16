import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyJWT } from "@/lib/auth";
import { deleteApiKey, updateApiKeyPermissions } from "@/lib/api-keys";

const updateApiKeySchema = z.object({
  permissions: z
    .array(z.string())
    .min(1, "At least one permission is required"),
});

function cors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateApiKeySchema.parse(body);
    const { permissions } = validatedData;

    await updateApiKeyPermissions(id, user.id, permissions);

    return cors(NextResponse.json({
      success: true,
      message: "API key permissions updated successfully",
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    await deleteApiKey(id, user.id);

    return cors(NextResponse.json({
      success: true,
      message: "API key deleted successfully",
    }));
  } catch (error) {
    console.error("API Error:", error);
    return cors(NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    ));
  }
}
