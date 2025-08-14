import { NextRequest, NextResponse } from "next/server";
import { withAuth, withCors, handleError } from "@/lib/middleware";
import {
  getDomainById,
  checkDomainVerification,
  deleteDomain,
} from "@/lib/domains";
import type { AuthenticatedRequest } from "@/lib/middleware";

async function getDomainHandler(
  req: AuthenticatedRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const domain = await getDomainById(params.id);

    if (!domain || domain.user_id !== req.user!.id) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { domain },
    });
  } catch (error) {
    return handleError(error);
  }
}

async function deleteDomainHandler(
  req: AuthenticatedRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    await deleteDomain(params.id, req.user!.id);

    return NextResponse.json({
      success: true,
      message: "Domain deleted successfully",
    });
  } catch (error) {
    return handleError(error);
  }
}

export const GET = withCors(withAuth(getDomainHandler));
export const DELETE = withCors(withAuth(deleteDomainHandler));
