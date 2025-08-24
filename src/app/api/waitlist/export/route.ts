import { NextRequest, NextResponse } from "next/server";
import { exportWaitlistSignups, type WaitlistSignup } from "@/lib/database";
import { withCors, handleError, withAuth } from "@/lib/middleware";

// Convert waitlist signups to CSV format
function convertToCSV(signups: WaitlistSignup[]): string {
  const headers = [
    "ID",
    "Email",
    "Estimated Volume",
    "Current Provider",
    "Referral Source",
    "User Agent",
    "IP Address",
    "UTM Source",
    "UTM Medium",
    "UTM Campaign",
    "Created At",
    "Updated At",
  ];

  const csvRows = [
    headers.join(","),
    ...signups.map((signup) =>
      [
        signup.id,
        `"${signup.email}"`,
        signup.estimated_volume || "",
        signup.current_provider ? `"${signup.current_provider}"` : "",
        signup.referral_source ? `"${signup.referral_source}"` : "",
        signup.user_agent ? `"${signup.user_agent.replace(/"/g, '""')}"` : "",
        signup.ip_address || "",
        signup.utm_source ? `"${signup.utm_source}"` : "",
        signup.utm_medium ? `"${signup.utm_medium}"` : "",
        signup.utm_campaign ? `"${signup.utm_campaign}"` : "",
        signup.created_at,
        signup.updated_at,
      ].join(",")
    ),
  ];

  return csvRows.join("\n");
}

// GET /api/waitlist/export - Export waitlist as CSV (admin only)
async function handleGet(req: NextRequest): Promise<NextResponse> {
  try {
    // Get all waitlist signups
    const signups = await exportWaitlistSignups();

    // Convert to CSV
    const csvContent = convertToCSV(signups);

    // Generate filename with current date
    const currentDate = new Date().toISOString().split("T")[0];
    const filename = `waitlist-export-${currentDate}.csv`;

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// Export handler with middleware
export const GET = withCors(withAuth(handleGet));

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}