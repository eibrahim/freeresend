import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createWaitlistSignup,
  getWaitlistSignupByEmail,
  getAllWaitlistSignups,
  getWaitlistAnalytics,
  type CreateWaitlistSignupData,
} from "@/lib/database";
import { handleError } from "@/lib/middleware";
import { sendWaitlistNotification, sendWelcomeEmail } from "@/lib/notifications";

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



// POST /api/waitlist - Add email to waitlist
async function handlePost(req: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate request body
    const body = await req.json();
    const validationResult = WaitlistSignupSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request data",
          errors: validationResult.error.issues,
        },
        { status: 400 }
      );
    }
    
    const validatedBody = validationResult.data;
    // Check if email already exists
    const existingSignup = await getWaitlistSignupByEmail(validatedBody.email);
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
    const ipAddress = forwardedFor?.split(",")[0] || realIp || undefined;

    // Prepare signup data
    const signupData: CreateWaitlistSignupData = {
      email: validatedBody.email,
      estimated_volume: validatedBody.estimatedVolume,
      current_provider: validatedBody.currentProvider,
      referral_source: validatedBody.referralSource,
      user_agent: userAgent,
      ip_address: ipAddress,
      utm_source: validatedBody.utmSource,
      utm_medium: validatedBody.utmMedium,
      utm_campaign: validatedBody.utmCampaign,
    };

    // Create waitlist signup
    const signup = await createWaitlistSignup(signupData);

    // Send notifications asynchronously (don't wait for them to complete)
    Promise.all([
      // Send admin notification
      sendWaitlistNotification({
        email: signup.email,
        estimatedVolume: signup.estimated_volume,
        currentProvider: signup.current_provider,
        referralSource: signup.referral_source,
        utmSource: signup.utm_source,
        utmMedium: signup.utm_medium,
        utmCampaign: signup.utm_campaign,
        ipAddress: signup.ip_address,
        userAgent: signup.user_agent,
        signupId: signup.id,
        createdAt: signup.created_at,
      }),
      // Send welcome email to user
      sendWelcomeEmail(signup.email, signup.id),
    ]).catch((error) => {
      console.error("Failed to send waitlist notifications:", error);
      // Don't fail the request if notifications fail
    });

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

// Export handlers
export async function POST(req: NextRequest) {
  return handlePost(req);
}

export async function GET(req: NextRequest) {
  return handleGet(req);
}

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