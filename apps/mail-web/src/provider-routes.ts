import type {
  MailProviderRouteFilter,
  MailProviderRouteHealthStatus,
  MailProviderRouteRecord,
  MailProviderRouteSource,
  MailProviderRouteStatus,
  MailProviderType
} from "@iai/mail-core";

export interface ProviderRouteListItem {
  failoverTarget?: string;
  healthScore: number;
  healthStatus: MailProviderRouteHealthStatus;
  lastCheckedAt: string;
  priority: number;
  provider: MailProviderType;
  routeId: string;
  routeName: string;
  status: MailProviderRouteStatus;
  stream: string;
}

export interface ProviderRoutesPageModel {
  byHealth: Record<MailProviderRouteHealthStatus, number>;
  byProvider: Record<string, number>;
  byStatus: Record<MailProviderRouteStatus, number>;
  degradedCount: number;
  generatedAt: string;
  items: ProviderRouteListItem[];
  total: number;
}

export function buildProviderRoutesPage(
  routes: MailProviderRouteRecord[],
  now = new Date().toISOString()
): ProviderRoutesPageModel {
  const sortedRoutes = [...routes].sort(compareProviderRoutesForPage);
  const byHealth: Record<MailProviderRouteHealthStatus, number> = {
    degraded: 0,
    down: 0,
    healthy: 0
  };
  const byStatus: Record<MailProviderRouteStatus, number> = {
    active: 0,
    degraded: 0,
    disabled: 0
  };
  const byProvider: Record<string, number> = {};

  for (const item of sortedRoutes) {
    byHealth[item.healthStatus] += 1;
    byStatus[item.status] += 1;
    byProvider[item.provider] = (byProvider[item.provider] ?? 0) + 1;
  }

  return {
    byHealth,
    byProvider,
    byStatus,
    degradedCount: sortedRoutes.filter(
      (item) => item.status === "degraded" || item.healthStatus !== "healthy"
    ).length,
    generatedAt: now,
    items: sortedRoutes.map((item) => buildProviderRouteListItem(item)),
    total: sortedRoutes.length
  };
}

export function buildProviderRoutesPageFromSource(
  source: MailProviderRouteSource,
  filter: MailProviderRouteFilter = {},
  now?: string
): ProviderRoutesPageModel {
  return buildProviderRoutesPage(source.listRoutes(filter), now);
}

function buildProviderRouteListItem(route: MailProviderRouteRecord): ProviderRouteListItem {
  return {
    failoverTarget: route.failoverTo,
    healthScore: route.healthScore,
    healthStatus: route.healthStatus,
    lastCheckedAt: route.lastCheckedAt,
    priority: route.priority,
    provider: route.provider,
    routeId: route.routeId,
    routeName: route.routeName,
    status: route.status,
    stream: route.stream
  };
}

function compareProviderRoutesForPage(
  left: MailProviderRouteRecord,
  right: MailProviderRouteRecord
): number {
  const leftStatusRank = getRouteStatusRank(left.status);
  const rightStatusRank = getRouteStatusRank(right.status);
  if (leftStatusRank !== rightStatusRank) {
    return leftStatusRank - rightStatusRank;
  }

  const leftHealthRank = getRouteHealthRank(left.healthStatus);
  const rightHealthRank = getRouteHealthRank(right.healthStatus);
  if (leftHealthRank !== rightHealthRank) {
    return leftHealthRank - rightHealthRank;
  }

  if (left.priority !== right.priority) {
    return left.priority - right.priority;
  }

  return left.routeId.localeCompare(right.routeId);
}

function getRouteStatusRank(status: MailProviderRouteStatus): number {
  if (status === "active") {
    return 0;
  }

  if (status === "degraded") {
    return 1;
  }

  return 2;
}

function getRouteHealthRank(status: MailProviderRouteHealthStatus): number {
  if (status === "healthy") {
    return 0;
  }

  if (status === "degraded") {
    return 1;
  }

  return 2;
}
