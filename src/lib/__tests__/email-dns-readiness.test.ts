import {
  analyzeEmailDnsRecords,
  normalizeDkimSelector,
  normalizeDomain,
} from "../email-dns-readiness";

describe("email DNS readiness", () => {
  it("normalizes domains from URLs and email-style input", () => {
    expect(normalizeDomain("https://Example.COM/path")).toBe("example.com");
    expect(normalizeDomain("@mail.example.com.")).toBe("mail.example.com");
  });

  it("rejects invalid domains and selectors", () => {
    expect(() => normalizeDomain("localhost")).toThrow("public domain");
    expect(() => normalizeDomain("bad_domain.com")).toThrow("letters");
    expect(() => normalizeDkimSelector("selector._domainkey")).toThrow("single DKIM selector");
  });

  it("flags blocking DNS launch risks", () => {
    const assessment = analyzeEmailDnsRecords({
      domain: "example.com",
      dkimSelector: "selector1",
      spfRecords: ["v=spf1 include:amazonses.com ~all", "v=spf1 include:_spf.example.com ~all"],
      dmarcRecords: [],
      dkimTxtRecords: [],
      dkimCnameRecords: [],
      mxRecords: [],
    });

    expect(assessment.overallStatus).toBe("fail");
    expect(assessment.checks.find((check) => check.id === "spf")?.summary).toMatch(/Multiple SPF/);
    expect(assessment.checks.find((check) => check.id === "dmarc")?.status).toBe("fail");
    expect(assessment.checks.find((check) => check.id === "dkim")?.status).toBe("fail");
  });

  it("passes a domain with aligned public records", () => {
    const assessment = analyzeEmailDnsRecords({
      domain: "example.com",
      dkimSelector: "abc123",
      spfRecords: ["v=spf1 include:amazonses.com ~all"],
      dmarcRecords: ["v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com"],
      dkimTxtRecords: [],
      dkimCnameRecords: ["abc123.dkim.amazonses.com"],
      mxRecords: ["10 inbound.example.com"],
    });

    expect(assessment.overallStatus).toBe("pass");
    expect(assessment.checks.every((check) => check.status === "pass")).toBe(true);
  });
});
