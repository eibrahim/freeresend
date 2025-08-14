import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  withAuth,
  withCors,
  validateRequest,
  handleError,
} from "@/lib/middleware";
import { addDomain, getUserDomains } from "@/lib/domains";
import type { AuthenticatedRequest } from "@/lib/middleware";

const addDomainSchema = z.object({
  domain: z.string().min(1, "Domain is required"),
});

async function getDomainsHandler(req: AuthenticatedRequest) {
  try {
    const domains = await getUserDomains(req.user!.id);

    return NextResponse.json({
      success: true,
      data: { domains },
    });
  } catch (error) {
    return handleError(error);
  }
}

async function addDomainHandler(req: AuthenticatedRequest, body: any, context?: any) {
  try {
    const { domain } = body;

    const result = await addDomain(req.user!.id, domain);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Domain added successfully. Please verify DNS records.",
    });
  } catch (error) {
    return handleError(error);
  }
}

export const GET = withCors(withAuth(getDomainsHandler));
export const POST = withCors(
  withAuth(validateRequest(addDomainSchema)(addDomainHandler))
);
