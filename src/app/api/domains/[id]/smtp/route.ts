import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
import { createSmtpCredentials, deleteSmtpCredentials } from "@/lib/smtp";
import { verifyJWT } from "@/lib/auth";

export const dynamic = "force-dynamic";

function cors(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

/**
 * Generate SMTP credentials for a domain
 * POST /api/domains/:id/smtp
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authorization
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return cors(NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      ));
    }

    const token = authHeader.substring(7);
    const user = verifyJWT(token);
    if (!user) {
      return cors(NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      ));
    }

    // Get domain details
    const domainResult = await query(
      "SELECT * FROM domains WHERE id = $1 AND user_id = $2",
      [id, user.id]
    );

    if (domainResult.rows.length === 0) {
      return cors(NextResponse.json(
        { error: "Domain not found" },
        { status: 404 }
      ));
    }

    const domain = domainResult.rows[0];

    // Check if domain is verified
    if (domain.status !== "verified") {
      return cors(NextResponse.json(
        { error: "Domain must be verified before creating SMTP credentials" },
        { status: 400 }
      ));
    }

    // Check if SMTP credentials already exist
    if (domain.smtp_credentials) {
      return cors(NextResponse.json(
        {
          error: "SMTP credentials already exist for this domain",
          credentials: domain.smtp_credentials
        },
        { status: 400 }
      ));
    }

    // Create SMTP credentials
    const smtpCreds = await createSmtpCredentials(domain.domain);

    // Store credentials in database
    await query(
      "UPDATE domains SET smtp_credentials = $1 WHERE id = $2",
      [JSON.stringify(smtpCreds), id]
    );

    return cors(NextResponse.json({
      success: true,
      credentials: smtpCreds
    }));
  } catch (error) {
    console.error("Error creating SMTP credentials:", error);
    return cors(NextResponse.json(
      {
        error: "Failed to create SMTP credentials",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    ));
  }
}

/**
 * Delete SMTP credentials for a domain
 * DELETE /api/domains/:id/smtp
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authorization
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return cors(NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      ));
    }

    const token = authHeader.substring(7);
    const user = verifyJWT(token);
    if (!user) {
      return cors(NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      ));
    }

    // Get domain details
    const domainResult = await query(
      "SELECT * FROM domains WHERE id = $1 AND user_id = $2",
      [id, user.id]
    );

    if (domainResult.rows.length === 0) {
      return cors(NextResponse.json(
        { error: "Domain not found" },
        { status: 404 }
      ));
    }

    const domain = domainResult.rows[0];

    // Delete SMTP credentials from AWS
    await deleteSmtpCredentials(domain.domain);

    // Remove credentials from database
    await query(
      "UPDATE domains SET smtp_credentials = NULL WHERE id = $1",
      [id]
    );

    return cors(NextResponse.json({
      success: true,
      message: "SMTP credentials deleted successfully"
    }));
  } catch (error) {
    console.error("Error deleting SMTP credentials:", error);
    return cors(NextResponse.json(
      {
        error: "Failed to delete SMTP credentials",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    ));
  }
}
