import {
  SESClient,
  SendEmailCommand,
  SendRawEmailCommand,
  VerifyDomainIdentityCommand,
  GetIdentityVerificationAttributesCommand,
  DeleteIdentityCommand,
  CreateConfigurationSetCommand,
  VerifyDomainDkimCommand,
  GetIdentityDkimAttributesCommand,
} from "@aws-sdk/client-ses";

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface EmailAttachment {
  filename: string;
  content: string;
  contentType: string;
}

export interface SendEmailOptions {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
  replyTo?: string[];
  tags?: Record<string, string>;
}

export interface SESVerificationResult {
  verificationToken: string;
  status: "Pending" | "Success" | "Failed" | "TemporaryFailure" | "NotStarted";
}

export async function sendEmail(options: SendEmailOptions): Promise<string> {
  const { from, to, cc, bcc, subject, html, text, replyTo, tags } = options;

  if (options.attachments && options.attachments.length > 0) {
    // Use raw email for attachments
    return sendRawEmail(options);
  }

  const command = new SendEmailCommand({
    Source: from,
    Destination: {
      ToAddresses: to,
      CcAddresses: cc,
      BccAddresses: bcc,
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
      Body: {
        Html: html
          ? {
              Data: html,
              Charset: "UTF-8",
            }
          : undefined,
        Text: text
          ? {
              Data: text,
              Charset: "UTF-8",
            }
          : undefined,
      },
    },
    ReplyToAddresses: replyTo,
    Tags: tags
      ? Object.entries(tags).map(([Name, Value]) => ({ Name, Value }))
      : undefined,
  });

  const response = await sesClient.send(command);
  return response.MessageId!;
}

export async function sendRawEmail(options: SendEmailOptions): Promise<string> {
  const {
    from,
    to,
    cc,
    bcc,
    subject,
    html,
    text,
    attachments = [],
    replyTo,
  } = options;

  // Build raw email
  const boundary = `----=_NextPart_${Date.now()}_${Math.random().toString(36)}`;
  const recipients = [...to, ...(cc || []), ...(bcc || [])];

  let rawMessage = "";

  // Headers
  rawMessage += `From: ${from}\r\n`;
  rawMessage += `To: ${to.join(", ")}\r\n`;
  if (cc && cc.length > 0) rawMessage += `Cc: ${cc.join(", ")}\r\n`;
  if (replyTo && replyTo.length > 0)
    rawMessage += `Reply-To: ${replyTo.join(", ")}\r\n`;
  rawMessage += `Subject: ${subject}\r\n`;
  rawMessage += `MIME-Version: 1.0\r\n`;
  rawMessage += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;

  // Body parts
  rawMessage += `--${boundary}\r\n`;
  rawMessage += `Content-Type: multipart/alternative; boundary="${boundary}-alt"\r\n\r\n`;

  if (text) {
    rawMessage += `--${boundary}-alt\r\n`;
    rawMessage += `Content-Type: text/plain; charset=UTF-8\r\n\r\n`;
    rawMessage += `${text}\r\n\r\n`;
  }

  if (html) {
    rawMessage += `--${boundary}-alt\r\n`;
    rawMessage += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
    rawMessage += `${html}\r\n\r\n`;
  }

  rawMessage += `--${boundary}-alt--\r\n`;

  // Attachments
  for (const attachment of attachments) {
    rawMessage += `--${boundary}\r\n`;
    rawMessage += `Content-Type: ${attachment.contentType}\r\n`;
    rawMessage += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
    rawMessage += `Content-Transfer-Encoding: base64\r\n\r\n`;
    rawMessage += `${attachment.content}\r\n`;
  }

  rawMessage += `--${boundary}--\r\n`;

  const command = new SendRawEmailCommand({
    Source: from,
    Destinations: recipients,
    RawMessage: {
      Data: new TextEncoder().encode(rawMessage),
    },
  });

  const response = await sesClient.send(command);
  return response.MessageId!;
}

export async function verifyDomain(
  domain: string
): Promise<SESVerificationResult> {
  const command = new VerifyDomainIdentityCommand({
    Domain: domain,
  });

  const response = await sesClient.send(command);

  return {
    verificationToken: response.VerificationToken!,
    status: "Pending",
  };
}

export async function getDomainVerificationStatus(
  domain: string
): Promise<string> {
  const command = new GetIdentityVerificationAttributesCommand({
    Identities: [domain],
  });

  const response = await sesClient.send(command);
  const attributes = response.VerificationAttributes?.[domain];

  return attributes?.VerificationStatus || "NotStarted";
}

export async function enableDomainDkim(domain: string): Promise<string[]> {
  const command = new VerifyDomainDkimCommand({
    Domain: domain,
  });

  const response = await sesClient.send(command);
  return response.DkimTokens || [];
}

export async function getDomainDkimTokens(domain: string): Promise<string[]> {
  const command = new GetIdentityDkimAttributesCommand({
    Identities: [domain],
  });

  const response = await sesClient.send(command);
  const attributes = response.DkimAttributes?.[domain];

  return attributes?.DkimTokens || [];
}

export async function deleteDomainIdentity(domain: string): Promise<void> {
  const command = new DeleteIdentityCommand({
    Identity: domain,
  });

  await sesClient.send(command);
}

export async function createConfigurationSet(domain: string): Promise<string> {
  const configSetName = `freeresend-${domain.replace(/\./g, "-")}`;

  try {
    const command = new CreateConfigurationSetCommand({
      ConfigurationSet: {
        Name: configSetName,
      },
    });

    await sesClient.send(command);

    return configSetName;
  } catch (error: unknown) {
    const awsError = error as { name?: string; message?: string; $metadata?: { httpStatusCode?: number } };
    // Handle various ways AWS might indicate the configuration set already exists
    if (
      awsError.name === "AlreadyExistsException" ||
      awsError.name === "ConfigurationSetAlreadyExistsException" ||
      awsError.message?.includes("already exists") ||
      awsError.message?.includes("Configuration set") ||
      awsError.$metadata?.httpStatusCode === 409
    ) {
      console.log(
        `Configuration set ${configSetName} already exists, continuing...`
      );
      return configSetName;
    }
    console.error("SES Configuration Set Error:", error);
    throw error;
  }
}

export function generateDNSRecords(
  domain: string,
  verificationToken: string,
  dkimTokens: string[] = []
) {
  const records = [
    {
      type: "TXT",
      name: `_amazonses.${domain}`,
      value: verificationToken,
      ttl: 300,
      description: "SES Domain Verification",
    },
    {
      type: "MX",
      name: domain,
      value: "10 inbound-smtp.us-east-1.amazonaws.com.", // Trailing dot required by Digital Ocean
      ttl: 300,
      description: "SES Inbound Email",
    },
    {
      type: "TXT",
      name: domain,
      value: "v=spf1 include:amazonses.com ~all",
      ttl: 300,
      description: "SPF Record for SES",
    },
    {
      type: "TXT",
      name: `_dmarc.${domain}`,
      value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@" + domain,
      ttl: 300,
      description: "DMARC Policy",
    },
  ];

  // Add DKIM CNAME records
  dkimTokens.forEach((token) => {
    records.push({
      type: "CNAME",
      name: `${token}._domainkey.${domain}`,
      value: `${token}.dkim.amazonses.com.`, // Trailing dot required
      ttl: 300,
      description: `DKIM Record (${token.substring(0, 8)}...)`,
    });
  });

  return records;
}
