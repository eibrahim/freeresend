import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  withAuth,
  withCors,
  validateRequest,
  handleError,
} from "@/lib/middleware";
import { deleteApiKey, updateApiKeyPermissions } from "@/lib/api-keys";
import type { AuthenticatedRequest } from "@/lib/middleware";

const updateApiKeySchema = z.object({
  permissions: z
    .array(z.string())
    .min(1, "At least one permission is required"),
});

async function updateApiKeyHandler(
  req: AuthenticatedRequest,
  body: any,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { permissions } = body;

    await updateApiKeyPermissions(params.id, req.user!.id, permissions);

    return NextResponse.json({
      success: true,
      message: "API key permissions updated successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}

async function deleteApiKeyHandler(
  req: AuthenticatedRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    await deleteApiKey(params.id, req.user!.id);

    return NextResponse.json({
      success: true,
      message: "API key deleted successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}

export const PUT = withCors(
  withAuth(validateRequest(updateApiKeySchema)(updateApiKeyHandler))
);
export const DELETE = withCors(withAuth(deleteApiKeyHandler));
