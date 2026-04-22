import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth";
import { query } from "@/lib/database";

// Simple in-memory rate limiter for analytics endpoint
const analyticsRateLimit = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = analyticsRateLimit.get(userId);
  const maxRequests = 20;
  const windowMs = 60000; // 1 minute

  if (entry) {
    if (entry.resetTime > now) {
      if (entry.count >= maxRequests) {
        return { allowed: false, retryAfter: Math.ceil((entry.resetTime - now) / 1000) };
      }
      entry.count++;
      return { allowed: true };
    } else {
      // Reset window
      entry.count = 1;
      entry.resetTime = now + windowMs;
      return { allowed: true };
    }
  } else {
    analyticsRateLimit.set(userId, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }
}

// Cleanup old entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of analyticsRateLimit.entries()) {
      if (entry.resetTime < now) {
        analyticsRateLimit.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

interface TimeSeriesData {
  date: string;
  total: number;
  delivered: number;
  bounced: number;
  failed: number;
  sent: number;
  complained: number;
}

interface StatusCount {
  status: string;
  count: number;
}

interface AnalyticsData {
  metrics: {
    totalEmails: number;
    deliveryRate: number;
    bounceRate: number;
    avgDailyVolume: number;
  };
  statusBreakdown: {
    sent: number;
    delivered: number;
    bounced: number;
    failed: number;
    complained: number;
    pending: number;
  };
  timeSeries: TimeSeriesData[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export async function GET(req: NextRequest) {
  try {
    // Check authorization
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const user = verifyJWT(token);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const rateLimitCheck = checkRateLimit(user.id);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again later.",
          retryAfter: rateLimitCheck.retryAfter
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const domainId = searchParams.get("domainId");

    // Validate date parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    // Validate date format (ISO 8601)
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format. Use ISO 8601 format (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    if (startDateObj > endDateObj) {
      return NextResponse.json(
        { error: "startDate must be before or equal to endDate" },
        { status: 400 }
      );
    }

    // Validate date range size (max 1 year)
    const maxDays = 365;
    const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > maxDays) {
      return NextResponse.json(
        { error: `Date range cannot exceed ${maxDays} days` },
        { status: 400 }
      );
    }

    // Build query conditions
    const conditions = ["created_at >= $1", "created_at <= $2"];
    const params: (string | Date)[] = [startDateObj, endDateObj];

    if (domainId) {
      conditions.push(`domain_id = $${params.length + 1}`);
      params.push(domainId);
    }

    const whereClause = conditions.join(" AND ");

    // Query 1: Get status breakdown
    const statusQuery = `
      SELECT status, COUNT(*) as count 
      FROM email_logs 
      WHERE ${whereClause}
      GROUP BY status
    `;
    const statusResult = await query(statusQuery, params);

    const statusBreakdown: {
      sent: number;
      delivered: number;
      bounced: number;
      failed: number;
      complained: number;
      pending: number;
    } = {
      sent: 0,
      delivered: 0,
      bounced: 0,
      failed: 0,
      complained: 0,
      pending: 0,
    };

    statusResult.rows.forEach((row: StatusCount) => {
      if (row.status in statusBreakdown) {
        statusBreakdown[row.status as keyof typeof statusBreakdown] = parseInt(String(row.count));
      }
    });

    // Query 2: Get time series data (daily)
    // Note: Using date_trunc for better index utilization on large datasets
    // The composite index (domain_id, created_at, status) optimizes this query
    const timeSeriesQuery = `
      SELECT
        date_trunc('day', created_at)::date as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'bounced' THEN 1 ELSE 0 END) as bounced,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'complained' THEN 1 ELSE 0 END) as complained
      FROM email_logs
      WHERE ${whereClause}
      GROUP BY date_trunc('day', created_at)
      ORDER BY date ASC
    `;
    const timeSeriesResult = await query(timeSeriesQuery, params);

    const timeSeries: TimeSeriesData[] = timeSeriesResult.rows.map((row: {
      date: Date;
      total: string;
      sent: string;
      delivered: string;
      bounced: string;
      failed: string;
      complained: string;
    }) => ({
      date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date),
      total: parseInt(String(row.total)),
      sent: parseInt(String(row.sent)),
      delivered: parseInt(String(row.delivered)),
      bounced: parseInt(String(row.bounced)),
      failed: parseInt(String(row.failed)),
      complained: parseInt(String(row.complained)),
    }));

    // Calculate metrics
    const totalEmails = Object.values(statusBreakdown).reduce((sum, count) => sum + count, 0);
    
    const deliveredCount = statusBreakdown.delivered;
    const bouncedCount = statusBreakdown.bounced;
    
    const deliveryRate = totalEmails > 0 
      ? (deliveredCount / totalEmails) * 100 
      : 0;
    
    const bounceRate = totalEmails > 0 
      ? (bouncedCount / totalEmails) * 100 
      : 0;

    // Calculate average daily volume (reuse daysDiff from validation)
    const avgDailyVolume = totalEmails / Math.max(1, daysDiff + 1);

    const analyticsData: AnalyticsData = {
      metrics: {
        totalEmails,
        deliveryRate: Math.round(deliveryRate * 10) / 10, // Round to 1 decimal
        bounceRate: Math.round(bounceRate * 10) / 10,
        avgDailyVolume: Math.round(avgDailyVolume * 10) / 10,
      },
      statusBreakdown,
      timeSeries,
      dateRange: {
        startDate,
        endDate,
      },
    };

    return NextResponse.json({
      success: true,
      data: analyticsData,
    });
  } catch (error) {
    console.error("Analytics API Error:", error);
    const errorObj = error as { message?: string };
    return NextResponse.json(
      {
        error: "Failed to fetch analytics data",
        details: process.env.NODE_ENV === "development" ? errorObj.message : undefined,
      },
      { status: 500 }
    );
  }
}
