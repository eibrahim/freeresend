import { IAMClient, CreateUserCommand, CreateAccessKeyCommand, DeleteUserCommand, DeleteAccessKeyCommand, ListAccessKeysCommand, AttachUserPolicyCommand, DetachUserPolicyCommand } from "@aws-sdk/client-iam";
import * as crypto from "crypto";

const iamClient = new IAMClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const SES_SENDING_POLICY_ARN = "arn:aws:iam::aws:policy/AmazonSESFullAccess";

interface SmtpCredentials {
  username: string;
  password: string;
  server: string;
  port: number;
  domain: string;
}

/**
 * Convert AWS Secret Access Key to SMTP password
 * AWS documentation: https://docs.aws.amazon.com/ses/latest/dg/smtp-credentials.html
 */
function convertSecretKeyToSmtpPassword(secretAccessKey: string, region: string): string {
  const DATE = "11111111";
  const SERVICE = "ses";
  const MESSAGE = "SendRawEmail";
  const TERMINAL = "aws4_request";
  const VERSION = 0x04;

  // Signing function
  const sign = (key: Buffer | string, msg: string): Buffer => {
    return crypto.createHmac("sha256", key).update(msg, "utf8").digest();
  };

  // Derive the signing key
  let signature = sign("AWS4" + secretAccessKey, DATE);
  signature = sign(signature, region);
  signature = sign(signature, SERVICE);
  signature = sign(signature, TERMINAL);
  signature = sign(signature, MESSAGE);

  // Prepend version byte and base64 encode
  const signatureAndVersion = Buffer.concat([Buffer.from([VERSION]), signature]);
  return signatureAndVersion.toString("base64");
}

/**
 * Get SMTP server endpoint for a region
 */
function getSmtpServer(region: string): string {
  return `email-smtp.${region}.amazonaws.com`;
}

/**
 * Create IAM user and generate SMTP credentials for a domain
 */
export async function createSmtpCredentials(domain: string): Promise<SmtpCredentials> {
  const region = process.env.AWS_REGION || "us-east-1";
  const userName = `freeresend-smtp-${domain.replace(/\./g, "-")}`;

  try {
    // Create IAM user
    await iamClient.send(new CreateUserCommand({
      UserName: userName,
      Tags: [
        { Key: "Domain", Value: domain },
        { Key: "Service", Value: "FreeResend" },
        { Key: "Purpose", Value: "SMTP" }
      ]
    }));

    // Attach SES sending policy
    await iamClient.send(new AttachUserPolicyCommand({
      UserName: userName,
      PolicyArn: SES_SENDING_POLICY_ARN
    }));

    // Create access key
    const accessKeyResponse = await iamClient.send(new CreateAccessKeyCommand({
      UserName: userName
    }));

    if (!accessKeyResponse.AccessKey?.AccessKeyId || !accessKeyResponse.AccessKey?.SecretAccessKey) {
      throw new Error("Failed to create access key");
    }

    const accessKeyId = accessKeyResponse.AccessKey.AccessKeyId;
    const secretAccessKey = accessKeyResponse.AccessKey.SecretAccessKey;

    // Convert secret key to SMTP password
    const smtpPassword = convertSecretKeyToSmtpPassword(secretAccessKey, region);

    return {
      username: accessKeyId,
      password: smtpPassword,
      server: getSmtpServer(region),
      port: 587, // STARTTLS
      domain
    };
  } catch (error) {
    // If user creation fails, try to clean up
    try {
      await deleteSmtpCredentials(domain);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Delete IAM user and SMTP credentials for a domain
 */
export async function deleteSmtpCredentials(domain: string): Promise<void> {
  const userName = `freeresend-smtp-${domain.replace(/\./g, "-")}`;

  try {
    // List and delete all access keys
    const accessKeysResponse = await iamClient.send(new ListAccessKeysCommand({
      UserName: userName
    }));

    if (accessKeysResponse.AccessKeyMetadata) {
      for (const key of accessKeysResponse.AccessKeyMetadata) {
        if (key.AccessKeyId) {
          await iamClient.send(new DeleteAccessKeyCommand({
            UserName: userName,
            AccessKeyId: key.AccessKeyId
          }));
        }
      }
    }

    // Detach policy
    try {
      await iamClient.send(new DetachUserPolicyCommand({
        UserName: userName,
        PolicyArn: SES_SENDING_POLICY_ARN
      }));
    } catch {
      // Policy might not be attached
    }

    // Delete user
    await iamClient.send(new DeleteUserCommand({
      UserName: userName
    }));
  } catch (error) {
    // User might not exist
    console.error("Error deleting SMTP credentials:", error);
  }
}

/**
 * Validate SMTP credentials format
 */
export function validateSmtpCredentials(credentials: unknown): credentials is SmtpCredentials {
  if (!credentials || typeof credentials !== "object") {
    return false;
  }

  const creds = credentials as Record<string, unknown>;
  return (
    typeof creds.username === "string" &&
    typeof creds.password === "string" &&
    typeof creds.server === "string" &&
    typeof creds.port === "number" &&
    typeof creds.domain === "string"
  );
}
