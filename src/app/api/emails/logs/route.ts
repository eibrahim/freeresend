import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth";
import { verifyApiKey } from "@/lib/api-keys";
import { query } from "@/lib/database";

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


function cors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

// Support both user authentication (dashboard) and API key authentication
export async function GET(request: NextRequest) {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return cors(new NextResponse(null, { status: 200 }));
  }

  try {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return cors(NextResponse.json(
        { error: "Missing authorization header" },
        { status: 401 }
      ));
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const domainId = searchParams.get("domain_id");
    const status = searchParams.get("status");

    const offset = (page - 1) * limit;
    let domainIds: string[] = [];

    if (authHeader.startsWith("Bearer frs_")) {
      // API key authentication
      const apiKey = await verifyApiKey(authHeader.substring(7));
      if (!apiKey) {
        return cors(NextResponse.json(
          { error: "Invalid API key" },
          { status: 401 }
        ));
      }
      domainIds = [apiKey.domain_id];
    } else {
      // User JWT authentication
      const user = verifyJWT(authHeader.substring(7));
      if (!user) {
        return cors(NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 }
        ));
      }
      
      try {
        const result = await query(
          "SELECT id FROM domains WHERE user_id = $1",
          [user.id]
        );
        domainIds = result.rows.map((d) => d.id);
      } catch (domainsError: unknown) {
        const errorObj = domainsError as { message?: string };
        throw new Error(
          `Failed to fetch user domains: ${errorObj.message}`
        );
      }
    }

    // If user has no domains, return empty result
    if (domainIds.length === 0) {
      return cors(NextResponse.json({
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
      }));
    }

    // Build WHERE conditions
    const whereConditions = [`el.domain_id = ANY($1)`];
    const queryParams: (string | string[])[] = [domainIds];

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
      to_emails: safeParseEmailArray(row.to_emails),
      cc_emails: safeParseEmailArray(row.cc_emails),
      bcc_emails: safeParseEmailArray(row.bcc_emails),
      attachments: safeParseEmailArray(row.attachments),
      domains: row.domain_name ? { domain: row.domain_name } : null,
      api_keys: row.api_key_name ? { key_name: row.api_key_name } : null,
    }));

    return cors(NextResponse.json({
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
    }));
  } catch (error) {
    console.error("API Error:", error);
    return cors(NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    ));
  }
}
