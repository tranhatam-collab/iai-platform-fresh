// site.js — Trust.iai.one Phase 1
// Renders 7 modules per TRUST_MODULE_DATA_CONTRACTS.md.
// Status enum: verified | declared | unverified.
// Never inflates a claim. Never hides an empty state.

let locale = localStorage.getItem("locale") || "vi";
let dict = {};
let trust = null;

const STALE_AFTER_DAYS = 30;

function $(id) { return document.getElementById(id); }
function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
function statusTag(status) {
  const labels = locale === "vi"
    ? { verified: "Đã xác minh", declared: "Đã khai báo", unverified: "Chưa xác minh" }
    : { verified: "Verified",     declared: "Declared",      unverified: "Unverified" };
  const cls = ({ verified: "tag-ok", declared: "tag-warn", unverified: "tag-bad" })[status] || "tag-muted";
  return `<span class="tag ${cls}">${escapeHtml(labels[status] || status)}</span>`;
}
function staleTag(days) {
  if (days == null || days <= STALE_AFTER_DAYS) return "";
  const label = locale === "vi" ? `Quá hạn rà soát (${days} ngày)` : `Stale (${days}d)`;
  return ` <span class="tag tag-warn">${escapeHtml(label)}</span>`;
}
function disclosureBlock(text) {
  if (!text) return "";
  const label = locale === "vi" ? "Công bố" : "Disclosure";
  return `<p class="disclosure"><em>${label}:</em> ${escapeHtml(text)}</p>`;
}
function reviewedLine(date, days) {
  const label = locale === "vi" ? "Rà soát gần nhất" : "Last reviewed";
  return `<small class="muted">${label}: ${escapeHtml(date || "—")}${staleTag(days)}</small>`;
}

async function loadDict() {
  try {
    const res = await fetch(`/content/${locale}.json`, { cache: "no-store" });
    dict = await res.json();
  } catch { dict = {}; }
  document.documentElement.lang = locale;
  $("langBtn").textContent = locale === "vi" ? "EN" : "VI";

  const map = {
    appTitle: "app_title", phaseBadge: "phase_badge", navJump: "nav_jump",
    heroTitle: "hero_title", heroSubtitle: "hero_subtitle",
    m1Title: "m1_title", m1Lead: "m1_lead", m1RegistryTitle: "m1_registry_title",
    m1OutsideTitle: "m1_outside_title", m1OutsideLead: "m1_outside_lead", m1Note: "m1_note",
    m2Title: "m2_title", m2Lead: "m2_lead",
    m3Title: "m3_title", m3Lead: "m3_lead", m3Footer: "m3_footer",
    m4Title: "m4_title", m4Lead: "m4_lead", m4Note: "m4_note",
    m5Title: "m5_title", m5Lead: "m5_lead", m5Note: "m5_note",
    m6Title: "m6_title", m6Lead: "m6_lead",
    m6EmptyTitle: "m6_empty_title", m6EmptyBody: "m6_empty_body", m6Note: "m6_note",
    m7Title: "m7_title", m7Lead: "m7_lead",
    m7TypeLabel: "m7_type_label", m7AffectedLabel: "m7_affected_label",
    m7MsgLabel: "m7_msg_label", m7ContactLabel: "m7_contact_label",
    m7Fallback: "m7_fallback", m7Submit: "m7_submit", m7Mailto: "m7_mailto",
    m7FutureTitle: "m7_future_title",
    m7F1: "m7_f1", m7F2: "m7_f2", m7F3: "m7_f3", m7F4: "m7_f4", m7FutureNote: "m7_future_note",
    footerDisclosure: locale === "vi" ? "footer_disclosure_vi" : "footer_disclosure_en"
  };
  Object.entries(map).forEach(([id, key]) => {
    const node = $(id); const text = dict[key];
    if (node && typeof text === "string") node.textContent = text;
  });
}

async function loadTrust() {
  try {
    trust = await fetch("/data/trust-state.json", { cache: "no-store" }).then(r => r.json());
  } catch { trust = null; }
}

function renderHeroMeta() {
  const meta = $("heroMeta");
  const footerBuild = $("footerBuild");
  if (!trust) {
    if (meta) meta.textContent = locale === "vi" ? "Không nạp được trust-state.json" : "trust-state.json not loaded";
    return;
  }
  const fmt = new Date(trust.generated_at).toISOString().replace("T", " ").slice(0, 16) + " UTC";
  const text = `${dict.hero_meta_generated || (locale === "vi" ? "Tạo lúc" : "Generated")}: ${fmt} · ${dict.hero_meta_commit || "Build commit"}: ${trust.build_commit || "—"}`;
  if (meta) meta.textContent = text;
  if (footerBuild) footerBuild.textContent = text;
  if ($("footerDisclosure") && trust.ai_disclosure) {
    $("footerDisclosure").textContent = locale === "vi"
      ? trust.ai_disclosure.public_statement_vi
      : trust.ai_disclosure.public_statement_en;
  }
}

// ===== Module 1 — Official Domains =====
function renderM1() {
  if (!trust) return;
  const items = trust.modules.official_domains || [];
  const verified = items.filter(d => d.status === "verified");
  const declared = items.filter(d => d.status === "declared");
  const unverified = items.filter(d => d.status === "unverified");

  const grid = $("m1Stats");
  if (grid) {
    grid.innerHTML = "";
    const stats = [
      [locale === "vi" ? "Đã xác minh" : "Verified", verified.length, "tag-ok"],
      [locale === "vi" ? "Đã khai báo" : "Declared", declared.length, "tag-warn"],
      [locale === "vi" ? "Chưa xác minh" : "Unverified", unverified.length, "tag-bad"],
      [locale === "vi" ? "Tổng" : "Total", items.length, "tag-muted"]
    ];
    stats.forEach(([label, value, cls]) => {
      grid.appendChild(el("div", "card stat",
        `<small>${escapeHtml(label)}</small><strong>${value}</strong><span class="tag ${cls}">${escapeHtml(label)}</span>`));
    });
  }

  const reg = $("m1Registry");
  if (reg) {
    reg.innerHTML = "";
    [...verified, ...declared, ...unverified].forEach(d => {
      const ip = (d.probe.ip_records || []).join(", ") || "—";
      const http = d.probe.http_status || "—";
      const it = el("div", "item domain-item",
        `<div class="row"><strong>${escapeHtml(d.domain)}</strong>${statusTag(d.status)}</div>
         <small class="muted">${escapeHtml(d.role)} · ${escapeHtml(d.legal_lane || "")}</small>
         <div class="kv">
           <span><em>${locale === "vi" ? "Owner" : "Owner"}:</em> ${escapeHtml(d.owner_team || "—")}</span>
           <span><em>DNS:</em> ${escapeHtml(ip)}</span>
           <span><em>HTTP:</em> ${escapeHtml(String(http))}</span>
         </div>
         ${disclosureBlock(d.disclosure)}
         ${reviewedLine(d.last_reviewed_at, d.stale_days)}`);
      reg.appendChild(it);
    });
  }
}

// ===== Module 2 — Official Teams =====
function renderM2() {
  if (!trust) return;
  const list = $("m2List");
  const items = trust.modules.official_teams || [];
  if (!list) return;
  list.innerHTML = "";
  items.forEach(t => {
    list.appendChild(el("div", "item",
      `<div class="row"><strong>${escapeHtml(t.team_name)}</strong>${statusTag(t.status)}</div>
       <small class="muted">${escapeHtml(t.team_id)}</small>
       <p>${escapeHtml(t.surface_scope)}</p>
       <div class="kv">
         <span><em>${locale === "vi" ? "Owner declared" : "Owner declared"}:</em> ${escapeHtml(t.owner_declared || "—")}</span>
         <span><em>${locale === "vi" ? "Liên hệ" : "Contact"}:</em> ${escapeHtml(t.public_contact_reference || "—")}</span>
       </div>
       ${disclosureBlock(t.disclosure)}
       ${reviewedLine(t.last_reviewed_at, t.stale_days)}`));
  });
}

// ===== Module 3 — Official Channels =====
function renderM3() {
  if (!trust) return;
  const list = $("m3List");
  const items = trust.modules.official_channels || [];
  if (!list) return;
  list.innerHTML = "";
  items.forEach(c => {
    list.appendChild(el("div", "item",
      `<div class="row"><strong>${escapeHtml(c.label)}</strong>${statusTag(c.status)}</div>
       <small class="muted">${escapeHtml(c.channel_type)}</small>
       <p><code>${escapeHtml(c.value)}</code></p>
       <div class="kv">
         <span><em>${locale === "vi" ? "Phạm vi" : "Scope"}:</em> ${escapeHtml(c.scope || "—")}</span>
         <span><em>${locale === "vi" ? "Use case" : "Use case"}:</em> ${escapeHtml(c.use_case || "—")}</span>
         <span><em>${locale === "vi" ? "Bằng chứng" : "Evidence"}:</em> ${escapeHtml(c.public_evidence || (locale === "vi" ? "—" : "—"))}</span>
       </div>
       ${disclosureBlock(c.disclosure)}
       ${reviewedLine(c.last_reviewed_at, c.stale_days)}`));
  });
}

// ===== Module 4 — Verification Methods =====
function renderM4() {
  if (!trust) return;
  const list = $("m4List");
  const items = trust.modules.verification_methods || [];
  if (!list) return;
  list.innerHTML = "";
  items.forEach(m => {
    list.appendChild(el("div", "item",
      `<div class="row"><strong>${escapeHtml(m.method_id)} · ${escapeHtml(m.title)}</strong>${statusTag(m.status)}</div>
       <small class="muted">${locale === "vi" ? "Áp dụng" : "Applies to"}: ${escapeHtml(m.applies_to)}</small>
       <p>${escapeHtml(m.description)}</p>
       <div class="kv">
         <span><em>${locale === "vi" ? "Bằng chứng" : "Evidence"}:</em> ${escapeHtml(m.evidence_reference || "—")}</span>
         <span><em>${locale === "vi" ? "Giới hạn" : "Limitations"}:</em> ${escapeHtml(m.limitations || "—")}</span>
       </div>
       ${disclosureBlock(m.disclosure)}
       ${reviewedLine(m.last_reviewed_at, m.stale_days)}`));
  });
}

// ===== Module 5 — /go/* Short Links =====
function renderM5() {
  if (!trust) return;
  const list = $("m5List");
  const items = trust.modules.go_short_links || [];
  if (!list) return;
  list.innerHTML = "";
  if (items.length === 0) {
    list.appendChild(el("div", "item muted",
      locale === "vi"
        ? "Phase 1 chưa công bố short link /go/* nào. Mỗi entry yêu cầu slug, destination, owner_scope, evidence reference, và ngày rà soát."
        : "No /go/* short links published in Phase 1. Each entry requires slug, destination, owner_scope, evidence reference, and review date."));
    return;
  }
  items.forEach(g => {
    list.appendChild(el("div", "item",
      `<div class="row"><strong>/go/${escapeHtml(g.slug)}</strong>${statusTag(g.status)}</div>
       <p><code>→ ${escapeHtml(g.destination)}</code></p>
       <div class="kv">
         <span><em>${locale === "vi" ? "Owner" : "Owner"}:</em> ${escapeHtml(g.owner_scope || "—")}</span>
         <span><em>${locale === "vi" ? "Lý do" : "Reason"}:</em> ${escapeHtml(g.public_reason || "—")}</span>
       </div>
       ${disclosureBlock(g.disclosure)}
       ${reviewedLine(g.last_reviewed_at, g.stale_days)}`));
  });
}

// ===== Module 6 — Report & Impersonation =====
function renderM6() {
  if (!trust) return;
  const list = $("m6List");
  const items = trust.modules.report_and_impersonation || [];
  if (!list) return;
  list.innerHTML = "";
  items.forEach(r => {
    list.appendChild(el("div", "item",
      `<div class="row"><strong>${escapeHtml(r.label)}</strong>${statusTag(r.status)}</div>
       <small class="muted">${escapeHtml(r.report_type)}</small>
       <p>${escapeHtml(r.scope)}</p>
       <div class="kv">
         <span><em>${locale === "vi" ? "Cách gửi" : "Submission"}:</em> ${escapeHtml(r.submission_method)}</span>
         <span><em>${locale === "vi" ? "Hiển thị" : "Visibility"}:</em> ${escapeHtml(r.visibility)}</span>
       </div>
       ${disclosureBlock(r.privacy_note)}`));
  });
}

// ===== Module 7 — Trust Page Builder =====
function renderM7() {
  if (!trust) return;
  const list = $("m7BuilderList");
  const items = trust.modules.trust_page_builder || [];
  if (!list) return;
  list.innerHTML = "";
  items.forEach(p => {
    const links = (p.official_links || []).map(l => `<a class="link" href="${escapeHtml(l)}">${escapeHtml(l)}</a>`).join("<br>");
    list.appendChild(el("div", "item",
      `<div class="row"><strong>${escapeHtml(p.subject_name)}</strong>${statusTag(p.status)}</div>
       <small class="muted">${escapeHtml(p.subject_type)} · ${escapeHtml(p.page_id)}</small>
       <div class="kv">
         <span><em>${locale === "vi" ? "Phương pháp" : "Methods"}:</em> ${escapeHtml((p.verification_methods || []).join(", "))}</span>
         <span><em>${locale === "vi" ? "Liên hệ" : "Contact"}:</em> ${escapeHtml(p.public_contact)}</span>
       </div>
       <div class="kv">
         <span><em>${locale === "vi" ? "Liên kết chính thức" : "Official links"}:</em><br>${links || "—"}</span>
       </div>
       ${disclosureBlock(p.disclosure)}
       ${reviewedLine(p.last_reviewed_at, p.stale_days)}`));
  });
}

async function init() {
  await loadDict();
  await loadTrust();
  renderHeroMeta();
  renderM1(); renderM2(); renderM3(); renderM4(); renderM5(); renderM6(); renderM7();
}

$("langBtn").addEventListener("click", async () => {
  locale = locale === "vi" ? "en" : "vi";
  localStorage.setItem("locale", locale);
  await init();
});

$("reportForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const out = $("reportResult");
  const message = $("reportMessage").value.trim();
  const type = $("reportType").value;
  const affected = $("reportAffected").value.trim();
  const contact = $("reportContact").value.trim();
  if (!message) {
    out.hidden = false;
    out.textContent = locale === "vi" ? "Vui lòng nhập mô tả." : "Please describe the issue.";
    return;
  }
  out.hidden = false;
  out.textContent = locale === "vi" ? "Đang gửi…" : "Sending…";
  try {
    const res = await fetch("/api/trust/report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type, affected, message, contact })
    }).then(r => r.json());
    if (res && res.ok) {
      out.textContent = locale === "vi" ? "Đã nhận báo cáo. Chúng tôi sẽ rà soát." : "Report received. We will review it.";
      $("reportMessage").value = "";
      $("reportAffected").value = "";
    } else {
      out.textContent = locale === "vi" ? "Không gửi được. Dùng nút email fallback ở dưới." : "Could not send. Use the email fallback below.";
    }
  } catch {
    out.textContent = locale === "vi" ? "Không kết nối được backend. Dùng nút email fallback ở dưới." : "Backend not reachable. Use the email fallback below.";
  }
});

init();
