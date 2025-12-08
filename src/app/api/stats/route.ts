import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET(request: NextRequest) {
  // Validate API key
  const apiKey = request.headers.get('X-Stats-API-Key');
  if (apiKey !== process.env.STATS_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get current date for monthly stats
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Fetch all stats in parallel
    const [
      usersResult,
      lastUserResult,
      emailsSentResult,
      emailsThisMonthResult,
      domainsResult,
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM users'),
      query('SELECT created_at FROM users ORDER BY created_at DESC LIMIT 1'),
      query('SELECT COUNT(*) as count FROM email_logs'),
      query('SELECT COUNT(*) as count FROM email_logs WHERE created_at >= $1', [startOfMonth]),
      query('SELECT COUNT(*) as count FROM domains'),
    ]);

    return NextResponse.json({
      app: 'freeresend',
      timestamp: new Date().toISOString(),
      stats: {
        users: {
          total: parseInt(usersResult.rows[0]?.count || '0'),
          lastSignup: lastUserResult.rows[0]?.created_at || null,
        },
        emails: {
          sent: parseInt(emailsSentResult.rows[0]?.count || '0'),
          thisMonth: parseInt(emailsThisMonthResult.rows[0]?.count || '0'),
        },
        domains: {
          total: parseInt(domainsResult.rows[0]?.count || '0'),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
