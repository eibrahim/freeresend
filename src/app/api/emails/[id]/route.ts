import { NextRequest, NextResponse } from "next/server";
import { withAuth, withCors, handleError } from "@/lib/middleware";
import { supabaseAdmin } from "@/lib/supabase";
import type { AuthenticatedRequest } from "@/lib/middleware";

async function getEmailHandler(
  req: AuthenticatedRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { data: email, error } = await supabaseAdmin
      .from("email_logs")
      .select(
        `
        *,
        domains (
          domain,
          user_id
        ),
        api_keys (
          key_name
        ),
        webhook_events (
          id,
          event_type,
          event_data,
          created_at
        )
      `
      )
      .eq("id", params.id)
      .single();

    if (error || !email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    // Check if user owns this email log
    if (email.domains.user_id !== req.user!.id) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { email },
    });
  } catch (error) {
    return handleError(error);
  }
}

export const GET = withCors(withAuth(getEmailHandler));
