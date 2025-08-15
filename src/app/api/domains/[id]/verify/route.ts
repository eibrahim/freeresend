import { NextResponse } from "next/server";
import { withAuth, withCors, handleError } from "@/lib/middleware";
import { getDomainById, checkDomainVerification } from "@/lib/domains";
import type { AuthenticatedRequest } from "@/lib/middleware";

async function verifyDomainHandler(
  req: AuthenticatedRequest,
  context?: { params: Promise<Record<string, string>> }
) {
  try {
    if (!context) throw new Error('Context is required');
    const params = await context.params as { id: string };
    const domain = await getDomainById(params.id);

    if (!domain || domain.user_id !== req.user!.id) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const status = await checkDomainVerification(params.id);

    return NextResponse.json({
      success: true,
      data: {
        status,
        verified: status === "verified",
      },
      message:
        status === "verified"
          ? "Domain verified successfully!"
          : "Domain verification is still pending. Please check DNS records.",
    });
  } catch (error) {
    return handleError(error);
  }
}

export const POST = withCors(withAuth(verifyDomainHandler));
