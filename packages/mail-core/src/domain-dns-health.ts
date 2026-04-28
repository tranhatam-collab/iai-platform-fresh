export type MailDomainCheckStatus = "pass" | "warn" | "fail";
export type MailDomainVerificationStatus = "verified" | "pending" | "failed";

export interface MailDomainDnsHealthRecord {
  checkedAt: string;
  dkim: MailDomainCheckStatus;
  dmarc: MailDomainCheckStatus;
  domain: string;
  domainId: string;
  mx: MailDomainCheckStatus;
  overallStatus: MailDomainCheckStatus;
  rdns: MailDomainCheckStatus;
  spf: MailDomainCheckStatus;
  verificationStatus: MailDomainVerificationStatus;
  workspaceId: string;
}

export interface MailDomainDnsHealthSourceSnapshot {
  generatedAt: string;
  items: MailDomainDnsHealthRecord[];
  version: "mail_domain_dns_health_sot_v1";
}

export interface MailDomainDnsHealthSource {
  getDomainDnsHealth(domainId: string, workspaceId?: string): MailDomainDnsHealthRecord | undefined;
  listDomainDnsHealth(workspaceId?: string): MailDomainDnsHealthRecord[];
  snapshot(workspaceId?: string): MailDomainDnsHealthSourceSnapshot;
}

export function createMailDomainDnsHealthSource(
  seed?: Partial<MailDomainDnsHealthSourceSnapshot>
): MailDomainDnsHealthSource {
  const baseline = createMergedSnapshot(seed);

  return {
    getDomainDnsHealth(domainId, workspaceId) {
      return baseline.items.find((item) => {
        if (item.domainId !== domainId) {
          return false;
        }

        if (workspaceId && item.workspaceId !== workspaceId) {
          return false;
        }

        return true;
      });
    },
    listDomainDnsHealth(workspaceId) {
      return [...filterByWorkspace(baseline.items, workspaceId)].sort((left, right) =>
        left.domain.localeCompare(right.domain)
      );
    },
    snapshot(workspaceId) {
      if (!workspaceId) {
        return baseline;
      }

      return {
        generatedAt: baseline.generatedAt,
        items: filterByWorkspace(baseline.items, workspaceId),
        version: baseline.version
      };
    }
  };
}

function createMergedSnapshot(
  seed?: Partial<MailDomainDnsHealthSourceSnapshot>
): MailDomainDnsHealthSourceSnapshot {
  const defaults = createDefaultSnapshot();

  return {
    generatedAt: seed?.generatedAt ?? defaults.generatedAt,
    items: seed?.items ?? defaults.items,
    version: "mail_domain_dns_health_sot_v1"
  };
}

function createDefaultSnapshot(): MailDomainDnsHealthSourceSnapshot {
  return {
    generatedAt: "2026-04-14T10:25:00.000Z",
    items: [
      {
        checkedAt: "2026-04-14T10:20:00.000Z",
        dkim: "pass",
        dmarc: "pass",
        domain: "mail.iai.one",
        domainId: "dom_mail_main_001",
        mx: "pass",
        overallStatus: "pass",
        rdns: "pass",
        spf: "pass",
        verificationStatus: "verified",
        workspaceId: "ws_mail_main"
      },
      {
        checkedAt: "2026-04-14T10:21:00.000Z",
        dkim: "warn",
        dmarc: "fail",
        domain: "updates.iai.one",
        domainId: "dom_updates_main_001",
        mx: "pass",
        overallStatus: "fail",
        rdns: "warn",
        spf: "pass",
        verificationStatus: "verified",
        workspaceId: "ws_mail_main"
      }
    ],
    version: "mail_domain_dns_health_sot_v1"
  };
}

function filterByWorkspace(
  items: MailDomainDnsHealthRecord[],
  workspaceId?: string
): MailDomainDnsHealthRecord[] {
  if (!workspaceId) {
    return items;
  }

  return items.filter((item) => item.workspaceId === workspaceId);
}
