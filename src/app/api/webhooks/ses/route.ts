import { NextRequest, NextResponse } from "next/server";
import { withCors, handleError } from "@/lib/middleware";
import { supabaseAdmin } from "@/lib/supabase";

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
    const { data: emailLog, error } = await supabaseAdmin
      .from("email_logs")
      .select("*")
      .eq("ses_message_id", message.mail.messageId)
      .single();

    if (error || !emailLog) {
      console.warn(
        `Email log not found for message ID: ${message.mail.messageId}`
      );
      return;
    }

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
    await supabaseAdmin
      .from("email_logs")
      .update({
        status: newStatus,
        error_message: errorMessage,
        webhook_data: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", emailLog.id);

    // Create webhook event record
    await supabaseAdmin.from("webhook_events").insert({
      email_log_id: emailLog.id,
      event_type: message.eventType,
      event_data: message,
      processed: true,
    });

    console.log(
      `Processed ${message.eventType} event for email ${emailLog.id}`
    );
  } catch (error) {
    console.error("Failed to process SES event:", error);

    // Create unprocessed webhook event for manual review
    try {
      await supabaseAdmin.from("webhook_events").insert({
        email_log_id: null,
        event_type: message.eventType,
        event_data: message,
        processed: false,
      });
    } catch (insertError) {
      console.error("Failed to create webhook event record:", insertError);
    }
  }
}

export const POST = withCors(handleSESWebhook);
