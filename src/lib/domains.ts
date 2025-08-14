import { supabaseAdmin } from "./supabase";
import {
  verifyDomain,
  getDomainVerificationStatus,
  createConfigurationSet,
  generateDNSRecords,
  enableDomainDkim,
  getDomainDkimTokens,
} from "./ses";
import { setupDomainDNS, verifyDomainOwnership } from "./digitalocean";
import type { Domain } from "./supabase";

export interface DomainSetupResult {
  domain: Domain;
  dnsRecords: any[];
  sesConfigurationSet?: string;
  digitalOceanRecords?: any[];
  setupInstructions: string;
}

export async function addDomain(
  userId: string,
  domainName: string
): Promise<DomainSetupResult> {
  // Validate domain format
  if (!isValidDomain(domainName)) {
    throw new Error("Invalid domain format");
  }

  // Check if domain already exists
  const { data: existingDomain } = await supabaseAdmin
    .from("domains")
    .select("*")
    .eq("domain", domainName)
    .single();

  if (existingDomain) {
    throw new Error("Domain already exists");
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
    } catch (error: any) {
      console.warn(`DKIM setup failed for ${domainName}:`, error.message);
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
    let digitalOceanRecords = [];
    let setupInstructions = "";

    try {
      const isDomainInDO = await verifyDomainOwnership(domainName);
      if (isDomainInDO) {
        digitalOceanRecords = await setupDomainDNS(domainName, dnsRecords);
        setupInstructions =
          "DNS records have been automatically created in Digital Ocean.";
      } else {
        setupInstructions = `Domain not found in Digital Ocean. Please create the DNS records manually or add the domain to your Digital Ocean account first.`;
      }
    } catch (error) {
      console.warn("Digital Ocean setup failed:", error);
      setupInstructions =
        "DNS records need to be created manually. Please add the following records to your DNS provider:";
    }

    // 5. Create domain record in database
    const { data: domain, error } = await supabaseAdmin
      .from("domains")
      .insert({
        user_id: userId,
        domain: domainName,
        status: "pending",
        ses_configuration_set: configurationSet,
        dns_records: dnsRecords,
        verification_token: sesVerification.verificationToken,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create domain record: ${error.message}`);
    }

    return {
      domain,
      dnsRecords,
      sesConfigurationSet: configurationSet,
      digitalOceanRecords,
      setupInstructions,
    };
  } catch (error: any) {
    throw new Error(`Failed to add domain: ${error.message}`);
  }
}

export async function getUserDomains(userId: string): Promise<Domain[]> {
  const { data, error } = await supabaseAdmin
    .from("domains")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch domains: ${error.message}`);
  }

  return data || [];
}

export async function getDomainById(domainId: string): Promise<Domain | null> {
  const { data, error } = await supabaseAdmin
    .from("domains")
    .select("*")
    .eq("id", domainId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function getDomainByName(
  domainName: string
): Promise<Domain | null> {
  const { data, error } = await supabaseAdmin
    .from("domains")
    .select("*")
    .eq("domain", domainName)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function updateDomainStatus(
  domainId: string,
  status: Domain["status"]
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("domains")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", domainId);

  if (error) {
    throw new Error(`Failed to update domain status: ${error.message}`);
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
    await supabaseAdmin.from("api_keys").delete().eq("domain_id", domainId);

    // Delete domain record
    const { error } = await supabaseAdmin
      .from("domains")
      .delete()
      .eq("id", domainId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to delete domain: ${error.message}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to delete domain: ${error.message}`);
  }
}

export async function refreshAllDomainStatuses(): Promise<void> {
  const { data: domains, error } = await supabaseAdmin
    .from("domains")
    .select("id, domain, status")
    .eq("status", "pending");

  if (error || !domains) {
    console.error("Failed to fetch pending domains:", error);
    return;
  }

  for (const domain of domains) {
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
