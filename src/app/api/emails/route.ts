import { NextResponse } from "next/server";
import { z } from "zod";
import {
  withApiKey,
  withCors,
  validateRequest,
  handleError,
} from "@/lib/middleware";
import { sendEmail } from "@/lib/ses";
import { getDomainById } from "@/lib/domains";
import { query } from "@/lib/database";
import type { AuthenticatedRequest } from "@/lib/middleware";

const attachmentSchema = z.object({
  filename: z.string(),
  content: z.string(), // Base64 encoded
  contentType: z.string().optional(),
});

const sendEmailSchema = z
  .object({
    from: z.string().email("Invalid from email"),
    to: z
      .array(z.string().email("Invalid to email"))
      .min(1, "At least one recipient is required"),
    cc: z.array(z.string().email("Invalid cc email")).optional(),
    bcc: z.array(z.string().email("Invalid bcc email")).optional(),
    subject: z.string().min(1, "Subject is required"),
    html: z.string().optional(),
    text: z.string().optional(),
    attachments: z.array(attachmentSchema).optional(),
    reply_to: z.array(z.string().email("Invalid reply_to email")).optional(),
    tags: z.record(z.string(), z.string()).optional(),
  })
  .refine((data) => data.html || data.text, {
    message: "Either html or text content is required",
  });

type EmailBody = {
  from: string;
  to: string[] | string;
  cc?: string[] | string;
  bcc?: string[] | string;
  subject?: string;
  html?: string;
  text?: string;
  attachments?: Array<{ filename: string; content: string; contentType?: string }>;
  reply_to?: string[] | string;
  tags?: Record<string, string>;
};

async function sendEmailHandler(
  req: AuthenticatedRequest,
  body: EmailBody
) {
  try {
    const {
      from,
      to,
      cc,
      bcc,
      subject,
      html,
      text,
      attachments,
      reply_to,
      tags,
    } = body;
    const apiKey = req.apiKey!;

    // Verify the from domain is authorized for this API key
    const domain = await getDomainById(apiKey.domain_id);
    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    if (domain.status !== "verified") {
      return NextResponse.json(
        { error: "Domain not verified" },
        { status: 400 }
      );
    }

    // Validate from email domain
    const fromDomain = from.split("@")[1];
    if (fromDomain !== domain.domain) {
      return NextResponse.json(
        { error: `From email must be from domain: ${domain.domain}` },
        { status: 400 }
      );
    }

    // Check API key permissions
    if (!apiKey.permissions.includes("send")) {
      return NextResponse.json(
        { error: "API key does not have send permission" },
        { status: 403 }
      );
    }

    // Convert arrays and prepare data for SES
    const toArray = Array.isArray(to) ? to : [to];
    const ccArray = cc ? (Array.isArray(cc) ? cc : [cc]) : undefined;
    const bccArray = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined;
    const replyToArray = reply_to ? (Array.isArray(reply_to) ? reply_to : [reply_to]) : undefined;
    
    // Convert attachments to match EmailAttachment interface
    const sesAttachments = attachments?.map(att => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType || 'application/octet-stream'
    }));

    // Send email via SES
    const messageId = await sendEmail({
      from,
      to: toArray,
      cc: ccArray,
      bcc: bccArray,
      subject: subject || '',
      html,
      text,
      attachments: sesAttachments,
      replyTo: replyToArray,
      tags,
    });

    // Log email in database
    let emailLog = null;
    try {
      const result = await query(
        `INSERT INTO email_logs (
          api_key_id, domain_id, from_email, to_emails, cc_emails, bcc_emails,
          subject, html_content, text_content, attachments, status, ses_message_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          apiKey.id,
          domain.id,
          from,
          JSON.stringify(to),
          JSON.stringify(cc || []),
          JSON.stringify(bcc || []),
          subject,
          html,
          text,
          JSON.stringify(attachments || []),
          "sent",
          messageId,
        ]
      );
      emailLog = result.rows[0];
    } catch (logError) {
      console.error("Failed to log email:", logError);
    }

    return NextResponse.json({
      id: emailLog?.id || messageId,
      from,
      to,
      created_at: new Date().toISOString(),
    });
  } catch (error: unknown) {
    // Log failed email attempt
    try {
      await query(
        `INSERT INTO email_logs (
          api_key_id, domain_id, from_email, to_emails, cc_emails, bcc_emails,
          subject, html_content, text_content, attachments, status, error_message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          req.apiKey?.id,
          req.apiKey?.domain_id,
          body?.from || "",
          JSON.stringify(body?.to || []),
          JSON.stringify(body?.cc || []),
          JSON.stringify(body?.bcc || []),
          body?.subject || "",
          body?.html,
          body?.text,
          JSON.stringify(body?.attachments || []),
          "failed",
          (error as { message?: string }).message || "Unknown error",
        ]
      );
    } catch (logError) {
      console.error("Failed to log failed email:", logError);
    }

    return handleError(error);
  }
}

export const POST = withCors(
  withApiKey(validateRequest(sendEmailSchema)(sendEmailHandler))
);
