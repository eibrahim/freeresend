import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createWaitlistSignup,
  getWaitlistSignupByEmail,
  getAllWaitlistSignups,
  getWaitlistAnalytics,
  type CreateWaitlistSignupData,
} from "@/lib/database";
import { withCors, validateRequest, handleError, withAuth } from "@/lib/middleware";

// Validation schema for waitlist signup
const WaitlistSignupSchema = z.object({
  email: z.string().email("Invalid email format"),
  estimatedVolume: z.number().int().min(0).optional(),
  currentProvider: z.string().max(100).optional(),
  referralSource: z.string().max(100).optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
});

type WaitlistSignupRequest = z.infer<typeof WaitlistSignupSchema>;

// POST /api/waitlist - Add email to waitlist
async function handlePost(
  req: NextRequest,
  body: WaitlistSignupRequest
): Promise<NextResponse> {
  try {
    // Check if email already exists
    const existingSignup = await getWaitlistSignupByEmail(body.email);
    if (existingSignup) {
      return NextResponse.json(
        {
          success: false,
          message: "Email already registered for waitlist",
        },
        { status: 409 }
      );
    }

    // Extract metadata from request
    const userAgent = req.headers.get("user-agent") || undefined;
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const ipAddress = forwardedFor?.split(",")[0] || realIp || req.ip || undefined;

    // Prepare signup data
    const signupData: CreateWaitlistSignupData = {
      email: body.email,
      estimated_volume: body.estimatedVolume,
      current_provider: body.currentProvider,
      referral_source: body.referralSource,
      user_agent: userAgent,
      ip_address: ipAddress,
      utm_source: body.utmSource,
      utm_medium: body.utmMedium,
      utm_campaign: body.utmCampaign,
    };

    // Create waitlist signup
    const signup = await createWaitlistSignup(signupData);

    return NextResponse.json(
      {
        success: true,
        message: "Successfully joined the waitlist!",
        data: {
          id: signup.id,
          email: signup.email,
          created_at: signup.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

// GET /api/waitlist - Get waitlist analytics (admin only)
async function handleGet(req: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    // Get analytics and signups
    const [analytics, signups] = await Promise.all([
      getWaitlistAnalytics(),
      getAllWaitlistSignups(limit, offset),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        analytics,
        signups,
        pagination: {
          page,
          limit,
          total: analytics.total_signups,
          totalPages: Math.ceil(analytics.total_signups / limit),
        },
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// Export handlers with middleware
export const POST = withCors(validateRequest(WaitlistSignupSchema)(handlePost));
export const GET = withCors(withAuth(handleGet));

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}