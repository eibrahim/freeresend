import { NextRequest, NextResponse } from "next/server";
import { withCors, handleError } from "@/lib/middleware";
import { query } from "@/lib/database";

interface SESEvent {
  Type: string;
  MessageId: string;
  TopicArn: string;
  Subject: string;
  Message: string;
  Timestamp: string;
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
  UnsubscribeURL: string;
}

interface SESMessage {
  eventType: "send" | "delivery" | "bounce" | "complaint" | "reject";
  mail: {
    messageId: string;
    timestamp: string;
    source: string;
    destination: string[];
  };
  delivery?: {
    timestamp: string;
    processingTimeMillis: number;
    recipients: string[];
    smtpResponse: string;
  };
  bounce?: {
    bounceType: string;
    bounceSubType: string;
    bouncedRecipients: Array<{
      emailAddress: string;
      action: string;
      status: string;
      diagnosticCode: string;
    }>;
    timestamp: string;
    feedbackId: string;
  };
  complaint?: {
    complainedRecipients: Array<{
      emailAddress: string;
    }>;
    timestamp: string;
    feedbackId: string;
    complaintFeedbackType: string;
  };
}

async function handleSESWebhook(req: NextRequest) {
  try {
    const body = await req.json();

    // Handle SNS confirmation
    if (body.Type === "SubscriptionConfirmation") {
      console.log("SNS Subscription confirmation received");
      // You would typically confirm the subscription here
      return NextResponse.json({ message: "Subscription confirmed" });
    }

    // Handle SNS notification
    if (body.Type === "Notification") {
      const message: SESMessage = JSON.parse(body.Message);

      await processSESEvent(message);

      return NextResponse.json({ message: "Event processed" });
    }

    return NextResponse.json({ message: "Unknown event type" });
  } catch (error) {
    console.error("SES webhook error:", error);
    return handleError(error);
  }
}

async function processSESEvent(message: SESMessage) {
  try {
    // Find the email log by SES message ID
    const emailResult = await query(
      "SELECT * FROM email_logs WHERE ses_message_id = $1 LIMIT 1",
      [message.mail.messageId]
    );

    if (emailResult.rows.length === 0) {
      console.warn(
        `Email log not found for message ID: ${message.mail.messageId}`
      );
      return;
    }

    const emailLog = {
      ...emailResult.rows[0],
      to_emails: JSON.parse(emailResult.rows[0].to_emails || "[]"),
      cc_emails: JSON.parse(emailResult.rows[0].cc_emails || "[]"),
      bcc_emails: JSON.parse(emailResult.rows[0].bcc_emails || "[]"),
      attachments: JSON.parse(emailResult.rows[0].attachments || "[]"),
    };

    // Update email status based on event type
    let newStatus = emailLog.status;
    let errorMessage = null;

    switch (message.eventType) {
      case "delivery":
        newStatus = "delivered";
        break;
      case "bounce":
        newStatus = "bounced";
        errorMessage = message.bounce?.bouncedRecipients
          .map((r) => `${r.emailAddress}: ${r.diagnosticCode}`)
          .join("; ");
        break;
      case "complaint":
        newStatus = "complained";
        errorMessage = `Complaint from: ${message.complaint?.complainedRecipients
          .map((r) => r.emailAddress)
          .join(", ")}`;
        break;
      case "reject":
        newStatus = "failed";
        errorMessage = "Email rejected by SES";
        break;
    }

    // Update email log status
    await query(
      `UPDATE email_logs 
       SET status = $1, error_message = $2, webhook_data = $3
       WHERE id = $4`,
      [newStatus, errorMessage, JSON.stringify(message), emailLog.id]
    );

    // Create webhook event record
    await query(
      `INSERT INTO webhook_events (email_log_id, event_type, event_data, processed)
       VALUES ($1, $2, $3, $4)`,
      [emailLog.id, message.eventType, JSON.stringify(message), true]
    );

    console.log(
      `Processed ${message.eventType} event for email ${emailLog.id}`
    );
  } catch (error) {
    console.error("Failed to process SES event:", error);

    // Create unprocessed webhook event for manual review
    try {
      await query(
        `INSERT INTO webhook_events (email_log_id, event_type, event_data, processed)
         VALUES ($1, $2, $3, $4)`,
        [null, message.eventType, JSON.stringify(message), false]
      );
    } catch (insertError) {
      console.error("Failed to create webhook event record:", insertError);
    }
  }
}

export const POST = withCors(handleSESWebhook);
