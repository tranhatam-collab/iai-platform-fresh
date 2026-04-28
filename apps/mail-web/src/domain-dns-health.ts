import type {
  MailDomainCheckStatus,
  MailDomainDnsHealthRecord,
  MailDomainDnsHealthSource,
  MailDomainVerificationStatus
} from "@iai/mail-core";

type DomainDnsCheckKey = "spf" | "dkim" | "dmarc" | "mx" | "rdns";

export interface DomainDnsCheckModel {
  blocking: boolean;
  key: DomainDnsCheckKey;
  status: MailDomainCheckStatus;
}

export interface DomainDnsHealthPageModel {
  checks: DomainDnsCheckModel[];
  generatedAt: string;
  issues: string[];
  summary: {
    canSendMarketingVolume: boolean;
    checkedAt: string;
    domain: string;
    domainId: string;
    failureCount: number;
    operatorAttentionRequired: boolean;
    overallStatus: MailDomainCheckStatus;
    readiness: "ready" | "attention" | "blocked";
    verificationStatus: MailDomainVerificationStatus;
    warningCount: number;
  };
}

export function buildDomainDnsHealthPage(
  record: MailDomainDnsHealthRecord,
  now = new Date().toISOString()
): DomainDnsHealthPageModel {
  const checks: DomainDnsCheckModel[] = [
    buildCheckModel("spf", record.spf),
    buildCheckModel("dkim", record.dkim),
    buildCheckModel("dmarc", record.dmarc),
    buildCheckModel("mx", record.mx),
    buildCheckModel("rdns", record.rdns)
  ];
  const failureCount = checks.filter((item) => item.status === "fail").length;
  const warningCount = checks.filter((item) => item.status === "warn").length;
  const issues = checks
    .filter((item) => item.status !== "pass")
    .map((item) => `${item.key}:${item.status}`);

  return {
    checks,
    generatedAt: now,
    issues,
    summary: {
      canSendMarketingVolume:
        record.verificationStatus === "verified" &&
        record.spf === "pass" &&
        record.dkim === "pass" &&
        record.dmarc === "pass",
      checkedAt: record.checkedAt,
      domain: record.domain,
      domainId: record.domainId,
      failureCount,
      operatorAttentionRequired:
        failureCount > 0 || warningCount > 0 || record.verificationStatus !== "verified",
      overallStatus: record.overallStatus,
      readiness: resolveReadiness(record, failureCount, warningCount),
      verificationStatus: record.verificationStatus,
      warningCount
    }
  };
}

export function buildDomainDnsHealthPageFromSource(
  source: MailDomainDnsHealthSource,
  domainId: string,
  workspaceId?: string,
  now?: string
): DomainDnsHealthPageModel | undefined {
  const record = source.getDomainDnsHealth(domainId, workspaceId);
  if (!record) {
    return undefined;
  }

  return buildDomainDnsHealthPage(record, now);
}

function buildCheckModel(
  key: DomainDnsCheckKey,
  status: MailDomainCheckStatus
): DomainDnsCheckModel {
  return {
    blocking: status === "fail",
    key,
    status
  };
}

function resolveReadiness(
  record: MailDomainDnsHealthRecord,
  failureCount: number,
  warningCount: number
): "ready" | "attention" | "blocked" {
  if (failureCount > 0 || record.overallStatus === "fail") {
    return "blocked";
  }

  if (warningCount > 0 || record.verificationStatus !== "verified") {
    return "attention";
  }

  return "ready";
}
