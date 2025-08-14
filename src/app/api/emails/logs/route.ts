import { NextRequest, NextResponse } from "next/server";
import { withAuth, withCors, handleError } from "@/lib/middleware";
import { supabaseAdmin } from "@/lib/supabase";
import type { AuthenticatedRequest } from "@/lib/middleware";

async function getEmailLogsHandler(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const domainId = searchParams.get("domain_id");
    const status = searchParams.get("status");

    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("email_logs")
      .select(
        `
        *,
        domains (
          domain
        ),
        api_keys (
          key_name
        )
      `
      )
      .in(
        "domain_id",
        supabaseAdmin.from("domains").select("id").eq("user_id", req.user!.id)
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (domainId) {
      query = query.eq("domain_id", domainId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data: emailLogs, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch email logs: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        emails: emailLogs || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export const GET = withCors(withAuth(getEmailLogsHandler));
