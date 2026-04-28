import type { MailProviderType } from "./mail-messages.js";

export type MailProviderRouteStatus = "active" | "degraded" | "disabled";
export type MailProviderRouteHealthStatus = "healthy" | "degraded" | "down";

export interface MailProviderRouteRecord {
  configRef: string;
  failoverTo?: string;
  healthScore: number;
  healthStatus: MailProviderRouteHealthStatus;
  lastCheckedAt: string;
  priority: number;
  provider: MailProviderType;
  routeId: string;
  routeName: string;
  status: MailProviderRouteStatus;
  stream: string;
  workspaceId: string;
}

export interface MailProviderRouteFilter {
  healthStatuses?: MailProviderRouteHealthStatus[];
  provider?: MailProviderType;
  statuses?: MailProviderRouteStatus[];
  stream?: string;
  workspaceId?: string;
}

export interface MailProviderRouteSourceSnapshot {
  generatedAt: string;
  routes: MailProviderRouteRecord[];
  version: "mail_provider_routes_sot_v1";
}

export interface MailProviderRouteSource {
  listRoutes(filter?: MailProviderRouteFilter): MailProviderRouteRecord[];
  snapshot(workspaceId?: string): MailProviderRouteSourceSnapshot;
}

export function createMailProviderRouteSource(
  seed?: Partial<MailProviderRouteSourceSnapshot>
): MailProviderRouteSource {
  const baseline = createMergedSnapshot(seed);

  return {
    listRoutes(filter = {}) {
      return baseline.routes
        .filter((item) => {
          if (filter.workspaceId && item.workspaceId !== filter.workspaceId) {
            return false;
          }

          if (filter.stream && item.stream !== filter.stream) {
            return false;
          }

          if (filter.provider && item.provider !== filter.provider) {
            return false;
          }

          if (filter.statuses && filter.statuses.length > 0 && !filter.statuses.includes(item.status)) {
            return false;
          }

          if (
            filter.healthStatuses &&
            filter.healthStatuses.length > 0 &&
            !filter.healthStatuses.includes(item.healthStatus)
          ) {
            return false;
          }

          return true;
        })
        .sort((left, right) => {
          if (left.priority !== right.priority) {
            return left.priority - right.priority;
          }

          return left.routeId.localeCompare(right.routeId);
        });
    },
    snapshot(workspaceId) {
      if (!workspaceId) {
        return baseline;
      }

      return {
        generatedAt: baseline.generatedAt,
        routes: baseline.routes.filter((item) => item.workspaceId === workspaceId),
        version: baseline.version
      };
    }
  };
}

function createMergedSnapshot(
  seed?: Partial<MailProviderRouteSourceSnapshot>
): MailProviderRouteSourceSnapshot {
  const defaults = createDefaultSnapshot();

  return {
    generatedAt: seed?.generatedAt ?? defaults.generatedAt,
    routes: seed?.routes ?? defaults.routes,
    version: "mail_provider_routes_sot_v1"
  };
}

function createDefaultSnapshot(): MailProviderRouteSourceSnapshot {
  return {
    generatedAt: "2026-04-14T10:15:00.000Z",
    routes: [
      {
        configRef: "providercfg_sendgrid_tx_primary",
        failoverTo: "transactional_backup",
        healthScore: 98,
        healthStatus: "healthy",
        lastCheckedAt: "2026-04-14T10:14:00.000Z",
        priority: 1,
        provider: "sendgrid",
        routeId: "transactional_primary",
        routeName: "Transactional Primary",
        status: "active",
        stream: "transactional",
        workspaceId: "ws_mail_main"
      },
      {
        configRef: "providercfg_ses_tx_backup",
        healthScore: 91,
        healthStatus: "healthy",
        lastCheckedAt: "2026-04-14T10:14:00.000Z",
        priority: 2,
        provider: "ses",
        routeId: "transactional_backup",
        routeName: "Transactional Backup",
        status: "active",
        stream: "transactional",
        workspaceId: "ws_mail_main"
      },
      {
        configRef: "providercfg_smtp_marketing",
        failoverTo: "marketing_backup",
        healthScore: 62,
        healthStatus: "degraded",
        lastCheckedAt: "2026-04-14T10:14:00.000Z",
        priority: 1,
        provider: "smtp",
        routeId: "marketing_primary",
        routeName: "Marketing Primary",
        status: "degraded",
        stream: "marketing",
        workspaceId: "ws_mail_main"
      }
    ],
    version: "mail_provider_routes_sot_v1"
  };
}
