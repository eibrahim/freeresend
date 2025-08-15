import { query } from "./database";
import {
  verifyDomain,
  getDomainVerificationStatus,
  createConfigurationSet,
  generateDNSRecords,
  enableDomainDkim,
  getDomainDkimTokens,
} from "./ses";
import {
  setupDomainDNS,
  verifyDomainOwnership,
  type DODomainRecord,
} from "./digitalocean";
import type { Domain } from "./database";

export interface DNSRecord {
  type: string;
  name: string;
  value: string;
  ttl?: number;
}

export interface DomainSetupResult {
  domain: Domain;
  dnsRecords: DNSRecord[];
  sesConfigurationSet?: string;
  digitalOceanRecords?: DNSRecord[];
  setupInstructions: string;
}

// Helper function to safely parse DNS records (handles both string and object)
function safeParseDNSRecords(dnsRecords: unknown): DNSRecord[] {
  if (!dnsRecords) return [];
  if (typeof dnsRecords === "string") {
    try {
      return JSON.parse(dnsRecords);
    } catch {
      return [];
    }
  }
  if (Array.isArray(dnsRecords)) {
    return dnsRecords;
  }
  return [];
}

// Helper function to safely stringify JSON with circular reference protection
function safeJSONStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.error("JSON stringify error:", error);
    console.error("Object causing error:", obj);
    // Try to create a safe version by copying only plain properties
    if (Array.isArray(obj)) {
      return JSON.stringify(
        obj.map((item: Record<string, unknown>) => ({
          type: item.type,
          name: item.name,
          value: item.value || item.data,
          ttl: item.ttl,
        }))
      );
    }
    return "[]";
  }
}

// Helper function to convert DODomainRecord to DNSRecord
function convertDORecordToDNSRecord(doRecord: DODomainRecord): DNSRecord {
  return {
    type: doRecord.type,
    name: doRecord.name,
    value: doRecord.data,
    ttl: doRecord.ttl,
  };
}

export async function addDomain(
  userId: string,
  domainName: string
): Promise<DomainSetupResult> {
  // Validate domain format
  if (!isValidDomain(domainName)) {
    throw new Error("Invalid domain format");
  }

  // Check if domain already exists in our database
  const existingDomain = await getDomainByName(domainName);
  if (existingDomain) {
    // If domain exists, check and complete its setup
    return await verifyAndCompleteExistingDomain(userId, existingDomain);
  }

  try {
    // 1. Verify domain with Amazon SES
    const sesVerification = await verifyDomain(domainName);

    // 2. Enable DKIM for the domain (optional - graceful fallback)
    let dkimTokens: string[] = [];
    try {
      dkimTokens = await enableDomainDkim(domainName);
      console.log(
        `DKIM enabled for ${domainName} with ${dkimTokens.length} tokens`
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.warn(`DKIM setup failed for ${domainName}:`, errorMessage);
      console.warn(
        "Continuing without DKIM (you can set it up manually in AWS SES console)"
      );
    }

    // 3. Create SES configuration set
    const configurationSet = await createConfigurationSet(domainName);

    // 4. Generate DNS records (including DKIM if available)
    const dnsRecords = generateDNSRecords(
      domainName,
      sesVerification.verificationToken,
      dkimTokens
    );

    // 5. Setup DNS records in Digital Ocean (if configured)
    let digitalOceanRecords: DNSRecord[] = [];
    let setupInstructions = "";

    try {
      const isDomainInDO = await verifyDomainOwnership(domainName);
      if (isDomainInDO) {
        const doRecords = await setupDomainDNS(domainName, dnsRecords);
        digitalOceanRecords = doRecords.map(convertDORecordToDNSRecord);
        setupInstructions =
          "DNS records have been automatically created in Digital Ocean.";
      } else {
        setupInstructions = `Domain not found in Digital Ocean. Please create the DNS records manually or add the domain to your Digital Ocean account first.`;
      }
    } catch (error: unknown) {
      console.warn("Digital Ocean setup failed:", error);
      setupInstructions =
        "DNS records need to be created manually. Please add the following records to your DNS provider:";
    }

    // 6. Store domain information in database
    const result = await query(
      `INSERT INTO domains (user_id, domain, status, ses_configuration_set, dns_records, verification_token) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        userId,
        domainName,
        "pending",
        configurationSet,
        safeJSONStringify(dnsRecords || []),
        sesVerification.verificationToken,
      ]
    );

    if (result.rows.length === 0) {
      throw new Error("Failed to create domain record");
    }

    const domain = {
      ...result.rows[0],
      dns_records: safeParseDNSRecords(result.rows[0].dns_records),
    };

    return {
      domain,
      dnsRecords,
      sesConfigurationSet: configurationSet,
      digitalOceanRecords,
      setupInstructions,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to add domain: ${errorMessage}`);
  }
}

async function verifyAndCompleteExistingDomain(
  userId: string,
  existingDomain: Domain
): Promise<DomainSetupResult> {
  // Check ownership
  if (existingDomain.user_id !== userId) {
    throw new Error("Domain belongs to another user");
  }

  const domainName = existingDomain.domain;
  let needsUpdate = false;
  const updateFields: Record<string, string> = {};
  let setupInstructions = "";
  let digitalOceanRecords: DNSRecord[] = [];

  try {
    // 1. Check SES domain status
    let sesStatus = "NotStarted";
    let sesVerificationToken = existingDomain.verification_token;

    try {
      sesStatus = await getDomainVerificationStatus(domainName);
      console.log(`SES status for ${domainName}: ${sesStatus}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes("not exist") ||
        errorMessage.includes("not found")
      ) {
        // Domain doesn't exist in SES, need to verify it
        console.log(`Domain ${domainName} not found in SES, re-verifying...`);
        try {
          const sesVerification = await verifyDomain(domainName);
          sesVerificationToken = sesVerification.verificationToken;
          sesStatus = "Pending";
          needsUpdate = true;
          updateFields.verification_token = sesVerificationToken;
          console.log(`Re-verified domain ${domainName} in SES`);
        } catch (verifyError: unknown) {
          const verifyErrorMessage =
            verifyError instanceof Error
              ? verifyError.message
              : String(verifyError);
          console.warn(
            `Failed to re-verify domain in SES: ${verifyErrorMessage}`
          );
        }
      }
    }

    // 2. Check/setup DKIM
    let dkimTokens: string[] = [];
    try {
      dkimTokens = await getDomainDkimTokens(domainName);
      console.log(`Found ${dkimTokens.length} DKIM tokens for ${domainName}`);
    } catch {
      console.log(`DKIM not found for ${domainName}, attempting to enable...`);
      try {
        dkimTokens = await enableDomainDkim(domainName);
        console.log(
          `Enabled DKIM for ${domainName} with ${dkimTokens.length} tokens`
        );
      } catch (dkimError: unknown) {
        const dkimErrorMessage =
          dkimError instanceof Error ? dkimError.message : String(dkimError);
        console.warn(
          `Failed to enable DKIM for ${domainName}: ${dkimErrorMessage}`
        );
      }
    }

    // 3. Check/create SES configuration set
    let configurationSet = existingDomain.ses_configuration_set;
    if (!configurationSet) {
      try {
        configurationSet = await createConfigurationSet(domainName);
        needsUpdate = true;
        updateFields.ses_configuration_set = configurationSet;
        console.log(
          `Created configuration set for ${domainName}: ${configurationSet}`
        );
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.warn(`Failed to create configuration set: ${errorMessage}`);
      }
    }

    // 4. Generate current DNS records
    const dnsRecords = generateDNSRecords(
      domainName,
      sesVerificationToken || "",
      dkimTokens
    );

    // 5. Check/setup Digital Ocean DNS
    try {
      const isDomainInDO = await verifyDomainOwnership(domainName);
      if (isDomainInDO) {
        console.log(
          `Domain ${domainName} found in Digital Ocean, checking DNS setup...`
        );
        try {
          const doRecords = await setupDomainDNS(domainName, dnsRecords);
          digitalOceanRecords = doRecords.map(convertDORecordToDNSRecord);
          setupInstructions =
            "DNS records have been verified/updated in Digital Ocean.";
        } catch (dnsError: unknown) {
          const dnsErrorMessage =
            dnsError instanceof Error ? dnsError.message : String(dnsError);
          console.warn(`DNS setup failed: ${dnsErrorMessage}`);
          setupInstructions =
            "DNS records need to be updated manually in Digital Ocean.";
        }
      } else {
        setupInstructions = `Domain not found in Digital Ocean. Please add the domain to your Digital Ocean account or create DNS records manually.`;
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.warn(`Digital Ocean check failed: ${errorMessage}`);
      setupInstructions =
        "Unable to verify Digital Ocean setup. Please check DNS records manually.";
    }

    // 6. Update database if needed
    if (needsUpdate) {
      const updateQuery = `
        UPDATE domains 
        SET ${Object.keys(updateFields)
          .map((key, index) => `${key} = $${index + 2}`)
          .join(", ")}, 
            dns_records = $${Object.keys(updateFields).length + 2},
            updated_at = NOW()
        WHERE id = $1 
        RETURNING *`;

      const queryParams = [
        existingDomain.id,
        ...Object.values(updateFields),
        safeJSONStringify(dnsRecords || []),
      ];

      const result = await query(updateQuery, queryParams);

      if (result.rows.length > 0) {
        const updatedDomain = {
          ...result.rows[0],
          dns_records: safeParseDNSRecords(result.rows[0].dns_records),
        };

        return {
          domain: updatedDomain,
          dnsRecords,
          sesConfigurationSet: configurationSet,
          digitalOceanRecords,
          setupInstructions: `Domain already exists. ${setupInstructions}`,
        };
      }
    }

    // 7. Return existing domain with current setup info
    return {
      domain: existingDomain,
      dnsRecords,
      sesConfigurationSet: configurationSet,
      digitalOceanRecords,
      setupInstructions: `Domain already exists. ${setupInstructions}`,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to verify existing domain setup: ${errorMessage}`);
  }
}

export async function getUserDomains(userId: string): Promise<Domain[]> {
  try {
    const result = await query(
      `SELECT * FROM domains 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows.map((row) => ({
      ...row,
      dns_records: safeParseDNSRecords(row.dns_records),
    }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch domains: ${errorMessage}`);
  }
}

export async function getDomainById(domainId: string): Promise<Domain | null> {
  try {
    const result = await query("SELECT * FROM domains WHERE id = $1 LIMIT 1", [
      domainId,
    ]);

    if (result.rows.length === 0) {
      return null;
    }

    const domain = result.rows[0];
    return {
      ...domain,
      dns_records: safeParseDNSRecords(domain.dns_records),
    };
  } catch (error) {
    console.error("Get domain by ID error:", error);
    return null;
  }
}

export async function getDomainByName(
  domainName: string
): Promise<Domain | null> {
  try {
    const result = await query(
      "SELECT * FROM domains WHERE domain = $1 LIMIT 1",
      [domainName]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const domain = result.rows[0];
    return {
      ...domain,
      dns_records: safeParseDNSRecords(domain.dns_records),
    };
  } catch (error) {
    console.error("Get domain by name error:", error);
    return null;
  }
}

export async function updateDomainStatus(
  domainId: string,
  status: Domain["status"]
): Promise<void> {
  try {
    const result = await query("UPDATE domains SET status = $1 WHERE id = $2", [
      status,
      domainId,
    ]);

    if (result.rowCount === 0) {
      throw new Error("Domain not found");
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to update domain status: ${errorMessage}`);
  }
}

export async function checkDomainVerification(
  domainId: string
): Promise<Domain["status"]> {
  const domain = await getDomainById(domainId);
  if (!domain) {
    throw new Error("Domain not found");
  }

  try {
    const sesStatus = await getDomainVerificationStatus(domain.domain);

    let newStatus: Domain["status"] = "pending";
    if (sesStatus === "Success") {
      newStatus = "verified";
    } else if (sesStatus === "Failed") {
      newStatus = "failed";
    }

    if (newStatus !== domain.status) {
      await updateDomainStatus(domainId, newStatus);
    }

    return newStatus;
  } catch (error) {
    console.error("Failed to check domain verification:", error);
    return domain.status;
  }
}

export async function deleteDomain(
  domainId: string,
  userId: string
): Promise<void> {
  const domain = await getDomainById(domainId);
  if (!domain || domain.user_id !== userId) {
    throw new Error("Domain not found or unauthorized");
  }

  try {
    // Delete from SES (if needed)
    // await deleteDomainIdentity(domain.domain)

    // Delete API keys associated with this domain
    await query("DELETE FROM api_keys WHERE domain_id = $1", [domainId]);

    // Delete domain record
    const result = await query(
      "DELETE FROM domains WHERE id = $1 AND user_id = $2",
      [domainId, userId]
    );

    if (result.rowCount === 0) {
      throw new Error("Domain not found or unauthorized");
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to delete domain: ${errorMessage}`);
  }
}

export async function refreshAllDomainStatuses(): Promise<void> {
  try {
    const result = await query(
      "SELECT id, domain, status FROM domains WHERE status = 'pending'"
    );

    for (const domain of result.rows) {
      try {
        await checkDomainVerification(domain.id);
        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(
          `Failed to check verification for domain ${domain.domain}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("Failed to fetch pending domains:", error);
  }
}

export function isValidDomain(domain: string): boolean {
  const domainRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(domain) && domain.length <= 253;
}

export function extractDomainFromEmail(email: string): string {
  const parts = email.split("@");
  return parts.length === 2 ? parts[1] : "";
}

export async function validateEmailDomain(email: string): Promise<boolean> {
  const domain = extractDomainFromEmail(email);
  if (!domain) return false;

  const domainRecord = await getDomainByName(domain);
  return domainRecord?.status === "verified";
}
