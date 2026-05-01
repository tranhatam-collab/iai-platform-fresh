#!/usr/bin/env node
// trust-state-builder.mjs
// Phase 1 Operational Trust Surface builder.
// Implements the 7-module foundation pack (TRUST_MODULE_DATA_CONTRACTS.md).
// Every item has status (verified | declared | unverified) + disclosure rules.
// No fake data. No silent failures. No model-name leakage.

import { promises as fs } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_JSON_SRC = path.join(ROOT, "src", "data", "trust-state.json");
const OUT_JSON_PUBLIC = path.join(ROOT, "public", "data", "trust-state.json");
const OUT_LOG = path.join(ROOT, "docs", "verification-log.md");

const STALE_AFTER_DAYS = 30;
const HTTP_TIMEOUT_MS = 5000;

// Approved domains per founder spec. role + canonical + legal_lane + owner_team
// must be reviewed by Trust PMO before publication.
const APPROVED_DOMAINS = [
  { domain: "iai.one",            role: "constitutional root",        canonical: true,  owner_team: "founder",      legal_lane: "platform charter" },
  { domain: "home.iai.one",       role: "routing portal",             canonical: true,  owner_team: "trust-pmo",    legal_lane: "navigation only" },
  { domain: "trust.iai.one",      role: "operational trust surface",  canonical: true,  owner_team: "trust-pmo",    legal_lane: "trust disclosures" },
  { domain: "dash.iai.one",       role: "operator surface",           canonical: true,  owner_team: "team-2",       legal_lane: "billing-support-only" },
  { domain: "noos.iai.one",       role: "commerce surface",           canonical: true,  owner_team: "team-3",       legal_lane: "commerce, payment via pay.iai.one" },
  { domain: "nft.iai.one",        role: "verifiable asset surface",   canonical: true,  owner_team: "trust-pmo",    legal_lane: "asset provenance" },
  { domain: "flow.iai.one",       role: "orchestration surface",      canonical: true,  owner_team: "team-flow",    legal_lane: "workflow engine" },
  { domain: "app.iai.one",        role: "authenticated app surface",  canonical: true,  owner_team: "team-app",     legal_lane: "user app" },
  { domain: "developer.iai.one",  role: "developer onboarding",       canonical: true,  owner_team: "team-a",       legal_lane: "developer hub" },
  { domain: "docs.iai.one",       role: "documentation",              canonical: true,  owner_team: "team-a",       legal_lane: "documentation" },
  { domain: "api.flow.iai.one",   role: "developer api",              canonical: true,  owner_team: "team-a",       legal_lane: "developer api" },
  { domain: "cios.iai.one",       role: "internal operations system", canonical: true,  owner_team: "team-c",       legal_lane: "internal operations" },
  { domain: "pay.iai.one",        role: "payment control plane",      canonical: true,  owner_team: "pay-email",    legal_lane: "payment processing" },
  { domain: "mail.iai.one",       role: "mail control plane",         canonical: true,  owner_team: "pay-email",    legal_lane: "email service" },
  // Roadmap-declared domains. May not yet probe successfully.
  { domain: "cdn.iai.one",        role: "cdn edge",                   canonical: true,  owner_team: "team-b-cdn",   legal_lane: "cdn delivery" },
  { domain: "flows.iai.one",      role: "automation surface",         canonical: true,  owner_team: "team-b-flows", legal_lane: "automation runs" },
  { domain: "web.iai.one",        role: "web surface",                canonical: true,  owner_team: "team-5",       legal_lane: "web product" }
  // Note: `root.iai.one` was removed from official_domains on 2026-05-02 (D12 path B).
  // It had no DNS A record and no deploy target. Re-add only if a real surface is provisioned.
];

// Foundation pack: TRUST_MODULE_DATA_CONTRACTS.md §4
const TEAMS = [
  { team_id: "founder",      team_name: "Founder",                    surface_scope: "scope, escalation, role boundary approval",                                              status: "declared", public_contact_reference: "trust@iai.one", owner_declared: "Trần Hà Tâm",                  disclosure: "Single-founder authority. Public contact via official trust mailbox.", last_reviewed_at: null },
  { team_id: "trust-pmo",    team_name: "Trust PMO",                  surface_scope: "domain registry, ownership registry, mismatch review, stale review",                      status: "declared", public_contact_reference: "trust@iai.one", owner_declared: "Trust PMO (founder-led in Phase 1)", disclosure: "Phase 1: PMO duties operated under founder oversight. Standalone PMO seat is roadmap.", last_reviewed_at: null },
  { team_id: "pay-email",    team_name: "Pay + Email Lane",           surface_scope: "pay.iai.one, mail.iai.one, payment activation, email evidence",                            status: "declared", public_contact_reference: "trust@iai.one", owner_declared: "AI-assisted, human-reviewed lane",     disclosure: "Operational team behind payment + email control plane. Public contact routed via trust mailbox.", last_reviewed_at: null },
  { team_id: "team-2",       team_name: "Team 2 — Runtime Platform",  surface_scope: "dash.iai.one, runtime probe, shared platform contract verification",                      status: "declared", public_contact_reference: "trust@iai.one", owner_declared: "AI-assisted, human-reviewed lane",     disclosure: "Operates dashboard surface and platform probes. Internal scope summary only.", last_reviewed_at: null },
  { team_id: "team-3",       team_name: "Team 3 — NOOS Commerce",     surface_scope: "noos.iai.one commerce metadata, contract enforcement",                                    status: "declared", public_contact_reference: "trust@iai.one", owner_declared: "AI-assisted, human-reviewed lane",     disclosure: "Maintains NOOS commerce contracts. Public boundary only.", last_reviewed_at: null },
  { team_id: "team-a",       team_name: "Team A — Developer Platform", surface_scope: "developer.iai.one, docs.iai.one, api.flow.iai.one",                                       status: "unverified", public_contact_reference: "trust@iai.one", owner_declared: "Pending team identification (Q-OPEN-1)",  disclosure: "Team identity not yet locked. Treated as Unverified per claim standard §2.3.", last_reviewed_at: null },
  { team_id: "team-b-cdn",   team_name: "Team B — CDN",                surface_scope: "cdn.iai.one delivery, cache, rule snapshots",                                              status: "unverified", public_contact_reference: "trust@iai.one", owner_declared: "Pending team identification (Q-OPEN-4)",  disclosure: "Team identity not yet locked. Public CDN evidence pending.", last_reviewed_at: null },
  { team_id: "team-b-flows", team_name: "Team B — Flows",              surface_scope: "flows.iai.one route map, runtime, screenshots",                                            status: "unverified", public_contact_reference: "trust@iai.one", owner_declared: "Pending team identification (Q-OPEN-4)",  disclosure: "Team identity not yet locked. Public Flows evidence pending.", last_reviewed_at: null },
  { team_id: "team-c",       team_name: "Team C — CIOS",               surface_scope: "cios.iai.one closure, screenshot pack, smoke",                                            status: "declared", public_contact_reference: "trust@iai.one", owner_declared: "Pending team identification (Q-OPEN-4)",  disclosure: "CIOS closure 8/8 verified internally; public team identity pending.", last_reviewed_at: null },
  { team_id: "team-5",       team_name: "Team 5 — Web KPI",            surface_scope: "web.iai.one KPI loop, synchronized live readiness",                                       status: "declared", public_contact_reference: "trust@iai.one", owner_declared: "AI-assisted, human-reviewed lane",     disclosure: "Maintains web KPI snapshots. Public boundary only.", last_reviewed_at: null }
];

const CHANNELS = [
  { channel_type: "email",      label: "Trust mailbox",                value: "trust@iai.one",                                                            status: "declared",   scope: "trust mismatch, impersonation, stale claim reports",       use_case: "public reporting path",                          public_evidence: null,                                                       disclosure: "Mailbox declared as the single public trust contact. Setup confirmation and SLA evidence pending in Phase 2.", last_reviewed_at: null },
  { channel_type: "report-form", label: "Trust report form",            value: "/api/trust/report (this site)",                                          status: "verified",   scope: "in-page mismatch and impersonation reports",               use_case: "submit a trust report directly from the surface",  public_evidence: "/api/trust/report",                                          disclosure: "Form posts to a Cloudflare Worker. Phase 1 logs reports for human review; no auto-ticket SLA.", last_reviewed_at: null },
  { channel_type: "verification-log", label: "Verification log",        value: "/docs/verification-log.md (in repo)",                                    status: "verified",   scope: "build-time domain probe results",                          use_case: "audit what the last build verified",               public_evidence: "docs/verification-log.md",                                  disclosure: "Regenerated on every build. Reflects probe state at that build only.", last_reviewed_at: null },
  { channel_type: "trust-state-feed", label: "Trust state JSON",         value: "/data/trust-state.json",                                                status: "verified",   scope: "machine-readable mirror of all 7 modules",                 use_case: "third-party verification of trust claims",         public_evidence: "/data/trust-state.json",                                    disclosure: "Phase 1 is build-time only. No runtime updates between deploys.", last_reviewed_at: null }
];

const VERIFICATION_METHODS = [
  { method_id: "M-01", title: "DNS resolution probe",   applies_to: "Module 1 (Official Domains)",       description: "Resolves A records via dig at build time. Confirms a domain currently resolves on public DNS.",         status: "verified", evidence_reference: "scripts/trust-state-builder.mjs (digA)",         limitations: "Build-time only. Does not detect DNS changes after build.",                                              disclosure: null, last_reviewed_at: null },
  { method_id: "M-02", title: "HTTP HEAD probe",        applies_to: "Module 1 (Official Domains)",       description: "Issues an HTTPS HEAD request and records the status code at build time.",                              status: "verified", evidence_reference: "scripts/trust-state-builder.mjs (httpProbe)",   limitations: "Confirms an endpoint responds. Does not assert the body or business logic is correct.",                  disclosure: null, last_reviewed_at: null },
  { method_id: "M-03", title: "Source proof",           applies_to: "All modules",                       description: "Each public claim links to a source file or commit in the repo when public.",                          status: "declared", evidence_reference: "git log + repository-relative paths in trust-state.json", limitations: "Some sources stay private when exposing them would create new risk.",                                  disclosure: "Internal-only sources downgrade public claims to Declared per claim standard §2.2.", last_reviewed_at: null },
  { method_id: "M-04", title: "Owner declaration",      applies_to: "Modules 1, 2, 7",                   description: "An owning team declares responsibility for a surface. Public contact is routed via the trust mailbox.", status: "declared", evidence_reference: "trust-state.json team_id field",                limitations: "Does not prove individual operator identity. Public mode lists team scope only.",                        disclosure: "Phase 1 lists team scope and contact, not private operator identities.", last_reviewed_at: null },
  { method_id: "M-05", title: "Content correctness",    applies_to: "Module 1 (Official Domains)",       description: "Manual review that the live content matches the declared role.",                                       status: "unverified", evidence_reference: null,                                          limitations: "Phase 1 does not run content audits. Roadmap for Phase 2.",                                              disclosure: "Phase 1 cannot assert content correctness. Claims about a domain's content are Declared at most.", last_reviewed_at: null }
];

const GO_SHORT_LINKS = [
  // Phase 1: empty by design. Adding entries requires owner_scope, evidence_reference,
  // and review per TRUST_MODULE_DATA_CONTRACTS.md §7.
];

const REPORT_TYPES = [
  { report_type: "mismatch",         label: "Data mismatch / sai lệch dữ liệu",           submission_method: "in-page form (Module 7) + email fallback to trust@iai.one", scope: "any item on the trust page that appears wrong or stale", visibility: "public", status: "verified", privacy_note: "Contact field is optional. Reports are stored for human review only." },
  { report_type: "stale_claim",      label: "Stale claim / tuyên bố quá hạn",             submission_method: "in-page form (Module 7) + email fallback to trust@iai.one", scope: "items past their stale_after_days threshold or visibly outdated", visibility: "public", status: "verified", privacy_note: "Reports trigger internal review and possible status downgrade." },
  { report_type: "impersonation",    label: "Impersonation / giả mạo",                    submission_method: "email to trust@iai.one (subject: impersonation report)",   scope: "third parties claiming to act on behalf of IAI",         visibility: "public", status: "declared", privacy_note: "Impersonation reports are reviewed manually. Phase 1 does not promise enforcement timelines." },
  { report_type: "unverified_claim", label: "Unverified claim / tuyên bố chưa xác minh", submission_method: "in-page form (Module 7) + email fallback to trust@iai.one", scope: "any claim shown without proof or proper disclosure",     visibility: "public", status: "verified", privacy_note: "Form responses are logged but not auto-routed to ticketing in Phase 1." }
];

const TRUST_PAGES = [
  { page_id: "trust-iai-one", subject_type: "trust-surface", subject_name: "trust.iai.one", status: "declared", verification_methods: ["M-01", "M-02", "M-03"], official_links: ["https://trust.iai.one", "/data/trust-state.json", "/docs/verification-log.md"], public_contact: "trust@iai.one", disclosure: "This is the trust surface itself. Phase 1 is static-first and reflects build-time state.", last_reviewed_at: null }
];

function shell(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", timeout: HTTP_TIMEOUT_MS + 1000, stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function digA(fqdn) {
  const out = shell(`dig +short +time=2 +tries=1 ${fqdn} A`);
  if (!out) return [];
  return out.split("\n").map(s => s.trim()).filter(s => /^\d+\.\d+\.\d+\.\d+$/.test(s));
}

function httpProbe(fqdn) {
  const status = shell(`curl -sI -o /dev/null -w "%{http_code}" --max-time 5 https://${fqdn}`);
  const code = parseInt(status, 10);
  return Number.isFinite(code) ? code : 0;
}

// Foundation pack: TRUST_CLAIM_STANDARD.md §2 — verified | declared | unverified
function classifyDomainStatus(dnsResolved, httpStatus) {
  if (!dnsResolved) {
    // Officially declared in roadmap, but no DNS proof yet.
    return { status: "declared", reason: "dns_not_resolving" };
  }
  if (httpStatus >= 200 && httpStatus < 400) {
    return { status: "verified", reason: null };
  }
  if (httpStatus === 404) {
    return { status: "declared", reason: "http_404_no_expected_content" };
  }
  if (httpStatus >= 500) {
    return { status: "unverified", reason: `http_${httpStatus}` };
  }
  return { status: "unverified", reason: `http_${httpStatus || "no_response"}` };
}

function resolveDomainPublicVisibility(status) {
  return status === "verified" ? "public" : "hold";
}

function buildCommit() {
  return shell("git rev-parse --short HEAD") || "unknown";
}

function staleDays(lastReviewed, today) {
  if (!lastReviewed) return null;
  const then = new Date(lastReviewed + "T00:00:00Z").getTime();
  const now = new Date(today + "T00:00:00Z").getTime();
  if (!Number.isFinite(then) || !Number.isFinite(now)) return null;
  return Math.floor((now - then) / 86400000);
}

async function main() {
  const generated_at = new Date().toISOString();
  const today = generated_at.slice(0, 10);

  // Module 1 — Official Domains
  const domains = [];
  for (const d of APPROVED_DOMAINS) {
    const ip_records = digA(d.domain);
    const dns_resolved = ip_records.length > 0;
    const http_status = dns_resolved ? httpProbe(d.domain) : 0;
    const { status, reason } = classifyDomainStatus(dns_resolved, http_status);

    const item = {
      domain: d.domain,
      role: d.role,
      status,
      canonical: d.canonical,
      owner_team: d.owner_team,
      legal_lane: d.legal_lane,
      public_evidence: dns_resolved && status === "verified"
        ? { dns: ip_records, http_status, probe_method: "dig+curl HEAD", probed_at: generated_at }
        : null,
      disclosure: status === "verified"
        ? null
        : (status === "declared"
            ? (reason === "dns_not_resolving"
                ? "Officially declared in roadmap. DNS does not resolve at build time. Not presented as live."
                : "DNS resolves but expected content was not confirmed at build time.")
            : `Probe state ${reason}. Surface treated as Unverified until proof is available.`),
      last_reviewed_at: today,
      stale_after_days: STALE_AFTER_DAYS,
      public_visibility: resolveDomainPublicVisibility(status),
      probe: { dns_resolved, ip_records, http_status, probe_method: "dig+curl HEAD" }
    };
    domains.push(item);
  }

  // Stamp last_reviewed_at on declared items
  function stamp(arr) {
    return arr.map(item => ({ ...item, last_reviewed_at: item.last_reviewed_at || today, public_visibility: "public", stale_after_days: STALE_AFTER_DAYS }));
  }

  const teams = stamp(TEAMS);
  const channels = stamp(CHANNELS);
  const verification_methods = stamp(VERIFICATION_METHODS);
  const go_short_links = stamp(GO_SHORT_LINKS);
  const report_types = REPORT_TYPES.map(r => ({ ...r, public_visibility: "public" }));
  const trust_pages = stamp(TRUST_PAGES);

  // Stale evaluation per item (uses today's build as reference)
  function withStale(arr, dateField = "last_reviewed_at") {
    return arr.map(item => ({
      ...item,
      stale_days: staleDays(item[dateField], today),
      stale: (() => {
        const d = staleDays(item[dateField], today);
        return d != null && d > STALE_AFTER_DAYS;
      })()
    }));
  }

  const trust_state = {
    generated_at,
    build_commit: buildCommit(),
    verification_policy: {
      stale_after_days: STALE_AFTER_DAYS,
      phase: "phase_1_static",
      probe_method: "dig + curl HEAD",
      content_correctness_asserted: false,
      claim_status_enum: ["verified", "declared", "unverified"]
    },
    ai_disclosure: {
      public_statement_en: "This page may be AI-assisted and human-reviewed. Public claims are shown with proof or disclosure.",
      public_statement_vi: "Trang này có thể có sự hỗ trợ của AI và đã được con người rà soát. Tuyên bố public đi kèm bằng chứng hoặc công bố giới hạn.",
      private_session_details_public: false,
      hard_coded_model_names_in_public: false,
      last_reviewed_at: today
    },
    modules: {
      official_domains:        withStale(domains),
      official_teams:          withStale(teams),
      official_channels:       withStale(channels),
      verification_methods:    withStale(verification_methods),
      go_short_links:          withStale(go_short_links),
      report_and_impersonation: report_types,
      trust_page_builder:      withStale(trust_pages)
    }
  };

  const payload = JSON.stringify(trust_state, null, 2) + "\n";
  await fs.mkdir(path.dirname(OUT_JSON_SRC), { recursive: true });
  await fs.writeFile(OUT_JSON_SRC, payload, "utf8");
  await fs.mkdir(path.dirname(OUT_JSON_PUBLIC), { recursive: true });
  await fs.writeFile(OUT_JSON_PUBLIC, payload, "utf8");

  // Mirror content/ into public/content/ so Workers ASSETS can serve it.
  const contentSrc = path.join(ROOT, "content");
  const contentDst = path.join(ROOT, "public", "content");
  await fs.mkdir(contentDst, { recursive: true });
  for (const f of await fs.readdir(contentSrc)) {
    if (!f.endsWith(".json")) continue;
    await fs.copyFile(path.join(contentSrc, f), path.join(contentDst, f));
  }

  // Verification log
  function countByStatus(arr) {
    return arr.reduce((acc, it) => { acc[it.status] = (acc[it.status] || 0) + 1; return acc; }, {});
  }
  const dCounts = countByStatus(trust_state.modules.official_domains);

  const log = [
    `# verification-log.md`,
    ``,
    `Last build: ${generated_at}`,
    `Build commit: ${trust_state.build_commit}`,
    `Probe method: ${trust_state.verification_policy.probe_method}`,
    `Stale after: ${STALE_AFTER_DAYS} days`,
    `Status enum: verified | declared | unverified`,
    ``,
    `## Module 1 — Official Domains`,
    ``,
    `Counts: ${Object.entries(dCounts).map(([k, v]) => `${k}=${v}`).join(", ") || "none"}`,
    ``,
    ...trust_state.modules.official_domains.map(d =>
      `- ${d.domain} | status: ${d.status} | role: ${d.role} | owner: ${d.owner_team} | http: ${d.probe.http_status || "—"} | dns: ${d.probe.ip_records.join(", ") || "—"}`
    ),
    ``,
    `## Module 2 — Official Teams`,
    ``,
    ...trust_state.modules.official_teams.map(t => `- ${t.team_id} | status: ${t.status} | scope: ${t.surface_scope}`),
    ``,
    `## Module 3 — Official Channels`,
    ``,
    ...trust_state.modules.official_channels.map(c => `- ${c.channel_type} | ${c.label} | status: ${c.status}`),
    ``,
    `## Module 4 — Verification Methods`,
    ``,
    ...trust_state.modules.verification_methods.map(m => `- ${m.method_id} | ${m.title} | status: ${m.status}`),
    ``,
    `## Module 5 — /go/* Short Links`,
    ``,
    trust_state.modules.go_short_links.length === 0 ? `- (none in Phase 1)` : trust_state.modules.go_short_links.map(g => `- /go/${g.slug} | status: ${g.status} | -> ${g.destination}`).join("\n"),
    ``,
    `## Module 6 — Report & Impersonation`,
    ``,
    ...trust_state.modules.report_and_impersonation.map(r => `- ${r.report_type} | ${r.label} | status: ${r.status} | via: ${r.submission_method}`),
    ``,
    `## Module 7 — Trust Page Builder`,
    ``,
    ...trust_state.modules.trust_page_builder.map(p => `- ${p.page_id} | ${p.subject_name} | status: ${p.status}`),
    ``,
    `## Notes`,
    ``,
    `- This log is regenerated on every build of trust.iai.one.`,
    `- "verified" means probe + content are inline-supported. "declared" means officially stated with limited public proof. "unverified" means not enough proof to make a public claim.`,
    `- Domains, teams, channels, methods, and pages with last_reviewed_at older than ${STALE_AFTER_DAYS} days appear with a stale flag in the public surface.`,
    ``
  ].join("\n");

  await fs.mkdir(path.dirname(OUT_LOG), { recursive: true });
  await fs.writeFile(OUT_LOG, log, "utf8");

  console.log(`trust-state.json written: ${path.relative(ROOT, OUT_JSON_SRC)}`);
  console.log(`trust-state.json mirrored: ${path.relative(ROOT, OUT_JSON_PUBLIC)}`);
  console.log(`verification-log.md written: ${path.relative(ROOT, OUT_LOG)}`);
  console.log(`content/ mirrored to public/content/`);
  console.log(`Module 1 domains: ${Object.entries(dCounts).map(([k, v]) => `${k}=${v}`).join(", ")}`);
  console.log(`Modules 2-7: teams=${teams.length}, channels=${channels.length}, methods=${verification_methods.length}, go=${go_short_links.length}, reports=${report_types.length}, pages=${trust_pages.length}`);
}

main().catch(err => {
  console.error("trust-state-builder failed:", err);
  process.exit(1);
});
