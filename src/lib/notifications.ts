import { sendEmail } from "./ses";

export interface WaitlistNotificationData {
  email: string;
  estimatedVolume?: number;
  currentProvider?: string;
  referralSource?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  ipAddress?: string;
  userAgent?: string;
  signupId: string;
  createdAt: string;
}

export async function sendWaitlistNotification(data: WaitlistNotificationData): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const fromEmail = process.env.FROM_EMAIL || "info@freeresend.com";

  if (!adminEmail) {
    console.warn("ADMIN_EMAIL not configured, skipping waitlist notification");
    return;
  }

  // Format the estimated volume for display
  const formatVolume = (volume?: number) => {
    if (volume === undefined || volume === null) return "Not specified";
    return volume.toLocaleString() + " emails/month";
  };

  // Format UTM parameters
  const utmInfo = [
    data.utmSource && `Source: ${data.utmSource}`,
    data.utmMedium && `Medium: ${data.utmMedium}`,
    data.utmCampaign && `Campaign: ${data.utmCampaign}`,
  ].filter(Boolean).join(" | ");

  const subject = `🚀 New Waitlist Signup: ${data.email}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Waitlist Signup</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 30px; }
        .signup-info { background: #f8fafc; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .info-row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #475569; }
        .value { color: #1e293b; }
        .highlight { background: #dbeafe; color: #1d4ed8; padding: 2px 6px; border-radius: 4px; font-weight: 500; }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
        .cta { background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin: 20px 0; font-weight: 500; }
        .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .stat-card { background: #f8fafc; padding: 15px; border-radius: 6px; text-align: center; border-left: 4px solid #3b82f6; }
        .stat-number { font-size: 20px; font-weight: 700; color: #1e293b; }
        .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 New Waitlist Signup</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Someone just joined the FreeResend hosted version waitlist!</p>
        </div>
        
        <div class="content">
          <div class="signup-info">
            <div class="info-row">
              <span class="label">Email:</span>
              <span class="value highlight">${data.email}</span>
            </div>
            <div class="info-row">
              <span class="label">Expected Volume:</span>
              <span class="value">${formatVolume(data.estimatedVolume)}</span>
            </div>
            <div class="info-row">
              <span class="label">Current Provider:</span>
              <span class="value">${data.currentProvider || "Not specified"}</span>
            </div>
            <div class="info-row">
              <span class="label">Referral Source:</span>
              <span class="value">${data.referralSource || "Not specified"}</span>
            </div>
            <div class="info-row">
              <span class="label">Signup Time:</span>
              <span class="value">${new Date(data.createdAt).toLocaleString()}</span>
            </div>
            ${utmInfo ? `
            <div class="info-row">
              <span class="label">UTM Parameters:</span>
              <span class="value">${utmInfo}</span>
            </div>
            ` : ''}
          </div>

          <div class="stats">
            <div class="stat-card">
              <div class="stat-number">${data.estimatedVolume ? Math.round(data.estimatedVolume / 1000) + 'K' : '?'}</div>
              <div class="stat-label">Monthly Volume</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">ID: ${data.signupId.substring(0, 8)}</div>
              <div class="stat-label">Signup ID</div>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/admin/waitlist" class="cta">
              View All Signups
            </a>
          </div>

          <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
            <h3 style="margin: 0 0 10px 0; color: #92400e;">💡 Quick Actions</h3>
            <ul style="margin: 0; padding-left: 20px; color: #92400e;">
              <li>Review their expected volume for pricing tier planning</li>
              <li>Consider reaching out if they're a high-volume user</li>
              <li>Track conversion from ${data.currentProvider || 'unknown provider'}</li>
            </ul>
          </div>
        </div>

        <div class="footer">
          <p>This notification was sent because someone joined the FreeResend hosted version waitlist.</p>
          <p><strong>FreeResend Admin Notifications</strong> • ${new Date().getFullYear()}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
🚀 NEW WAITLIST SIGNUP

Email: ${data.email}
Expected Volume: ${formatVolume(data.estimatedVolume)}
Current Provider: ${data.currentProvider || "Not specified"}
Referral Source: ${data.referralSource || "Not specified"}
Signup Time: ${new Date(data.createdAt).toLocaleString()}
Signup ID: ${data.signupId}

${utmInfo ? `UTM Parameters: ${utmInfo}` : ''}

View all signups: ${process.env.NEXTAUTH_URL}/admin/waitlist

---
FreeResend Admin Notifications
  `;

  try {
    await sendEmail({
      from: `FreeResend Notifications <${fromEmail}>`,
      to: [adminEmail],
      subject,
      html,
      text,
      tags: {
        type: "waitlist_notification",
        signup_id: data.signupId,
      },
    });

    console.log(`Waitlist notification sent to ${adminEmail} for signup: ${data.email}`);
  } catch (error) {
    console.error("Failed to send waitlist notification:", error);
    // Don't throw error - we don't want to fail the signup if notification fails
  }
}

export async function sendWelcomeEmail(email: string, signupId: string): Promise<void> {
  const fromEmail = process.env.FROM_EMAIL || "info@freeresend.com";
  const subject = "Welcome to the FreeResend Waitlist! 🚀";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to FreeResend Waitlist</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .highlight { background: #dbeafe; color: #1d4ed8; padding: 3px 8px; border-radius: 4px; font-weight: 500; }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
        .cta { background: #3b82f6; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; display: inline-block; margin: 20px 0; font-weight: 500; }
        .benefits { background: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0; }
        .benefit-item { display: flex; align-items: flex-start; margin: 15px 0; }
        .benefit-icon { background: #dbeafe; color: #1d4ed8; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 14px; flex-shrink: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 You're on the waitlist!</h1>
          <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 18px;">Welcome to the future of email infrastructure</p>
        </div>
        
        <div class="content">
          <p>Hi there!</p>
          
          <p>Thanks for joining the <span class="highlight">FreeResend hosted version waitlist</span>! You're now in line to be among the first to experience our fully managed email service.</p>

          <div class="benefits">
            <h3 style="margin: 0 0 20px 0; color: #1e293b;">What you can expect:</h3>
            
            <div class="benefit-item">
              <div class="benefit-icon">💰</div>
              <div>
                <strong>50-85% cost savings</strong> compared to premium email services like Resend
              </div>
            </div>
            
            <div class="benefit-item">
              <div class="benefit-icon">🔧</div>
              <div>
                <strong>Zero maintenance</strong> - we handle all the infrastructure for you
              </div>
            </div>
            
            <div class="benefit-item">
              <div class="benefit-icon">🔄</div>
              <div>
                <strong>Drop-in compatibility</strong> with Resend API - just change one environment variable
              </div>
            </div>
            
            <div class="benefit-item">
              <div class="benefit-icon">⚡</div>
              <div>
                <strong>Lightning fast setup</strong> - from signup to sending emails in under 60 seconds
              </div>
            </div>
          </div>

          <p>We'll notify you as soon as the hosted version becomes available. In the meantime, you can:</p>
          
          <ul>
            <li>Try the <strong>self-hosted version</strong> on GitHub (it's open source!)</li>
            <li>Join our community discussions</li>
            <li>Follow us for updates and tips</li>
          </ul>

          <div style="text-align: center;">
            <a href="https://github.com/eibrahim/freeresend" class="cta">
              Explore Self-Hosted Version
            </a>
          </div>

          <div style="margin-top: 30px; padding: 20px; background: #ecfdf5; border-radius: 6px; border-left: 4px solid #10b981;">
            <p style="margin: 0; color: #065f46;"><strong>💡 Pro tip:</strong> While you wait, check out our pricing calculator to see exactly how much you'll save compared to your current provider!</p>
          </div>
        </div>

        <div class="footer">
          <p>You're receiving this because you joined the FreeResend waitlist.</p>
          <p><strong>FreeResend</strong> • Making email infrastructure affordable for everyone</p>
          <p style="font-size: 12px; margin-top: 15px;">Signup ID: ${signupId}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
🎉 You're on the FreeResend waitlist!

Hi there!

Thanks for joining the FreeResend hosted version waitlist! You're now in line to be among the first to experience our fully managed email service.

What you can expect:
• 50-85% cost savings compared to premium email services
• Zero maintenance - we handle all the infrastructure
• Drop-in compatibility with Resend API
• Lightning fast setup - from signup to sending in under 60 seconds

We'll notify you as soon as the hosted version becomes available.

In the meantime, you can try the self-hosted version on GitHub:
https://github.com/eibrahim/freeresend

Thanks for joining us!
The FreeResend Team

---
Signup ID: ${signupId}
  `;

  try {
    await sendEmail({
      from: `FreeResend <${fromEmail}>`,
      to: [email],
      subject,
      html,
      text,
      tags: {
        type: "waitlist_welcome",
        signup_id: signupId,
      },
    });

    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send welcome email to ${email}:`, error);
    // Don't throw error - we don't want to fail the signup if welcome email fails
  }
}