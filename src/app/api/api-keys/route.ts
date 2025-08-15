import { NextResponse } from "next/server";
import { z } from "zod";
import {
  withAuth,
  withCors,
  validateRequest,
  handleError,
} from "@/lib/middleware";
import { generateApiKey, getUserApiKeys } from "@/lib/api-keys";
import { getDomainById } from "@/lib/domains";
import type { AuthenticatedRequest } from "@/lib/middleware";

const createApiKeySchema = z.object({
  domainId: z.string().uuid("Invalid domain ID"),
  keyName: z.string().min(1, "Key name is required"),
  permissions: z.array(z.string()).optional().default(["send"]),
});

async function getApiKeysHandler(req: AuthenticatedRequest) {
  try {
    const apiKeys = await getUserApiKeys(req.user!.id);

    return NextResponse.json({
      success: true,
      data: { apiKeys },
    });
  } catch (error) {
    return handleError(error);
  }
}

async function createApiKeyHandler(
  req: AuthenticatedRequest,
  body: { domainId: string; keyName: string; permissions?: string[] }
) {
  try {
    const { domainId, keyName, permissions = ["send"] } = body;

    // Verify domain belongs to user
    const domain = await getDomainById(domainId);
    if (!domain || domain.user_id !== req.user!.id) {
      return NextResponse.json(
        { error: "Domain not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check if domain is verified
    if (domain.status !== "verified") {
      return NextResponse.json(
        { error: "Domain must be verified before creating API keys" },
        { status: 400 }
      );
    }

    const apiKey = await generateApiKey(
      req.user!.id,
      domainId,
      keyName,
      permissions
    );

    return NextResponse.json({
      success: true,
      data: { apiKey },
      message:
        "API key created successfully. Save it securely - it will not be shown again.",
    });
  } catch (error) {
    return handleError(error);
  }
}

export const GET = withCors(withAuth(getApiKeysHandler));
export const POST = withCors(
  withAuth(validateRequest(createApiKeySchema)(createApiKeyHandler))
);
