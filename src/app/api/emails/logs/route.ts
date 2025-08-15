import { NextRequest, NextResponse } from "next/server";
import { withAuth, withApiKey, withCors, handleError } from "@/lib/middleware";
import { query } from "@/lib/database";
import type { AuthenticatedRequest } from "@/lib/middleware";

async function getEmailLogsHandler(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const domainId = searchParams.get("domain_id");
    const status = searchParams.get("status");

    const offset = (page - 1) * limit;

    // Get domain IDs based on authentication type
    let domainIds: string[] = [];

    if (req.apiKey) {
      // API key authentication - use the specific domain
      domainIds = [req.apiKey.domain_id];
    } else if (req.user) {
      // User authentication - get all user's domains
      try {
        const result = await query(
          "SELECT id FROM domains WHERE user_id = $1",
          [req.user.id]
        );
        domainIds = result.rows.map((d) => d.id);
      } catch (domainsError) {
        throw new Error(
          `Failed to fetch user domains: ${domainsError.message}`
        );
      }
    } else {
      throw new Error("Authentication required");
    }

    // If user has no domains, return empty result
    if (domainIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          emails: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        },
      });
    }

    // Build WHERE conditions
    const whereConditions = [`el.domain_id = ANY($1)`];
    const queryParams: any[] = [domainIds];

    if (domainId) {
      whereConditions.push(`el.domain_id = $${queryParams.length + 1}`);
      queryParams.push(domainId);
    }

    if (status) {
      whereConditions.push(`el.status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }

    const whereClause = whereConditions.join(" AND ");

    // Get total count for pagination
    const countResult = await query(
      `SELECT COUNT(*) as count FROM email_logs el WHERE ${whereClause}`,
      queryParams
    );
    const totalCount = parseInt(countResult.rows[0].count);

    // Get email logs with JOINs
    const emailLogsResult = await query(
      `SELECT 
        el.*,
        d.domain as domain_name,
        ak.key_name as api_key_name
      FROM email_logs el
      LEFT JOIN domains d ON el.domain_id = d.id
      LEFT JOIN api_keys ak ON el.api_key_id = ak.id
      WHERE ${whereClause}
      ORDER BY el.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
      [...queryParams, limit, offset]
    );

    // Parse JSON fields and format data
    const emailLogs = emailLogsResult.rows.map((row) => ({
      ...row,
      to_emails: JSON.parse(row.to_emails || "[]"),
      cc_emails: JSON.parse(row.cc_emails || "[]"),
      bcc_emails: JSON.parse(row.bcc_emails || "[]"),
      attachments: JSON.parse(row.attachments || "[]"),
      domains: row.domain_name ? { domain: row.domain_name } : null,
      api_keys: row.api_key_name ? { key_name: row.api_key_name } : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        emails: emailLogs,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// Support both user authentication (dashboard) and API key authentication
export const GET = withCors(async (req: NextRequest, context?: any) => {
  const authHeader = req.headers.get("authorization");

  if (authHeader?.startsWith("Bearer frs_")) {
    // API key authentication
    return withApiKey(getEmailLogsHandler)(req, context);
  } else {
    // User JWT authentication
    return withAuth(getEmailLogsHandler)(req, context);
  }
});
