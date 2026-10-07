import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const preload = pathToFileURL(path.join(path.dirname(fileURLToPath(import.meta.url)), "network-guard-preload.mjs")).href;

/**
 * Env additions that make a spawned service refuse non-loopback fetches and
 * redirect selected origins to in-test fake servers.
 *
 * @param {Record<string, string>} rewrites map of real origin -> fake server base URL
 */
export function networkGuardEnv(rewrites = {}) {
  const existing = process.env.NODE_OPTIONS ? `${process.env.NODE_OPTIONS} ` : "";
  return {
    E2E_FETCH_REWRITES: JSON.stringify(rewrites),
    NODE_OPTIONS: `${existing}--import=${preload}`
  };
}

export const BLOCKED_MARKER = "E2E_NETWORK_GUARD_BLOCKED";
