export type EmailDnsStatus = "pass" | "warn" | "fail" | "info";

export type EmailDnsCheck = {
  id: "spf" | "dmarc" | "dkim" | "mx";
  title: string;
  status: EmailDnsStatus;
  summary: string;
  details: string[];
  records: string[];
};

export type EmailDnsAssessment = {
  domain: string;
  dkimSelector: string | null;
  overallStatus: EmailDnsStatus;
  summary: string;
  checks: EmailDnsCheck[];
  lookupErrors: string[];
};

export type EmailDnsRecords = {
  domain: string;
  dkimSelector?: string | null;
  spfRecords: string[];
  dmarcRecords: string[];
  dkimTxtRecords: string[];
  dkimCnameRecords: string[];
  mxRecords: string[];
  lookupErrors?: string[];
};

const statusRank: Record<EmailDnsStatus, number> = {
  pass: 0,
  info: 1,
  warn: 2,
  fail: 3,
};

function isValidDomainLabel(label: string): boolean {
  return (
    label.length > 0 &&
    label.length <= 63 &&
    !label.startsWith("-") &&
    !label.endsWith("-") &&
    /^[a-z0-9-]+$/.test(label)
  );
}

export function normalizeDomain(input: string): string {
  const stripped = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^mailto:/, "")
    .split(/[/?#]/)[0]
    .replace(/^@/, "")
    .replace(/\.$/, "");
  const withoutPort = stripped.includes(":") ? stripped.split(":")[0] : stripped;
  const labels = withoutPort.split(".");

  if (withoutPort.length < 4 || withoutPort.length > 253 || labels.length < 2) {
    throw new Error("Enter a public domain such as example.com.");
  }

  if (!labels.every(isValidDomainLabel)) {
    throw new Error("Use only letters, numbers, hyphens, and dots in the domain.");
  }

  return withoutPort;
}

export function normalizeDkimSelector(input?: string | null): string | null {
  if (!input) return null;
  const selector = input.trim().toLowerCase().replace(/\.$/, "");
  if (!selector) return null;

  if (!isValidDomainLabel(selector)) {
    throw new Error("Use a single DKIM selector label, such as selector1 or abc123.");
  }

  return selector;
}

function makeCheck(
  id: EmailDnsCheck["id"],
  title: string,
  status: EmailDnsStatus,
  summary: string,
  details: string[],
  records: string[],
): EmailDnsCheck {
  return { id, title, status, summary, details, records };
}

export function analyzeEmailDnsRecords(records: EmailDnsRecords): EmailDnsAssessment {
  const spfRecords = records.spfRecords.filter((record) => /^v=spf1\b/i.test(record));
  const dmarcRecords = records.dmarcRecords.filter((record) => /^v=dmarc1\b/i.test(record));
  const hasDkim =
    records.dkimTxtRecords.some((record) => /v=dkim1|p=/i.test(record)) ||
    records.dkimCnameRecords.some((record) => /dkim|amazonses/i.test(record));

  const checks: EmailDnsCheck[] = [];

  if (spfRecords.length === 0) {
    checks.push(
      makeCheck("spf", "SPF", "warn", "No SPF record was found on the sending domain.", [
        "SPF is not always enough for DMARC alignment, but it helps receivers evaluate allowed senders.",
        "For Amazon SES custom MAIL FROM setups, confirm the required SPF value from your SES console.",
      ], records.spfRecords),
    );
  } else if (spfRecords.length > 1) {
    checks.push(
      makeCheck("spf", "SPF", "fail", "Multiple SPF records were found.", [
        "Receivers expect one SPF record. Merge the mechanisms into a single v=spf1 record before launch.",
      ], spfRecords),
    );
  } else {
    const includesSes = /amazonses\.com|amazonses/i.test(spfRecords[0]);
    checks.push(
      makeCheck("spf", "SPF", includesSes ? "pass" : "info", includesSes ? "SPF is present and mentions Amazon SES." : "SPF is present.", [
        includesSes
          ? "Confirm the sender domain and MAIL FROM domain match the SES setup you plan to use."
          : "If SES provides a MAIL FROM SPF value for this domain, add it before production sending.",
      ], spfRecords),
    );
  }

  if (dmarcRecords.length === 0) {
    checks.push(
      makeCheck("dmarc", "DMARC", "fail", "No DMARC policy was found at _dmarc.", [
        "Add a DMARC record before production so receivers know how to handle failed authentication.",
      ], records.dmarcRecords),
    );
  } else if (dmarcRecords.length > 1) {
    checks.push(
      makeCheck("dmarc", "DMARC", "fail", "Multiple DMARC records were found.", [
        "Receivers expect one DMARC record. Keep a single v=DMARC1 policy at _dmarc.",
      ], dmarcRecords),
    );
  } else {
    const policy = dmarcRecords[0].match(/;\s*p=([^;\s]+)/i)?.[1]?.toLowerCase();
    checks.push(
      makeCheck("dmarc", "DMARC", policy === "none" ? "warn" : "pass", policy === "none" ? "DMARC exists but is monitor-only." : "DMARC policy is present.", [
        policy === "none"
          ? "p=none is fine for rollout monitoring, but plan a move to quarantine or reject after mail flow is stable."
          : `Current policy is p=${policy ?? "unspecified"}. Confirm this matches your rollout risk tolerance.`,
      ], dmarcRecords),
    );
  }

  if (!records.dkimSelector) {
    checks.push(
      makeCheck("dkim", "DKIM", "info", "No DKIM selector was checked.", [
        "Enter one SES DKIM selector to verify the selector._domainkey record before sending production email.",
      ], []),
    );
  } else if (hasDkim) {
    checks.push(
      makeCheck("dkim", "DKIM", "pass", `DKIM material was found for selector ${records.dkimSelector}.`, [
        "Confirm this selector is one of the active DKIM tokens shown in Amazon SES for the sending identity.",
      ], [...records.dkimTxtRecords, ...records.dkimCnameRecords]),
    );
  } else {
    checks.push(
      makeCheck("dkim", "DKIM", "fail", `No DKIM TXT or CNAME record was found for selector ${records.dkimSelector}.`, [
        `Check ${records.dkimSelector}._domainkey.${records.domain} against the SES DKIM records before launch.`,
      ], []),
    );
  }

  if (records.mxRecords.length === 0) {
    checks.push(
      makeCheck("mx", "MX", "warn", "No MX records were found.", [
        "Outbound sending can still work, but missing MX records can break replies, bounces, and some domain checks.",
      ], []),
    );
  } else {
    checks.push(
      makeCheck("mx", "MX", "pass", "MX records are present.", [
        "Confirm reply and bounce handling match the mailbox or SES receiving path you intend to use.",
      ], records.mxRecords),
    );
  }

  const overallStatus = checks.reduce<EmailDnsStatus>(
    (worst, check) => (statusRank[check.status] > statusRank[worst] ? check.status : worst),
    "pass",
  );

  const summary =
    overallStatus === "fail"
      ? "Fix the failed checks before sending production traffic."
      : overallStatus === "warn"
        ? "The domain is close, but warning items should be reviewed before launch."
        : "No blocking DNS issues were detected by this quick check.";

  return {
    domain: records.domain,
    dkimSelector: records.dkimSelector ?? null,
    overallStatus,
    summary,
    checks,
    lookupErrors: records.lookupErrors ?? [],
  };
}
