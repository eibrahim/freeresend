import { NextResponse } from "next/server";
import { withAuth, withCors, handleError } from "@/lib/middleware";
import { query } from "@/lib/database";
import type { AuthenticatedRequest } from "@/lib/middleware";

// Helper function to safely parse email arrays (handles both string and array)
function safeParseEmailArray(emailData: unknown): string[] {
  if (!emailData) return [];
  if (typeof emailData === "string") {
    try {
      return JSON.parse(emailData);
    } catch {
      return [];
    }
  }
  if (Array.isArray(emailData)) {
    return emailData;
  }
  return [];
}

// Helper function to safely parse JSON objects (handles both string and object)
function safeParseJSON(jsonData: unknown): Record<string, unknown> {
  if (!jsonData) return {};
  if (typeof jsonData === "string") {
    try {
      return JSON.parse(jsonData);
    } catch {
      return {};
    }
  }
  if (typeof jsonData === "object" && jsonData !== null) {
    return jsonData as Record<string, unknown>;
  }
  return {};
}

async function getEmailHandler(
  req: AuthenticatedRequest,
  context?: { params: Promise<Record<string, string>> }
) {
  try {
    if (!context) throw new Error('Context is required');
    const params = await context.params as { id: string };

    // Get email with related data
    const emailResult = await query(
      `SELECT 
        el.*,
        d.domain as domain_name,
        d.user_id as domain_user_id,
        ak.key_name as api_key_name
      FROM email_logs el
      LEFT JOIN domains d ON el.domain_id = d.id
      LEFT JOIN api_keys ak ON el.api_key_id = ak.id
      WHERE el.id = $1`,
      [params.id]
    );

    if (emailResult.rows.length === 0) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const emailData = emailResult.rows[0];

    // Check if user owns this email log
    if (emailData.domain_user_id !== req.user!.id) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    // Get webhook events for this email
    const webhookResult = await query(
      `SELECT id, event_type, event_data, created_at 
       FROM webhook_events 
       WHERE email_log_id = $1 
       ORDER BY created_at DESC`,
      [params.id]
    );

    // Format the response to match original structure
    const email = {
      ...emailData,
      to_emails: safeParseEmailArray(emailData.to_emails),
      cc_emails: safeParseEmailArray(emailData.cc_emails),
      bcc_emails: safeParseEmailArray(emailData.bcc_emails),
      attachments: safeParseEmailArray(emailData.attachments),
      domains: {
        domain: emailData.domain_name,
        user_id: emailData.domain_user_id,
      },
      api_keys: emailData.api_key_name
        ? { key_name: emailData.api_key_name }
        : null,
      webhook_events: webhookResult.rows.map((row) => ({
        ...row,
        event_data: safeParseJSON(row.event_data),
      })),
    };

    return NextResponse.json({
      success: true,
      data: { email },
    });
  } catch (error) {
    return handleError(error);
  }
}

export const GET = withCors(withAuth(getEmailHandler));
