import { NextResponse } from "next/server";
import { withAuth, withCors, handleError } from "@/lib/middleware";
import type { AuthenticatedRequest } from "@/lib/middleware";

async function meHandler(req: AuthenticatedRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export const GET = withCors(withAuth(meHandler));
