import {
  executeCheckoutFlowAsync,
  getCollectionHeroImage,
  getDefaultBuyerId,
  getDocumentsSlug,
  getProductByCode,
  getProductImageUrl,
  getRelatedProducts,
  loadCatalogAsync,
  loadLibraryAsync,
  loadOrderAsync,
  loadPricingAsync,
  loadProductBySlugAsync,
  loadRecommendationAsync,
  loadTeam3SurfaceAsync,
  loadTeam4OperationsAsync,
  type BuyerRole,
  type LibraryItem,
  type OrderRecord,
  type ProductCode,
  type ProductDefinition,
  type ProductCatalogFixture,
  type Team4OperationsContract
} from "./data.js";
import {
  defaultLocale,
  getLocalizedCopyNotes,
  getLocalizedLicenseLabel,
  getLocalizedProduct,
  getLocalizedRelatedLabel,
  getLocalizedRoleProfile,
  getLocalizedRoleProfiles,
  getLocalizedStatusLabel,
  getLocalizedSupportFaq,
  getLocalizedTierLabel,
  getLocalizedTierSummary,
  localeMeta,
  supportedLocales,
  type Locale
} from "./i18n.js";

export interface RouteResponse {
  status: number;
  body: string;
  contentType: string;
  headers?: Record<string, string>;
}

type CollectionKey = "all" | "documents" | "programs";

const brandLabel = "NOOS";

const legacyBoundaryRoutes = [
  { test: /^\/docs\/investment-programs$/, target: "/documents" },
  { test: /^\/docs\/investment-programs\/.+$/, target: "/documents" },
  { test: /^\/investor$/, target: "/products" },
  { test: /^\/investors$/, target: "/products" },
  { test: /^\/fundraising$/, target: "/products" },
  { test: /^\/investor-packages$/, target: "/products" },
  { test: /^\/fundraising-catalog$/, target: "/products" },
  { test: /^\/execution-fund$/, target: "/products" }
];

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function pageTitle(title: string): string {
  return `${title} | NOOS Commerce Build`;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(new Date(value));
}

function buildLocalePath(locale: Locale, path: string): string {
  const normalized = path === "/" ? "" : path;
  return `/${locale}${normalized}`;
}

function parseLocalizedPath(pathname: string): {
  locale: Locale;
  normalizedPath: string;
  isLocalized: boolean;
  rootLocaleOnly: boolean;
} {
  const trimmed = pathname.replace(/\/+$/, "") || "/";
  const match = trimmed.match(/^\/(en|vi)(\/.*)?$/);
  if (match) {
    return {
      locale: match[1] as Locale,
      normalizedPath: match[2] || "/",
      isLocalized: true,
      rootLocaleOnly: !match[2]
    };
  }

  return {
    locale: defaultLocale,
    normalizedPath: trimmed === "/" ? "/products" : trimmed,
    isLocalized: false,
    rootLocaleOnly: false
  };
}

function localizeMarkup(markup: string, locale: Locale): string {
  return markup.replace(/\b(href|action)="\/(?!en\/|vi\/)/g, `$1="/${locale}/`);
}

function canonicalUrl(locale: Locale, canonicalPath: string): string {
  return `https://noos.iai.one${buildLocalePath(locale, canonicalPath)}`;
}

function searchParamsSuffix(searchParams: URLSearchParams): string {
  const value = searchParams.toString();
  return value ? `?${value}` : "";
}

function section(title: string, content: string, kicker?: string): string {
  return `
    <section class="content-band">
      <div class="content-inner">
        ${kicker ? `<div class="section-kicker">${escapeHtml(kicker)}</div>` : ""}
        <h2>${escapeHtml(title)}</h2>
        ${content}
      </div>
    </section>
  `;
}

function pill(text: string): string {
  return `<span class="pill">${escapeHtml(text)}</span>`;
}

type Team4KpiDetail = {
  label: string;
  owner: string;
  cadence: string;
  target: string;
  yellow: string;
  red: string;
  note: string;
};

type Team4QueueDetail = {
  label: string;
  summary: string;
  checks: string[];
};

type Team4WaveDetail = {
  status: string;
  summary: string;
  exitRule: string;
};

type Team4OwnerEscalationRow = {
  responsibility: string;
  primary: string;
  backup: string;
  trigger: string;
};

type Team4IncidentPlay = {
  incident: string;
  support: string[];
  escalation: string[];
};

type Team4SupportMacro = {
  label: string;
  message: string;
};

type Team4TraceMapping = {
  scenario: string;
  detectSignals: string[];
  requiredTraceFields: string[];
  decisionPath: string[];
  escalateTo: string[];
};

type Team4OpsPacketDetails = {
  packetStatus: string;
  laneState: string;
  laneReason: string;
  ownerRows: Team4OwnerEscalationRow[];
  recoveryEntry: string[];
  recoveryConstraints: string[];
  partnerHandoff: string[];
  incidents: Team4IncidentPlay[];
  traceMappings: Team4TraceMapping[];
  macros: Team4SupportMacro[];
  rollbackOwners: string[];
  rollbackNotify: string[];
  rollbackTemplates: string[];
};

type Team4ExecutionProgress = {
  completedPercent: string;
  remainingPercent: string;
  asOf: string;
  focusNow: string[];
  blockedBy: string[];
  localeGuard: string[];
  sequenceGuard: string[];
};

const team4StatusSnapshot = {
  releaseStatus: "GO",
  activeScope: "Post-NFT gate ops and growth maintenance",
  blocker: "Team 1 NFT gate snapshot (2026-04-18): Overall PASS, Final verdict GO.",
  dependencies: [
    "Team 1 gate language lock for post-NFT lane behavior",
    "Team 2 runtime trace continuity for incident handling"
  ]
};

const team4LaunchGates = [
  "Team 3 route/page boundary is confirmed on the active NOOS surface.",
  "Price and license render stay aligned with the locked pricing ladder.",
  "Checkout metadata maps `product_code` and `license_type` without drift.",
  "Library activation is verified before broader campaign traffic is allowed.",
  "Upsell next step follows the locked map from the NOOS ladder system.",
  "Support fallback and incident macros are ready before a wave moves live."
];

const team4KpiDetails: Record<string, Team4KpiDetail> = {
  "conversion-rate-by-product": {
    label: "Conversion rate by product",
    owner: "Team 4 Growth Lead",
    cadence: "Daily",
    target: "Hit or exceed the conversion floor set for each Wave 1 product.",
    yellow: "Up to 24% below target.",
    red: "25% or more below target.",
    note: "Used to decide whether launch sequencing should stay narrow or expand."
  },
  aov: {
    label: "Average order value",
    owner: "Team 4 Growth Lead",
    cadence: "Daily",
    target: "At least $115.",
    yellow: "$95-$114.",
    red: "Below $95.",
    note: "Tracks whether the upsell ladder is raising revenue without discount noise."
  },
  "checkout-completion-rate": {
    label: "Checkout completion rate",
    owner: "Team 4 + Team 2",
    cadence: "Daily",
    target: "At least 70% of checkout starts complete.",
    yellow: "60%-69%.",
    red: "Below 60%.",
    note: "A launch wave cannot widen if buyers are falling out before payment completes."
  },
  "library-activation-rate-24h": {
    label: "Library activation within 24h",
    owner: "Team 4 + Team 2",
    cadence: "Daily",
    target: "At least 95% of completed orders unlock within 24 hours.",
    yellow: "90%-94%.",
    red: "Below 90%.",
    note: "This is the fastest truth check for fulfillment health after launch."
  },
  "upgrade-rate": {
    label: "Upgrade rate",
    owner: "Team 4 Growth Lead",
    cadence: "Weekly",
    target: "At least 8% of eligible buyers move up the mapped ladder.",
    yellow: "5%-7%.",
    red: "Below 5%.",
    note: "Measures whether the next-step path is clear enough to raise value over time."
  },
  "repeat-purchase-rate-30-60-90d": {
    label: "Repeat purchase rate",
    owner: "Team 4 Growth Lead",
    cadence: "Weekly",
    target: "30d 12% · 60d 18% · 90d 24%.",
    yellow: "30d 8%-11% · 60d 14%-17% · 90d 18%-23%.",
    red: "Below the yellow floor at any checkpoint.",
    note: "Confirms whether the trust-led catalog is turning first purchase into a system."
  },
  "support-response-sla": {
    label: "Support response SLA",
    owner: "Team 4 Ops Lead",
    cadence: "Daily",
    target: "95% of tickets receive a first response within 24 hours.",
    yellow: "90%-94%.",
    red: "Below 90%.",
    note: "Protects trust after payment, especially while Wave 1 is still under gate review."
  },
  "refund-dispute-rate": {
    label: "Refund and dispute rate",
    owner: "Team 4 Ops Lead",
    cadence: "Weekly",
    target: "At or below 1.5% of completed orders.",
    yellow: "1.51%-2.5%.",
    red: "Above 2.5%.",
    note: "A spike here freezes campaign expansion until the cause is understood."
  },
  "pricing-mismatch-incidents": {
    label: "Pricing mismatch incidents",
    owner: "Team 4 + Team 3",
    cadence: "Daily",
    target: "Zero incidents per week.",
    yellow: "One incident per week.",
    red: "Two or more incidents per week.",
    note: "Any mismatch between page, checkout, and buyer state is a same-day escalation."
  },
  "failed-fulfillment-incidents": {
    label: "Failed fulfillment incidents",
    owner: "Team 4 + Team 2",
    cadence: "Daily",
    target: "At or below 0.5% with no unresolved ticket older than 24 hours.",
    yellow: "0.51%-1.0%.",
    red: "Above 1.0%.",
    note: "If access fails after payment, the wave is not ready for broader traffic."
  }
};

const team4QueueDetails: Record<string, Team4QueueDetail> = {
  "purchase-access": {
    label: "Purchase and access",
    summary: "Used when payment completed but library access, delivery, or confirmation state is missing.",
    checks: [
      "Confirm checkout.session.completed and order record.",
      "Verify entitlement grant and library state.",
      "Escalate replay or re-grant work to Team 2 with an audit trail."
    ]
  },
  "license-upgrade": {
    label: "License upgrade",
    summary: "Used when a buyer needs mapped upgrade credit or help moving to the next valid license path.",
    checks: [
      "Confirm the previous purchase is on a locked mapped path.",
      "Validate the upgrade window before touching checkout.",
      "Route ledger work through Team 2 and wording drift through Team 3."
    ]
  },
  "refund-dispute": {
    label: "Refund and dispute",
    summary: "Used for refund requests, Stripe disputes, and buyer claims about pricing, license, or update rights.",
    checks: [
      "Verify live render matched price, license, and update truth.",
      "Package evidence within 24 hours for formal disputes.",
      "Escalate lock or authority conflicts to Team 1 the same day."
    ]
  }
};

const team4WaveDetails: Record<string, Team4WaveDetail> = {
  "wave-1": {
    status: "OPS STEADY",
    summary: "Wave 1 stays in controlled operations mode with KPI, support, and trace mapping discipline.",
    exitRule: "Needs checkout mapping, library activation, upsell alignment, and support fallback verified."
  },
  "wave-2": {
    status: "SEQUENCED",
    summary: "Wave 2 remains sequence-locked to Team 1 mission map and moves only on Team 1 order.",
    exitRule: "Needs 5 green days on checkout completion, activation, and zero pricing mismatch."
  }
};

const team4StatusSnapshotVi = {
  releaseStatus: "GO",
  activeScope: "Vận hành hậu-NFT gate cho ops và growth",
  blocker: "Snapshot gate NFT Team 1 (2026-04-18): Overall PASS, Final verdict GO.",
  dependencies: [
    "Khóa ngôn ngữ gate của Team 1 cho lane hậu-NFT",
    "Duy trì trace runtime Team 2 cho xử lý incident"
  ]
};

const team4LaunchGatesVi = [
  "Ranh giới route/page của Team 3 đã được xác nhận trên bề mặt NOOS đang hoạt động.",
  "Giá và license hiển thị luôn khớp với pricing ladder đã khóa.",
  "Metadata checkout map đúng `product_code` và `license_type` không bị lệch.",
  "Kích hoạt thư viện được xác minh trước khi cho traffic chiến dịch rộng hơn.",
  "Bước upsell kế tiếp bám đúng bản đồ đã khóa của ladder NOOS.",
  "Macro hỗ trợ và fallback incident đã sẵn sàng trước khi một wave được mở live."
];

const team4KpiDetailsVi: Record<string, Team4KpiDetail> = {
  "conversion-rate-by-product": {
    label: "Tỷ lệ chuyển đổi theo sản phẩm",
    owner: "Lead tăng trưởng Team 4",
    cadence: "Hằng ngày",
    target: "Đạt hoặc vượt ngưỡng chuyển đổi đã khóa cho từng sản phẩm trong Wave 1.",
    yellow: "Thấp hơn mục tiêu tối đa 24%.",
    red: "Thấp hơn mục tiêu từ 25% trở lên.",
    note: "Dùng để quyết định launch sequencing có thể mở rộng hay vẫn phải giữ hẹp."
  },
  aov: {
    label: "Giá trị đơn hàng trung bình",
    owner: "Lead tăng trưởng Team 4",
    cadence: "Hằng ngày",
    target: "Từ $115 trở lên.",
    yellow: "$95-$114.",
    red: "Dưới $95.",
    note: "Theo dõi việc upsell ladder có nâng doanh thu mà không tạo nhiễu giảm giá hay không."
  },
  "checkout-completion-rate": {
    label: "Tỷ lệ hoàn tất checkout",
    owner: "Team 4 + Team 2",
    cadence: "Hằng ngày",
    target: "Ít nhất 70% lượt bắt đầu checkout hoàn tất thanh toán.",
    yellow: "60%-69%.",
    red: "Dưới 60%.",
    note: "Không được mở wave nếu người mua đang rơi khỏi luồng trước khi thanh toán xong."
  },
  "library-activation-rate-24h": {
    label: "Tỷ lệ kích hoạt thư viện trong 24h",
    owner: "Team 4 + Team 2",
    cadence: "Hằng ngày",
    target: "Ít nhất 95% đơn hoàn tất được mở thư viện trong 24 giờ.",
    yellow: "90%-94%.",
    red: "Dưới 90%.",
    note: "Đây là tín hiệu sự thật nhanh nhất về fulfillment health ngay sau launch."
  },
  "upgrade-rate": {
    label: "Tỷ lệ nâng cấp",
    owner: "Lead tăng trưởng Team 4",
    cadence: "Hằng tuần",
    target: "Ít nhất 8% buyer đủ điều kiện đi lên đúng ladder đã map.",
    yellow: "5%-7%.",
    red: "Dưới 5%.",
    note: "Đo xem đường đi bước kế tiếp có đủ rõ để nâng giá trị theo thời gian hay không."
  },
  "repeat-purchase-rate-30-60-90d": {
    label: "Tỷ lệ mua lại",
    owner: "Lead tăng trưởng Team 4",
    cadence: "Hằng tuần",
    target: "30d 12% · 60d 18% · 90d 24%.",
    yellow: "30d 8%-11% · 60d 14%-17% · 90d 18%-23%.",
    red: "Thấp hơn ngưỡng vàng ở bất kỳ mốc nào.",
    note: "Xác nhận catalog trust-led có đang biến lượt mua đầu thành một hệ thống hay không."
  },
  "support-response-sla": {
    label: "SLA phản hồi hỗ trợ",
    owner: "Lead vận hành Team 4",
    cadence: "Hằng ngày",
    target: "95% ticket nhận phản hồi đầu tiên trong 24 giờ.",
    yellow: "90%-94%.",
    red: "Dưới 90%.",
    note: "Bảo vệ niềm tin sau thanh toán, nhất là khi Wave 1 còn đang dưới launch gate."
  },
  "refund-dispute-rate": {
    label: "Tỷ lệ refund và dispute",
    owner: "Lead vận hành Team 4",
    cadence: "Hằng tuần",
    target: "Tối đa 1.5% số đơn hoàn tất.",
    yellow: "1.51%-2.5%.",
    red: "Trên 2.5%.",
    note: "Nếu chỉ số này tăng, mọi mở rộng chiến dịch phải dừng cho tới khi xác định được nguyên nhân."
  },
  "pricing-mismatch-incidents": {
    label: "Sự cố lệch giá hoặc license",
    owner: "Team 4 + Team 3",
    cadence: "Hằng ngày",
    target: "0 sự cố mỗi tuần.",
    yellow: "1 sự cố mỗi tuần.",
    red: "Từ 2 sự cố mỗi tuần trở lên.",
    note: "Bất kỳ lệch nào giữa page, checkout và buyer state đều phải escalated trong ngày."
  },
  "failed-fulfillment-incidents": {
    label: "Sự cố fulfillment thất bại",
    owner: "Team 4 + Team 2",
    cadence: "Hằng ngày",
    target: "Tối đa 0.5% và không có ticket nào tồn quá 24 giờ.",
    yellow: "0.51%-1.0%.",
    red: "Trên 1.0%.",
    note: "Nếu access fail sau thanh toán thì wave đó chưa sẵn sàng cho traffic rộng hơn."
  }
};

const team4QueueDetailsVi: Record<string, Team4QueueDetail> = {
  "purchase-access": {
    label: "Mua hàng và truy cập",
    summary: "Dùng khi thanh toán đã thành công nhưng library access, delivery hoặc trạng thái xác nhận còn thiếu.",
    checks: [
      "Xác nhận sự kiện checkout.session.completed và order record.",
      "Xác minh entitlement grant và trạng thái thư viện.",
      "Escalate replay hoặc re-grant cho Team 2 kèm audit trail."
    ]
  },
  "license-upgrade": {
    label: "Nâng cấp license",
    summary: "Dùng khi buyer cần credit nâng cấp hoặc cần hỗ trợ đi sang license path hợp lệ kế tiếp.",
    checks: [
      "Xác nhận giao dịch trước nằm trên mapped path đã khóa.",
      "Kiểm tra cửa sổ nâng cấp trước khi chạm vào checkout.",
      "Route phần ledger qua Team 2 và lệch wording qua Team 3."
    ]
  },
  "refund-dispute": {
    label: "Refund và dispute",
    summary: "Dùng cho yêu cầu hoàn tiền, tranh chấp Stripe và các khiếu nại về giá, license hoặc quyền cập nhật.",
    checks: [
      "Xác minh bản render live đã khớp giá, license và update truth.",
      "Đóng gói bằng chứng trong 24 giờ cho các dispute chính thức.",
      "Escalate mọi xung đột về quyền hạn hoặc lock lên Team 1 trong ngày."
    ]
  }
};

const team4WaveDetailsVi: Record<string, Team4WaveDetail> = {
  "wave-1": {
    status: "VẬN HÀNH ỔN ĐỊNH",
    summary: "Wave 1 giữ chế độ vận hành có kiểm soát với kỷ luật KPI, hỗ trợ và trace mapping.",
    exitRule: "Phải xác minh xong mapping checkout, kích hoạt thư viện, upsell alignment và support fallback."
  },
  "wave-2": {
    status: "THEO THỨ TỰ",
    summary: "Wave 2 khóa theo mission map của Team 1 và chỉ dịch chuyển khi Team 1 phát lệnh.",
    exitRule: "Cần 5 ngày xanh liên tục ở checkout completion, activation và 0 pricing mismatch."
  }
};

const team4OpsPacketDetailsEn: Team4OpsPacketDetails = {
  packetStatus: "READY_FOR_TEAM1_REVIEW",
  laneState: "GO",
  laneReason: "Team 1 NFT gate snapshot (2026-04-18): Overall PASS, Final verdict GO. Team 4 remains support/recovery/trace mapping only.",
  ownerRows: [
    {
      responsibility: "Buyer acknowledgement and triage",
      primary: "Team 4 Ops Lead",
      backup: "Team 4 Growth Lead",
      trigger: "Buyer is denied, held, or cannot complete protected access flow."
    },
    {
      responsibility: "Ops wording and partner expectation",
      primary: "Team 4 Growth Lead",
      backup: "Team 4 Ops Lead",
      trigger: "Wording risks drifting away from gate or locked policy."
    },
    {
      responsibility: "Runtime proof and verification chain",
      primary: "Team 2 Runtime Lead",
      backup: "Team 2 on-call runtime owner",
      trigger: "Any STEP_UP_*, WALLET_*, ASSET_PROXY_*, or PARTNER_SYNC_* signal."
    },
    {
      responsibility: "Gate conflict and rollback authority",
      primary: "Team 1 Program Root",
      backup: "Team 1 release gate delegate",
      trigger: "Recovery or partner requests risk crossing locked authority."
    }
  ],
  recoveryEntry: [
    "Every ticket must include subject_id or buyer identifier, asset_id, and the best-known partner or access event references.",
    "Team 4 triages each case into step_up, wallet_proof, policy_deny, partner_sync, or rollback_hold.",
    "Every reopen path returns through access-check -> proxy-token -> protected delivery on nft.iai.one."
  ],
  recoveryConstraints: [
    "No manual grant access.",
    "No raw asset URLs in support messages.",
    "No policy override via support note.",
    "vc.vetuonglai.com cannot make final protected access decisions."
  ],
  partnerHandoff: [
    "Partner handoff is owned by Team 4 Ops Lead with same-day Team 2 escalation.",
    "Signed sync requires x-partner-signature, x-idempotency-key, and x-source-timestamp.",
    "Minimum payload fields: partner_program_id, asset_id, event_name, source_timestamp.",
    "Invalid or stale partner events are quarantined and cannot mutate access state.",
    "Partner receives reject reason and partner_event_id within 24h."
  ],
  incidents: [
    {
      incident: "Step-up required",
      support: [
        "Confirm STEP_UP_REQUIRED or STEP_UP_EXPIRED.",
        "Guide buyer through passkey/WebAuthn on nft.iai.one.",
        "Keep buyer on protected lane, no partner-side manual open."
      ],
      escalation: ["Repeat failures -> Team 2 Runtime Lead", "Policy wording conflict -> Team 1 Program Root"]
    },
    {
      incident: "Wallet proof required",
      support: [
        "Confirm WALLET_PROOF_REQUIRED, WALLET_SIGNATURE_INVALID, or WALLET_PROOF_EXPIRED.",
        "Restart wallet challenge with the linked wallet.",
        "Do not confirm access until proof passes."
      ],
      escalation: ["Runtime loop or bind mismatch -> Team 2 Runtime Lead", "Promise conflict -> Team 1 Program Root"]
    },
    {
      incident: "Access denied",
      support: [
        "Confirm ASSET_POLICY_DENIED or ASSET_PROXY_SCOPE_INVALID.",
        "Reply with locked policy wording, no manual unlock.",
        "Open metadata review if buyer reports eligibility mismatch."
      ],
      escalation: ["Policy input suspicion -> Team 2 Runtime Lead", "Partner promise conflict -> Team 1 Program Root"]
    },
    {
      incident: "Invalid partner signature",
      support: [
        "Quarantine event and keep access state unchanged.",
        "Notify partner that access cannot be promised until signed event is valid."
      ],
      escalation: ["Same-day -> Team 2 Runtime Lead", "Repeat trust-root risk -> Team 1 Program Root"]
    },
    {
      incident: "Rollback trigger",
      support: [
        "Move protected-open tickets into hold mode.",
        "Use rollback macro for buyer and partner.",
        "No manual open during rollback window."
      ],
      escalation: ["Technical hold -> Team 2 Runtime Lead", "Gate authority -> Team 1 Program Root", "Business expectation sync -> Team 4 Growth Lead"]
    }
  ],
  traceMappings: [
    {
      scenario: "Wrong asset opening request",
      detectSignals: [
        "requested_asset_id is outside entitlement scope for subject_id.",
        "ASSET_PROXY_SCOPE_INVALID or ASSET_POLICY_DENIED appears on access-check.",
        "Buyer asks to open an asset different from the completed order path."
      ],
      requiredTraceFields: [
        "subject_id or buyer identifier",
        "requested_asset_id",
        "entitled_asset_ids_snapshot",
        "asset_access_event_id",
        "policy_eval_id and deny_code",
        "order_id and entitlement_id"
      ],
      decisionPath: [
        "Keep deny state; do not open asset manually.",
        "Reply using deny macro with tracking id.",
        "Open Team 2 verification only when entitlement snapshot and request diverge unexpectedly."
      ],
      escalateTo: ["Team 2 Runtime Lead for policy or entitlement mismatch", "Team 1 Program Root if partner promise conflicts with deny state"]
    },
    {
      scenario: "Deny mismatch",
      detectSignals: [
        "Support or partner claims allow while runtime returns ASSET_POLICY_DENIED.",
        "Partner sync payload and policy input hash disagree.",
        "Repeated deny reason differs between buyer and partner records."
      ],
      requiredTraceFields: [
        "partner_event_id",
        "x-idempotency-key and x-source-timestamp",
        "policy_input_hash",
        "deny_reason and deny_code",
        "asset_access_event_id",
        "review_ticket_id"
      ],
      decisionPath: [
        "Freeze promise state and keep deny until trace comparison completes.",
        "Quarantine mismatched partner event.",
        "Attach trace bundle to Team 2 and Team 1 same-day review."
      ],
      escalateTo: ["Team 2 Runtime Lead for trace reconciliation", "Team 1 Program Root for gate authority and communication lock"]
    }
  ],
  macros: [
    {
      label: "Step-up required macro",
      message:
        "Hello [buyer_name], opening asset [asset_id] needs additional verification on nft.iai.one. Please complete passkey/WebAuthn step-up and retry within 10 minutes. Support cannot open the asset manually before this step passes. Tracking id: [asset_access_event_id]."
    },
    {
      label: "Wallet proof required macro",
      message:
        "Hello [buyer_name], the system needs valid wallet proof to continue with asset [asset_id]. Please rerun the challenge with the linked wallet. Until wallet proof passes, support cannot issue protected access on your behalf. Tracking id: [asset_access_event_id]."
    },
    {
      label: "Updates announcement macro",
      message:
        "Hello [buyer_name], version [version_id] for [asset_id] is now live in your library on nft.iai.one. Update scope: [update_scope]. If your update window has expired, follow the mapped upgrade path shown in licenses. Tracking id: [update_event_id]."
    },
    {
      label: "Rollback hold macro",
      message:
        "Hello [recipient_name], the protected asset lane is in controlled hold while nft.iai.one verifies access safety. During this window support will not open assets manually or share direct links. Next update before [next_update_time]. Incident id: [incident_id]."
    }
  ],
  rollbackOwners: ["Team 2 Runtime Lead (technical hold)", "Team 4 Ops Lead (buyer and partner communication)", "Team 1 Program Root (gate authority)"],
  rollbackNotify: [
    "Team 1 Program Root",
    "Team 2 Runtime Lead or runtime on-call",
    "Team 4 Growth Lead and Team 4 Ops Lead",
    "VC Partner Ops contact",
    "Impacted buyers with open tickets"
  ],
  rollbackTemplates: [
    "Internal: Rollback trigger [trigger]. Scope [asset_class/route/partner_program]. Freeze protected open or download, preserve audit, no manual unlock.",
    "Partner: Protected asset lane is in controlled hold while nft.iai.one verifies policy and sync integrity. Do not promise access or distribute links from vc.vetuonglai.com until Team 1 clears reopen.",
    "User: Your requested asset is temporarily in hold status while access safety is verified on nft.iai.one. Support cannot open assets manually during this check window."
  ]
};

const team4OpsPacketDetailsVi: Team4OpsPacketDetails = {
  packetStatus: "READY_FOR_TEAM1_REVIEW",
  laneState: "GO",
  laneReason: "Snapshot gate NFT Team 1 (2026-04-18): Overall PASS, Final verdict GO. Team 4 chỉ giữ support/recovery/trace mapping.",
  ownerRows: [
    {
      responsibility: "Buyer acknowledgement và triage",
      primary: "Lead vận hành Team 4",
      backup: "Lead tăng trưởng Team 4",
      trigger: "Buyer bị deny, hold, hoặc không hoàn tất được protected flow."
    },
    {
      responsibility: "Wording vận hành và kỳ vọng đối tác",
      primary: "Lead tăng trưởng Team 4",
      backup: "Lead vận hành Team 4",
      trigger: "Wording có nguy cơ trượt khỏi gate hoặc policy đã khóa."
    },
    {
      responsibility: "Chuỗi runtime proof và xác minh",
      primary: "Lead runtime Team 2",
      backup: "Owner runtime on-call Team 2",
      trigger: "Bất kỳ tín hiệu STEP_UP_*, WALLET_*, ASSET_PROXY_*, hoặc PARTNER_SYNC_*."
    },
    {
      responsibility: "Xung đột gate và quyền rollback",
      primary: "Program Root Team 1",
      backup: "Delegate release gate Team 1",
      trigger: "Yêu cầu recovery hoặc partner có nguy cơ vượt ranh giới quyền hạn đã khóa."
    }
  ],
  recoveryEntry: [
    "Mỗi ticket phải có subject_id hoặc buyer identifier, asset_id, và các mã event partner/access tốt nhất hiện có.",
    "Team 4 phân loại case vào step_up, wallet_proof, policy_deny, partner_sync, hoặc rollback_hold.",
    "Mọi đường mở lại đều quay về access-check -> proxy-token -> protected delivery trên nft.iai.one."
  ],
  recoveryConstraints: [
    "Không manual grant access.",
    "Không gửi raw asset URL trong nội dung hỗ trợ.",
    "Không dùng support note để override policy gate.",
    "vc.vetuonglai.com không được tự quyết protected access cuối cùng."
  ],
  partnerHandoff: [
    "Partner handoff do Lead vận hành Team 4 phụ trách và escalated Team 2 trong ngày.",
    "Signed sync bắt buộc có x-partner-signature, x-idempotency-key, và x-source-timestamp.",
    "Payload tối thiểu: partner_program_id, asset_id, event_name, source_timestamp.",
    "Event đối tác invalid hoặc stale phải quarantine và không được đổi access state.",
    "Đối tác nhận reject reason và partner_event_id trong 24 giờ."
  ],
  incidents: [
    {
      incident: "Step-up required",
      support: [
        "Xác nhận STEP_UP_REQUIRED hoặc STEP_UP_EXPIRED.",
        "Hướng dẫn buyer hoàn tất passkey/WebAuthn trên nft.iai.one.",
        "Giữ buyer trên protected lane, không mở tay ở domain đối tác."
      ],
      escalation: ["Lỗi lặp lại -> Lead runtime Team 2", "Xung đột wording policy -> Program Root Team 1"]
    },
    {
      incident: "Wallet proof required",
      support: [
        "Xác nhận WALLET_PROOF_REQUIRED, WALLET_SIGNATURE_INVALID, hoặc WALLET_PROOF_EXPIRED.",
        "Chạy lại challenge với wallet đã liên kết.",
        "Không xác nhận access cho tới khi proof pass."
      ],
      escalation: ["Loop runtime hoặc bind sai -> Lead runtime Team 2", "Xung đột cam kết -> Program Root Team 1"]
    },
    {
      incident: "Access denied",
      support: [
        "Xác nhận ASSET_POLICY_DENIED hoặc ASSET_PROXY_SCOPE_INVALID.",
        "Phản hồi theo wording policy đã khóa, không mở bằng tay.",
        "Mở review metadata nếu buyer báo sai eligibility."
      ],
      escalation: ["Nghi ngờ policy input -> Lead runtime Team 2", "Xung đột promise đối tác -> Program Root Team 1"]
    },
    {
      incident: "Invalid partner signature",
      support: [
        "Quarantine event và giữ nguyên access state.",
        "Thông báo đối tác không được promise access cho tới khi signed event hợp lệ."
      ],
      escalation: ["Trong ngày -> Lead runtime Team 2", "Lặp lại và rủi ro trust-root -> Program Root Team 1"]
    },
    {
      incident: "Rollback trigger",
      support: [
        "Chuyển ticket mở protected asset sang hold mode.",
        "Dùng rollback macro cho buyer và partner.",
        "Không mở tay trong cửa sổ rollback."
      ],
      escalation: ["Hold kỹ thuật -> Lead runtime Team 2", "Quyền gate -> Program Root Team 1", "Đồng bộ kỳ vọng kinh doanh -> Lead tăng trưởng Team 4"]
    }
  ],
  traceMappings: [
    {
      scenario: "Yêu cầu mở nhầm tài sản",
      detectSignals: [
        "requested_asset_id nằm ngoài entitlement scope của subject_id.",
        "ASSET_PROXY_SCOPE_INVALID hoặc ASSET_POLICY_DENIED xuất hiện tại access-check.",
        "Buyer yêu cầu mở tài sản khác với đường đơn hàng đã hoàn tất."
      ],
      requiredTraceFields: [
        "subject_id hoặc buyer identifier",
        "requested_asset_id",
        "entitled_asset_ids_snapshot",
        "asset_access_event_id",
        "policy_eval_id và deny_code",
        "order_id và entitlement_id"
      ],
      decisionPath: [
        "Giữ deny state, không mở tay.",
        "Phản hồi bằng deny macro kèm tracking id.",
        "Chỉ mở nhánh xác minh Team 2 khi entitlement snapshot và yêu cầu lệch bất thường."
      ],
      escalateTo: ["Lead runtime Team 2 cho mismatch policy hoặc entitlement", "Program Root Team 1 nếu promise đối tác xung đột deny state"]
    },
    {
      scenario: "Deny mismatch",
      detectSignals: [
        "Support hoặc partner báo allow trong khi runtime trả ASSET_POLICY_DENIED.",
        "Payload partner sync và policy input hash không khớp.",
        "Deny reason lặp lại nhưng khác giữa bản ghi buyer và đối tác."
      ],
      requiredTraceFields: [
        "partner_event_id",
        "x-idempotency-key và x-source-timestamp",
        "policy_input_hash",
        "deny_reason và deny_code",
        "asset_access_event_id",
        "review_ticket_id"
      ],
      decisionPath: [
        "Đóng băng promise state và giữ deny cho tới khi đối soát trace xong.",
        "Quarantine sự kiện partner bị mismatch.",
        "Đính kèm trace bundle để Team 2 và Team 1 review trong ngày."
      ],
      escalateTo: ["Lead runtime Team 2 để đối soát trace", "Program Root Team 1 để khóa quyền gate và truyền thông"]
    }
  ],
  macros: [
    {
      label: "Macro step-up required",
      message:
        "Chào [buyer_name], yêu cầu mở tài sản [asset_id] cần bước xác minh bổ sung trên nft.iai.one. Vui lòng hoàn tất passkey/WebAuthn step-up rồi thử lại trong 10 phút. Support không thể mở tay trước khi bước này pass. Mã theo dõi: [asset_access_event_id]."
    },
    {
      label: "Macro wallet proof required",
      message:
        "Chào [buyer_name], hệ thống cần wallet proof hợp lệ để tiếp tục với tài sản [asset_id]. Vui lòng chạy lại challenge với wallet đã liên kết. Khi proof chưa pass, support không thể cấp protected access thay bạn. Mã theo dõi: [asset_access_event_id]."
    },
    {
      label: "Macro thông báo cập nhật",
      message:
        "Chào [buyer_name], phiên bản [version_id] cho [asset_id] đã sẵn sàng trong thư viện của bạn trên nft.iai.one. Phạm vi cập nhật: [update_scope]. Nếu cửa sổ cập nhật đã hết hạn, vui lòng đi theo đường nâng cấp đã map trong mục license. Mã theo dõi: [update_event_id]."
    },
    {
      label: "Macro rollback hold",
      message:
        "Chào [recipient_name], lane protected asset đang ở chế độ hold có kiểm soát để xác minh an toàn truy cập trên nft.iai.one. Trong cửa sổ này support không mở tay và không gửi link trực tiếp. Cập nhật tiếp theo trước [next_update_time]. Incident id: [incident_id]."
    }
  ],
  rollbackOwners: ["Lead runtime Team 2 (hold kỹ thuật)", "Lead vận hành Team 4 (truyền thông buyer và partner)", "Program Root Team 1 (quyền gate)"],
  rollbackNotify: [
    "Program Root Team 1",
    "Lead runtime Team 2 hoặc runtime on-call",
    "Lead tăng trưởng Team 4 và Lead vận hành Team 4",
    "Đầu mối VC Partner Ops",
    "Buyer bị ảnh hưởng đang có ticket mở"
  ],
  rollbackTemplates: [
    "Nội bộ: Rollback trigger [trigger]. Scope [asset_class/route/partner_program]. Dừng protected open/download, giữ audit, không mở tay.",
    "Đối tác: Protected asset lane đang hold có kiểm soát trong lúc nft.iai.one xác minh policy và sync integrity. Không promise access và không phát link từ vc.vetuonglai.com cho tới khi Team 1 mở lại.",
    "Người mua: Tài sản bạn yêu cầu đang tạm giữ để xác minh an toàn truy cập trên nft.iai.one. Support không mở tay trong cửa sổ kiểm tra này."
  ]
};

const team4ExecutionProgressEn: Team4ExecutionProgress = {
  completedPercent: "94%",
  remainingPercent: "6%",
  asOf: "2026-04-18",
  focusNow: [
    "Keep /operations and packet wording aligned to Team 1 gate language.",
    "Maintain KPI drift watch plus support/recovery execution discipline.",
    "Keep trace mapping and rollback communication ready for Team 1 review."
  ],
  blockedBy: [
    "No blocking action items in Team 1 NFT gate snapshot.",
    "Any change request must be synchronized to Team 1 directive before edits land."
  ],
  localeGuard: [
    "English-first for international public routes.",
    "Vietnamese with full diacritics for vi routes.",
    "No mixed EN/VI in one indexable hero or title."
  ],
  sequenceGuard: [
    "NFT readiness is completed first.",
    "PAY readiness opens only after NFT gate is cleared by Team 1."
  ]
};

const team4ExecutionProgressVi: Team4ExecutionProgress = {
  completedPercent: "94%",
  remainingPercent: "6%",
  asOf: "2026-04-18",
  focusNow: [
    "Giữ wording trên /operations và packet bám đúng gate language của Team 1.",
    "Duy trì theo dõi KPI drift và kỷ luật thực thi support/recovery.",
    "Giữ trace mapping và rollback communication luôn sẵn cho Team 1 review."
  ],
  blockedBy: [
    "Không có blocking action item trong snapshot gate NFT của Team 1.",
    "Mọi thay đổi mới phải đồng bộ theo directive Team 1 trước khi ghi nhận."
  ],
  localeGuard: [
    "English-first cho các route public quốc tế.",
    "Tiếng Việt có dấu đầy đủ cho bề mặt vi.",
    "Không trộn EN/VI trong cùng hero hoặc title indexable."
  ],
  sequenceGuard: [
    "Readiness NFT phải hoàn tất trước.",
    "Readiness PAY chỉ mở sau khi Team 1 clear cổng NFT."
  ]
};

const guardrailLabels: Record<Locale, Record<string, string>> = {
  en: {
    "authority-led-messaging-only": "Authority-led messaging only",
    "no-fake-scarcity": "No fake scarcity",
    "no-discount-spam": "No discount spam",
    "no-price-license-drift": "No price or license drift"
  },
  vi: {
    "authority-led-messaging-only": "Chỉ dùng thông điệp do đúng owner có thẩm quyền phát ra",
    "no-fake-scarcity": "Không dùng khan hiếm giả để thúc ép mua",
    "no-discount-spam": "Không spam giảm giá",
    "no-price-license-drift": "Không để giá hoặc license bị lệch khỏi truth đã khóa"
  }
};

const runbookLabels: Record<Locale, Record<string, string>> = {
  en: {
    "launch-day-monitoring": "Launch-day monitoring",
    "failed-purchase-missing-access": "Failed purchase / missing access",
    "license-upgrade-support": "License upgrade support",
    "updates-announcement": "Updates announcement"
  },
  vi: {
    "launch-day-monitoring": "Theo dõi ngày launch",
    "failed-purchase-missing-access": "Thanh toán thành công nhưng thiếu quyền truy cập",
    "license-upgrade-support": "Hỗ trợ nâng cấp license",
    "updates-announcement": "Thông báo cập nhật"
  }
};

function getLocalizedTeam4StatusSnapshot(locale: Locale) {
  return locale === "vi" ? team4StatusSnapshotVi : team4StatusSnapshot;
}

function getLocalizedTeam4LaunchGates(locale: Locale): string[] {
  return locale === "vi" ? team4LaunchGatesVi : team4LaunchGates;
}

function getLocalizedTeam4KpiDetail(kpi: string, locale: Locale): Team4KpiDetail {
  return (
    locale === "vi" ? team4KpiDetailsVi[kpi] ?? team4KpiDetails[kpi] : team4KpiDetails[kpi]
  ) ?? team4KpiDetails["conversion-rate-by-product"]!;
}

function getLocalizedTeam4QueueDetail(queue: string, locale: Locale): Team4QueueDetail {
  return (
    locale === "vi" ? team4QueueDetailsVi[queue] ?? team4QueueDetails[queue] : team4QueueDetails[queue]
  ) ?? team4QueueDetails["purchase-access"]!;
}

function getLocalizedTeam4WaveDetail(waveId: string, locale: Locale): Team4WaveDetail {
  return (
    locale === "vi" ? team4WaveDetailsVi[waveId] ?? team4WaveDetails[waveId] : team4WaveDetails[waveId]
  ) ?? team4WaveDetails["wave-1"]!;
}

function getLocalizedTeam4OpsPacketDetails(locale: Locale): Team4OpsPacketDetails {
  return locale === "vi" ? team4OpsPacketDetailsVi : team4OpsPacketDetailsEn;
}

function getLocalizedTeam4ExecutionProgress(locale: Locale): Team4ExecutionProgress {
  return locale === "vi" ? team4ExecutionProgressVi : team4ExecutionProgressEn;
}

function getLocalizedWaveLabel(waveId: string, fallback: string, locale: Locale): string {
  if (locale === "en") return fallback;
  if (waveId === "wave-1") return "Đợt 1";
  if (waveId === "wave-2") return "Đợt 2";
  return fallback;
}

function getLocalizedOpsToken(token: string, locale: Locale, dictionary: Record<Locale, Record<string, string>>): string {
  return dictionary[locale][token] ?? token;
}

function productCard(product: ProductDefinition, buyerId: string, locale: Locale): string {
  const note = getLocalizedCopyNotes(product, locale);
  const localizedProduct = getLocalizedProduct(product, locale);
  return `
    <article class="product-card">
      <img src="${getProductImageUrl(product.productCode)}" alt="${escapeHtml(localizedProduct.name)}" />
      <div class="product-card-body">
        <div class="meta-line">
          ${pill(localizedProduct.tierLabel)}
          ${pill(note.theme)}
          <span class="price">${formatUsd(product.priceUsd)}</span>
        </div>
        <h3>${escapeHtml(localizedProduct.name)}</h3>
        <p>${escapeHtml(localizedProduct.positioning)}</p>
        <div class="product-meta">
          <span>${escapeHtml(localizedProduct.defaultLicenseLabel)}</span>
          <span>${escapeHtml(localizedProduct.updateWindowLabel)}</span>
        </div>
        <div class="cta-row">
          <a class="cta-link" href="${product.route}?buyer=${encodeURIComponent(buyerId)}">${escapeHtml(localizedProduct.primaryCta)}</a>
          <a class="mini-link" href="/checkout?buyer=${encodeURIComponent(buyerId)}&product=${product.productCode}">${locale === "vi" ? "Thanh toán" : "Checkout"}</a>
        </div>
      </div>
    </article>
  `;
}

function renderLanguageSwitcher(locale: Locale, currentPath: string): string {
  const current = localeMeta[locale];
  const alternatives = supportedLocales.filter((entry) => entry !== locale);

  return `
    <details class="lang-switcher">
      <summary>
        <span class="lang-flag" aria-hidden="true">${current.flag}</span>
        <span>${escapeHtml(current.nativeLabel)}</span>
        <span class="lang-caret" aria-hidden="true">▾</span>
      </summary>
      <div class="lang-menu">
        ${alternatives
          .map((entry) => {
            const meta = localeMeta[entry];
            return `<a href="${buildLocalePath(entry, currentPath)}"><span class="lang-flag" aria-hidden="true">${meta.flag}</span><span>${escapeHtml(meta.nativeLabel)}</span></a>`;
          })
          .join("")}
      </div>
    </details>
  `;
}

function nav(active: string, buyerId: string, locale: Locale, currentPath: string): string {
  const labels =
    locale === "vi"
      ? {
          products: "Sản phẩm",
          documents: "Tài liệu",
          programs: "Chương trình",
          licenses: "Giấy phép",
          library: "Thư viện",
          operations: "Vận hành"
        }
      : {
          products: "Products",
          documents: "Documents",
          programs: "Programs",
          licenses: "Licenses",
          library: "Library",
          operations: "Operations"
        };
  const links = [
    ["/products", labels.products],
    ["/documents", labels.documents],
    ["/programs", labels.programs],
    ["/licenses", labels.licenses],
    [`/library?buyer=${buyerId}`, labels.library],
    ["/operations", labels.operations]
  ];

  return `
    <header class="site-header">
      <a class="brand" href="/products">${brandLabel}</a>
      <nav>
        ${links
          .map(([href, label]) => {
            const current = active === href || (active === "/library" && label === labels.library);
            return `<a href="${href}"${current ? ' aria-current="page"' : ""}>${label}</a>`;
          })
          .join("")}
      </nav>
      ${renderLanguageSwitcher(locale, currentPath)}
    </header>
  `;
}

function layout({
  title,
  active,
  body,
  buyerId,
  canonicalPath,
  locale,
  description,
  noindex = false
}: {
  title: string;
  active: string;
  body: string;
  buyerId: string;
  canonicalPath: string;
  locale: Locale;
  description: string;
  noindex?: boolean;
}): string {
  const canonical = canonicalUrl(locale, canonicalPath);
  const socialImage = "https://picsum.photos/seed/noos-commerce-og/1200/630";
  const localizedNav = localizeMarkup(nav(active, buyerId, locale, canonicalPath), locale);
  const localizedBody = localizeMarkup(body, locale);
  const alternateLinks = noindex
    ? ""
    : supportedLocales
        .map(
          (entry) =>
            `<link rel="alternate" hreflang="${localeMeta[entry].htmlLang}" href="${canonicalUrl(entry, canonicalPath)}" />`
        )
        .join("") + `<link rel="alternate" hreflang="x-default" href="${canonicalUrl(defaultLocale, canonicalPath)}" />`;

  return `<!doctype html>
<html lang="${localeMeta[locale].htmlLang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(pageTitle(title))}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    ${noindex ? '<meta name="robots" content="noindex,nofollow" />' : ""}
    ${noindex ? "" : `<link rel="canonical" href="${escapeHtml(canonical)}" />`}
    ${alternateLinks}
    <meta property="og:site_name" content="NOOS" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(pageTitle(title))}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:locale" content="${escapeHtml(localeMeta[locale].htmlLang)}" />
    <meta property="og:image" content="${socialImage}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(pageTitle(title))}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${socialImage}" />
    <style>
      :root {
        color-scheme: light;
        --bg: #eef2f3;
        --ink: #111716;
        --muted: #56615f;
        --line: rgba(17, 23, 22, 0.14);
        --panel: rgba(255, 255, 255, 0.92);
        --accent: #0f7c74;
        --accent-2: #c85d3a;
        --accent-3: #8e3b6f;
        --danger: #7c2d18;
      }

      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: var(--bg);
        color: var(--ink);
        line-height: 1.5;
      }

      a { color: inherit; text-decoration: none; }

      img {
        display: block;
        width: 100%;
        height: auto;
      }

      .site-header {
        position: sticky;
        top: 0;
        z-index: 10;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 18px 24px;
        background: rgba(238, 242, 243, 0.92);
        backdrop-filter: blur(14px);
        border-bottom: 1px solid var(--line);
      }

      .brand {
        font-size: 20px;
        font-weight: 700;
      }

      nav {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
      }

      nav a {
        font-size: 14px;
        color: var(--muted);
      }

      nav a[aria-current="page"] {
        color: var(--ink);
        font-weight: 600;
      }

      .lang-switcher {
        position: relative;
      }

      .lang-switcher summary {
        list-style: none;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 42px;
        padding: 0 12px;
        border-radius: 6px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.72);
        cursor: pointer;
      }

      .lang-switcher summary::-webkit-details-marker {
        display: none;
      }

      .lang-menu {
        position: absolute;
        right: 0;
        top: calc(100% + 8px);
        min-width: 170px;
        padding: 8px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.98);
        box-shadow: 0 12px 28px rgba(17, 23, 22, 0.12);
      }

      .lang-menu a {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 40px;
        padding: 0 10px;
        border-radius: 6px;
      }

      .lang-menu a:hover {
        background: rgba(15, 124, 116, 0.08);
      }

      .lang-flag {
        font-size: 18px;
      }

      .lang-caret {
        font-size: 12px;
        color: var(--muted);
      }

      .hero {
        min-height: calc(100svh - 66px);
        display: grid;
        align-items: end;
        padding: 32px 24px 28px;
        background:
          linear-gradient(180deg, rgba(11, 15, 15, 0.14), rgba(11, 15, 15, 0.78)),
          var(--hero-image) center/cover no-repeat;
        color: #f7fbfa;
      }

      .hero-inner,
      .content-inner,
      .footer-inner {
        width: min(1120px, 100%);
        margin: 0 auto;
      }

      .hero-inner {
        display: grid;
        gap: 14px;
      }

      .hero-kicker,
      .section-kicker {
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        opacity: 0.86;
      }

      h1 {
        margin: 0;
        font-size: 46px;
        line-height: 1.05;
        max-width: 11ch;
      }

      h2 {
        margin: 0 0 18px;
        font-size: 28px;
        line-height: 1.1;
      }

      h3 {
        margin: 0;
        font-size: 22px;
        line-height: 1.15;
      }

      p {
        margin: 0;
        color: var(--muted);
        max-width: 72ch;
      }

      .hero-copy {
        max-width: 54ch;
        color: rgba(247, 251, 250, 0.88);
      }

      .hero-actions,
      .meta-line,
      .product-meta,
      .trust-row,
      .cta-row,
      .actions,
      .collection-links,
      .role-links {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
      }

      .trust-row {
        gap: 18px;
        font-size: 14px;
        color: rgba(247, 251, 250, 0.86);
      }

      .button,
      .secondary-button,
      .cta-link,
      .mini-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 42px;
        padding: 0 16px;
        border-radius: 6px;
        border: 1px solid transparent;
        font-weight: 600;
      }

      .button,
      .cta-link {
        background: var(--ink);
        color: #f7fbfa;
      }

      .secondary-button,
      .mini-link {
        border-color: var(--line);
        background: rgba(255, 255, 255, 0.08);
        color: inherit;
      }

      .content-band {
        padding: 40px 24px;
      }

      .catalog-grid,
      .tier-grid,
      .license-grid,
      .related-grid,
      .faq-grid,
      .ops-grid,
      .summary-grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      }

      .product-card,
      .tier-card,
      .license-card,
      .related-card,
      .faq-card,
      .ops-card,
      .summary-card {
        overflow: hidden;
        border-radius: 6px;
        background: var(--panel);
        border: 1px solid var(--line);
      }

      .product-card img,
      .related-card img {
        aspect-ratio: 16 / 10;
        object-fit: cover;
      }

      .product-card-body,
      .tier-body,
      .license-body,
      .related-body,
      .faq-body,
      .ops-body,
      .summary-body {
        display: grid;
        gap: 12px;
        padding: 18px;
      }

      .price {
        font-weight: 700;
        color: var(--ink);
      }

      .pill {
        display: inline-flex;
        align-items: center;
        min-height: 30px;
        padding: 0 10px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.6);
        font-size: 13px;
        color: var(--muted);
      }

      .content-band:nth-of-type(even) {
        background: rgba(255, 255, 255, 0.5);
      }

      .two-column {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      }

      .callout,
      .update-row,
      .library-item,
      .timeline-row,
      .boundary-card,
      .account-card {
        border-radius: 6px;
        border: 1px solid var(--line);
        background: var(--panel);
      }

      .callout-body,
      .update-body,
      .library-body,
      .timeline-body,
      .boundary-body,
      .account-body {
        display: grid;
        gap: 12px;
        padding: 18px;
      }

      .feature-list,
      .summary-list,
      .ops-list {
        margin: 0;
        padding-left: 20px;
        display: grid;
        gap: 10px;
      }

      .library-item,
      .update-row {
        display: grid;
        gap: 16px;
        align-items: center;
        grid-template-columns: minmax(0, 1fr) auto;
      }

      .status {
        display: inline-flex;
        align-items: center;
        min-height: 30px;
        padding: 0 10px;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 600;
      }

      .status.current,
      .status.update_available {
        background: rgba(15, 124, 116, 0.14);
        color: var(--accent);
      }

      .status.window_expired {
        background: rgba(200, 93, 58, 0.14);
        color: var(--accent-2);
      }

      .status.upgraded {
        background: rgba(142, 59, 111, 0.14);
        color: var(--accent-3);
      }

      .boundary-card {
        border-color: rgba(124, 45, 24, 0.2);
      }

      .boundary-note {
        color: var(--danger);
        font-weight: 600;
      }

      .form-grid {
        display: grid;
        gap: 14px;
      }

      label {
        display: grid;
        gap: 6px;
        font-weight: 600;
        color: var(--ink);
      }

      input,
      select {
        min-height: 44px;
        padding: 0 12px;
        border-radius: 6px;
        border: 1px solid var(--line);
        background: white;
        color: var(--ink);
        font: inherit;
      }

      .footer {
        padding: 28px 24px 40px;
        border-top: 1px solid var(--line);
      }

      .footer-inner {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 14px;
        color: var(--muted);
        font-size: 14px;
      }

      @media (max-width: 860px) {
        h1 { font-size: 36px; max-width: 12ch; }
        h2 { font-size: 24px; }
        .library-item,
        .update-row { grid-template-columns: 1fr; }
      }

      @media (max-width: 600px) {
        .site-header { padding: 14px 16px; }
        .hero,
        .content-band,
        .footer { padding-left: 16px; padding-right: 16px; }
        h1 { font-size: 30px; max-width: none; }
        nav { gap: 10px; }
      }
    </style>
  </head>
  <body>
    ${localizedNav}
    ${localizedBody}
    <footer class="footer">
      <div class="footer-inner">
        <span>${locale === "vi" ? "Bề mặt commerce NOOS song ngữ" : "NOOS multilingual commerce surface"}</span>
        <span>${locale === "vi" ? "Khóa ranh giới để không trôi sang investor và fundraising" : "Boundary-locked against investor and fundraising drift"}</span>
      </div>
    </footer>
  </body>
</html>`;
}

function filterProducts(products: ProductDefinition[], collection: CollectionKey): ProductDefinition[] {
  if (collection === "documents") {
    return products.filter((product) => ["Entry", "Entry/Core", "Core", "Master"].includes(product.tier));
  }
  if (collection === "programs") {
    return products.filter((product) => product.tier === "Advanced Program");
  }
  return products;
}

function prioritizeProductsForRole(products: ProductDefinition[], role: BuyerRole): ProductDefinition[] {
  const profile = getLocalizedRoleProfile(role, defaultLocale);
  const order = new Map(profile.recommendedProductCodes.map((code, index) => [code, index]));
  return [...products].sort((left, right) => {
    const leftOrder = order.get(left.productCode);
    const rightOrder = order.get(right.productCode);
    if (leftOrder !== undefined && rightOrder !== undefined) return leftOrder - rightOrder;
    if (leftOrder !== undefined) return -1;
    if (rightOrder !== undefined) return 1;
    return left.productCode.localeCompare(right.productCode);
  });
}

function renderRoleLinks(basePath: string, buyerId: string, activeRole: BuyerRole, locale: Locale): string {
  return `<div class="role-links">${getLocalizedRoleProfiles(locale)
    .map((profile) => {
      const href = `${basePath}?buyer=${encodeURIComponent(buyerId)}&role=${profile.role}`;
      return profile.role === activeRole
        ? `<span class="pill">${escapeHtml(profile.label)}</span>`
        : `<a class="secondary-button" href="${href}">${escapeHtml(profile.label)}</a>`;
    })
    .join("")}</div>`;
}

function renderComparisonCards(products: ProductDefinition[], locale: Locale): string {
  return `<div class="summary-grid">${products
    .slice(0, 5)
    .map(
      (product) => {
        const localizedProduct = getLocalizedProduct(product, locale);
        return `
        <article class="summary-card">
          <div class="summary-body">
            <div class="meta-line">
              ${pill(product.productCode)}
              ${pill(localizedProduct.tierLabel)}
            </div>
            <h3>${escapeHtml(localizedProduct.name)}</h3>
            <p>${escapeHtml(localizedProduct.positioning)}</p>
            <p>${formatUsd(product.priceUsd)} · ${escapeHtml(localizedProduct.defaultLicenseLabel)} · ${escapeHtml(localizedProduct.updateWindowLabel)}</p>
          </div>
        </article>
      `;
      }
    )
    .join("")}</div>`;
}

function renderRelatedProducts(product: ProductDefinition, buyerId: string, locale: Locale): string {
  const related = loadRelatedProducts(product);
  if (related.length === 0) {
    return `<p>${locale === "vi" ? "Chưa có sản phẩm liên quan nào được map." : "No related products are mapped yet."}</p>`;
  }

  return `<div class="related-grid">${related
    .map(
      (item) => {
        const localizedProduct = getLocalizedProduct(item, locale);
        return `
        <article class="related-card">
          <img src="${getProductImageUrl(item.productCode)}" alt="${escapeHtml(localizedProduct.name)}" />
          <div class="related-body">
            <div class="meta-line">
              ${pill(localizedProduct.tierLabel)}
              <span class="price">${formatUsd(item.priceUsd)}</span>
            </div>
            <h3>${escapeHtml(localizedProduct.name)}</h3>
            <p>${escapeHtml(localizedProduct.positioning)}</p>
            <div class="cta-row">
              <a class="cta-link" href="${item.route}?buyer=${encodeURIComponent(buyerId)}">${escapeHtml(localizedProduct.primaryCta)}</a>
              <a class="mini-link" href="/checkout?buyer=${encodeURIComponent(buyerId)}&product=${item.productCode}">${locale === "vi" ? "Thanh toán" : "Checkout"}</a>
            </div>
          </div>
        </article>
      `;
      }
    )
    .join("")}</div>`;
}

function loadRelatedProducts(product: ProductDefinition): ProductDefinition[] {
  return getRelatedProducts(product.productCode);
}

function renderProductTemplateComparison(product: ProductDefinition, locale: Locale): string {
  const related = loadRelatedProducts(product);
  const localizedCurrent = getLocalizedProduct(product, locale);
  const current = `
    <article class="summary-card">
      <div class="summary-body">
        ${pill(locale === "vi" ? "Lựa chọn hiện tại" : "Current choice")}
        <h3>${escapeHtml(localizedCurrent.name)}</h3>
        <p>${formatUsd(product.priceUsd)} · ${escapeHtml(localizedCurrent.defaultLicenseLabel)} · ${escapeHtml(localizedCurrent.updateWindowLabel)}</p>
      </div>
    </article>
  `;
  const relatedCards = related
    .slice(0, 2)
    .map(
      (item) => {
        const localizedProduct = getLocalizedProduct(item, locale);
        return `
        <article class="summary-card">
          <div class="summary-body">
            ${pill(locale === "vi" ? "Bước kế tiếp" : "Next step")}
            <h3>${escapeHtml(localizedProduct.name)}</h3>
            <p>${formatUsd(item.priceUsd)} · ${escapeHtml(localizedProduct.defaultLicenseLabel)} · ${escapeHtml(localizedProduct.updateWindowLabel)}</p>
          </div>
        </article>
      `;
      }
    )
    .join("");
  return `<div class="summary-grid">${current}${relatedCards}</div>`;
}

function renderLibraryItem(item: LibraryItem, buyerId: string, locale: Locale): string {
  const product = getProductByCode(item.productCode);
  const slug = product ? getDocumentsSlug(product) : "";
  const localizedProduct = product ? getLocalizedProduct(product, locale) : undefined;

  return `
    <article class="library-item">
      <div class="library-body">
        <div class="meta-line">
          ${pill(item.productCode)}
          <span class="status ${item.updateStatus}">${escapeHtml(getLocalizedStatusLabel(item.updateStatus, locale))}</span>
        </div>
        <h3>${escapeHtml(localizedProduct?.name ?? item.name)}</h3>
        <p>${escapeHtml(getLocalizedLicenseLabel(item.licenseType, locale))} · ${escapeHtml(item.currentVersion)} · ${escapeHtml(formatDate(item.purchasedDate, locale))}</p>
      </div>
      <div class="actions">
        <a class="button" href="/library/product/${slug}?buyer=${encodeURIComponent(buyerId)}">${locale === "vi" ? "Xem" : "View"}</a>
        <a class="secondary-button" href="/library/updates?buyer=${encodeURIComponent(buyerId)}">${locale === "vi" ? "Cập nhật" : "Updates"}</a>
      </div>
    </article>
  `;
}

function renderLaunchWaves(operations: Team4OperationsContract, buyerId: string, locale: Locale): string {
  return `<div class="ops-grid">${operations.launchWaves
    .map(
      (wave) => {
        const detail = getLocalizedTeam4WaveDetail(wave.waveId, locale) ?? {
          status: locale === "vi" ? "ĐANG CHẠY" : "ACTIVE",
          summary:
            locale === "vi"
              ? "Bám thứ tự launch đã khóa và không mở traffic quá sớm."
              : "Follow the locked launch order without widening traffic too early.",
          exitRule: locale === "vi" ? "Chỉ được tiến lên sau khi launch gates giữ xanh ổn định." : "Advance only after launch gates stay green."
        };
        const productLinks = wave.productCodes
          .map((productCode) => {
            const product = getProductByCode(productCode);
            if (!product) return escapeHtml(productCode);
            return `<a class="mini-link" href="${product.route}?buyer=${encodeURIComponent(buyerId)}">${escapeHtml(productCode)}</a>`;
          })
          .join("");

        return `
        <article class="ops-card">
          <div class="ops-body">
            <div class="meta-line">
              ${pill(wave.waveId)}
              ${pill(detail.status)}
            </div>
            <h3>${escapeHtml(getLocalizedWaveLabel(wave.waveId, wave.label, locale))}</h3>
            <p>${escapeHtml(detail.summary)}</p>
            <div class="product-meta">${productLinks}</div>
            <ul class="ops-list">
              <li>${escapeHtml(wave.productCodes.join(" · "))}</li>
              <li>${escapeHtml(detail.exitRule)}</li>
            </ul>
            <a class="mini-link" href="/products?buyer=${encodeURIComponent(buyerId)}">${locale === "vi" ? "Mở catalog" : "Open catalog"}</a>
          </div>
        </article>
      `;
      }
    )
    .join("")}</div>`;
}

function redirectResponse(location: string, buyerId: string, locale: Locale): RouteResponse {
  const localizedLocation = buildLocalePath(locale, location);
  const body = `
    <main>
      <section class="hero" style="--hero-image: url('https://picsum.photos/seed/noos-boundary/1600/900')">
        <div class="hero-inner">
          <div class="hero-kicker">${locale === "vi" ? "Khóa ranh giới" : "Boundary enforcement"}</div>
          <h1>${locale === "vi" ? "Các route investor cũ không thuộc phạm vi NOOS." : "Legacy investor routes do not belong inside NOOS."}</h1>
          <p class="hero-copy">${locale === "vi" ? "Route này được chuyển hướng vĩnh viễn sang bề mặt commerce và kiến trúc NOOS đang hoạt động." : "This route is permanently redirected to the active NOOS commerce and architecture surface."}</p>
          <div class="hero-actions">
            <a class="button" href="${localizedLocation}">${locale === "vi" ? "Tiếp tục" : "Continue"}</a>
            <a class="secondary-button" href="/products?buyer=${encodeURIComponent(buyerId)}">${locale === "vi" ? "Mở catalog" : "Open catalog"}</a>
          </div>
        </div>
      </section>
    </main>
  `;

  return {
    status: 308,
    contentType: "text/html; charset=utf-8",
    headers: {
      location: localizedLocation,
      "x-robots-tag": "noindex, nofollow"
    },
    body: layout({
      title: locale === "vi" ? "Chuyển hướng ranh giới" : "Boundary Redirect",
      active: "/products",
      body,
      buyerId,
      canonicalPath: location,
      locale,
      description:
        locale === "vi"
          ? "Các route ngoài phạm vi NOOS được chuyển về bề mặt commerce đang hoạt động để giữ chuẩn kiến trúc và SEO."
          : "Boundary routes outside the active NOOS surface are redirected back into the commerce experience to protect architecture and SEO.",
      noindex: true
    })
  };
}

function matchesLegacyBoundaryRoute(pathname: string): string | null {
  for (const entry of legacyBoundaryRoutes) {
    if (entry.test.test(pathname)) {
      return entry.target;
    }
  }

  const blockedSegments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.toLowerCase());

  if (
    blockedSegments.some((segment) =>
      [
        "investor",
        "investors",
        "investment-programs",
        "investor-packages",
        "fundraising",
        "fundraising-catalog",
        "execution-fund"
      ].includes(segment)
    )
  ) {
    return blockedSegments.includes("docs") ? "/documents" : "/products";
  }

  return null;
}

async function renderCatalogPage(collection: CollectionKey, buyerId: string, role: BuyerRole, locale: Locale): Promise<RouteResponse> {
  const catalog = await loadCatalogAsync();
  const pricing = await loadPricingAsync();
  const team3Surface = await loadTeam3SurfaceAsync();
  const operations = await loadTeam4OperationsAsync();
  const titles = {
    all: locale === "vi" ? "Sản phẩm NOOS" : "NOOS Products",
    documents: locale === "vi" ? "Tài liệu NOOS" : "NOOS Documents",
    programs: locale === "vi" ? "Chương trình NOOS" : "NOOS Programs"
  } as const;
  const roleProfile = getLocalizedRoleProfile(role, locale);
  const products = prioritizeProductsForRole(filterProducts(catalog.products, collection), role);
  const descriptions = {
    all: roleProfile.heroLine,
    documents:
      locale === "vi"
        ? "Các tài liệu nền tảng, kiến trúc, governance, trust, Việt Nam và bundle chủ lực trong một bề mặt đã khóa."
        : "Foundation, architecture, governance, trust, Vietnam, and flagship document products in one locked surface.",
    programs:
      locale === "vi"
        ? "Các chương trình NOOS nâng cao cho Grid, Orbit và Bios, được trình bày như các bề mặt build-ready sâu hơn."
        : "Advanced NOOS programs for Grid, Orbit, and Bios, framed as deeper build-ready program surfaces."
  } as const;

  const body = `
    <main>
      <section class="hero" style="--hero-image: url('${getCollectionHeroImage(collection)}')">
        <div class="hero-inner">
          <div class="hero-kicker">${locale === "vi" ? "Bề mặt Commerce NOOS" : "NOOS Commerce Surface"}</div>
          <h1>${escapeHtml(titles[collection])}</h1>
          <p class="hero-copy">${escapeHtml(descriptions[collection])}</p>
          <div class="hero-actions">
            <a class="button" href="/products?buyer=${encodeURIComponent(buyerId)}&role=${role}">${locale === "vi" ? "Mở catalog đầy đủ" : "Open full catalog"}</a>
            <a class="secondary-button" href="/library?buyer=${encodeURIComponent(buyerId)}&role=${role}">${locale === "vi" ? "Mở thư viện người mua" : "Open buyer library"}</a>
          </div>
          <div class="trust-row">
            <span>${locale === "vi" ? "Khóa product truth" : "Locked product truth"}</span>
            <span>${locale === "vi" ? "Hiển thị license" : "License visible"}</span>
            <span>${locale === "vi" ? "Bàn giao thư viện ngay" : "Immediate library handoff"}</span>
          </div>
        </div>
      </section>
      ${section(
        locale === "vi" ? "Duyệt theo route" : "Browse by route",
        `
          <div class="collection-links">
            <a class="button" href="/products?buyer=${encodeURIComponent(buyerId)}&role=${role}">${locale === "vi" ? "Tất cả sản phẩm" : "All products"}</a>
            <a class="secondary-button" href="/documents?buyer=${encodeURIComponent(buyerId)}&role=${role}">${locale === "vi" ? "Tài liệu" : "Documents"}</a>
            <a class="secondary-button" href="/programs?buyer=${encodeURIComponent(buyerId)}&role=${role}">${locale === "vi" ? "Chương trình" : "Programs"}</a>
            <a class="secondary-button" href="/licenses?buyer=${encodeURIComponent(buyerId)}&role=${role}">${locale === "vi" ? "Giấy phép" : "Licenses"}</a>
          </div>
          ${renderRoleLinks(collection === "all" ? "/products" : `/${collection}`, buyerId, role, locale)}
        `,
        locale === "vi" ? "Bộ sưu tập" : "Collections"
      )}
      ${section(
        titles[collection],
        `<div class="catalog-grid">${products.map((product) => productCard(product, buyerId, locale)).join("")}</div>`,
        locale === "vi" ? "Catalog" : "Catalog"
      )}
      ${section(
        locale === "vi" ? "Khối so sánh" : "Comparison blocks",
        `${renderComparisonCards(products, locale)}
         <div class="boundary-card"><div class="boundary-body"><h3>${locale === "vi" ? "UI states đã khóa" : "Locked UI states"}</h3><p>${escapeHtml(team3Surface.uiStates.join(" · "))}</p></div></div>`,
        locale === "vi" ? "Team 3" : "Team 3"
      )}
      ${section(
        locale === "vi" ? "Thang bậc sản phẩm" : "Tier ladder",
        `<div class="tier-grid">${getLocalizedTierSummary(locale)
          .map(
            (item) => `
              <article class="tier-card">
                <div class="tier-body">
                  <h3>${escapeHtml(item.tier)}</h3>
                  <p>${escapeHtml(item.line)}</p>
                  <p>${escapeHtml(
                    pricing.priceTiers.find((tier) => tier.tier === item.sourceTier)?.minPriceUsd !== undefined
                      ? `${formatUsd(pricing.priceTiers.find((tier) => tier.tier === item.sourceTier)!.minPriceUsd)} ${locale === "vi" ? "đến" : "to"} ${formatUsd(pricing.priceTiers.find((tier) => tier.tier === item.sourceTier)!.maxPriceUsd)}`
                      : locale === "vi"
                      ? "Giá theo contract"
                      : "Contract-defined pricing"
                  )}</p>
                </div>
              </article>
            `
          )
          .join("")}</div>`,
        locale === "vi" ? "Thang" : "Ladder"
      )}
      ${collection === "all"
        ? section(locale === "vi" ? "Các đợt ra mắt" : "Launch waves", renderLaunchWaves(operations, buyerId, locale), "Team 4")
        : ""}
    </main>
  `;

  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    body: layout({
      title: titles[collection],
      active: collection === "all" ? "/products" : `/${collection}`,
      body,
      buyerId,
      canonicalPath: collection === "all" ? "/products" : `/${collection}`,
      locale,
      description: descriptions[collection]
    })
  };
}

async function renderLicensePage(buyerId: string, locale: Locale): Promise<RouteResponse> {
  const pricing = await loadPricingAsync();
  const body = `
    <main>
      <section class="hero" style="--hero-image: url('https://picsum.photos/seed/noos-licenses/1600/900')">
        <div class="hero-inner">
          <div class="hero-kicker">${locale === "vi" ? "Giấy phép và đường nâng cấp" : "Licenses and upgrade paths"}</div>
          <h1>${locale === "vi" ? "Quyền sử dụng phải hiện rõ trước khi thanh toán." : "Use rights stay visible before checkout."}</h1>
          <p class="hero-copy">${locale === "vi" ? "Mọi bề mặt trong bản build này đều giữ giá, license mặc định, cửa sổ cập nhật và đường nâng cấp hiển thị trước khi người mua quyết định." : "Every surface in this build keeps price, default license, update window, and upgrade path visible before the buyer commits."}</p>
          <div class="hero-actions">
            <a class="button" href="/products?buyer=${encodeURIComponent(buyerId)}">${locale === "vi" ? "Xem sản phẩm" : "Browse products"}</a>
            <a class="secondary-button" href="/library?buyer=${encodeURIComponent(buyerId)}">${locale === "vi" ? "Mở thư viện demo" : "Open library demo"}</a>
          </div>
        </div>
      </section>
      ${section(
        locale === "vi" ? "Mô hình license" : "License model",
        `<div class="license-grid">${pricing.licensePolicies
          .map(
            (policy) => `
              <article class="license-card">
                <div class="license-body">
                  <h3>${escapeHtml(getLocalizedLicenseLabel(policy.licenseType, locale))}</h3>
                  <p>${locale === "vi" ? "Số ghế" : "Seats"} ${policy.minSeats}–${policy.maxSeats}</p>
                  <p>${policy.allowsExternalSharing ? (locale === "vi" ? "Cho phép chia sẻ ra ngoài" : "External sharing allowed") : (locale === "vi" ? "Không cho phép chia sẻ ra ngoài" : "No external sharing")}</p>
                </div>
              </article>
            `
          )
          .join("")}</div>`,
        locale === "vi" ? "Loại license" : "License types"
      )}
      ${section(
        locale === "vi" ? "Cửa sổ credit nâng cấp" : "Upgrade credit windows",
        `<div class="license-grid">${pricing.upgradeCreditPolicies
          .map(
            (policy) => `
              <article class="license-card">
                <div class="license-body">
                  <h3>${escapeHtml(locale === "vi" ? `${policy.fromTier} sang ${policy.toTier}` : `${policy.fromTier} to ${policy.toTier}`)}</h3>
                  <p>${policy.creditPercent}% ${locale === "vi" ? `credit trong ${policy.windowDays} ngày.` : `credit within ${policy.windowDays} days.`}</p>
                  <p>${policy.creditCapUsd ? (locale === "vi" ? `Trần ${formatUsd(policy.creditCapUsd)}.` : `Cap ${formatUsd(policy.creditCapUsd)}.`) : locale === "vi" ? "Chỉ áp dụng trên đường nâng cấp đã map." : "Mapped path only."}</p>
                </div>
              </article>
            `
          )
          .join("")}</div>`,
        locale === "vi" ? "Đường nâng cấp" : "Upgrade paths"
      )}
      ${section(
        locale === "vi" ? "Thang giá" : "Pricing ladder",
        `<div class="license-grid">${pricing.priceTiers
          .map(
            (tier) => `
              <article class="license-card">
                <div class="license-body">
                  <h3>${escapeHtml(getLocalizedTierLabel(tier.tier, locale))}</h3>
                  <p>${formatUsd(tier.minPriceUsd)} ${locale === "vi" ? "đến" : "to"} ${formatUsd(tier.maxPriceUsd)}</p>
                </div>
              </article>
            `
          )
          .join("")}</div>`,
        locale === "vi" ? "Các bậc" : "Tiers"
      )}
      ${section(
        locale === "vi" ? "Điều khoản" : "Terms",
        `<div class="callout"><div class="callout-body"><h3>${locale === "vi" ? "Mức hiển thị tối thiểu" : "Display minimum"}</h3><p>${locale === "vi" ? "Điều khoản sản phẩm số, điều khoản license và ghi chú thuế theo khu vực phải hiển thị trước khi thanh toán." : "Digital product terms, license terms, and jurisdiction-aware tax note stay visible before payment."}</p></div></div>`,
        locale === "vi" ? "Pháp lý" : "Legal"
      )}
    </main>
  `;

  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    body: layout({
      title: locale === "vi" ? "Giấy phép" : "Licenses",
      active: "/licenses",
      body,
      buyerId,
      canonicalPath: "/licenses",
      locale,
      description:
        locale === "vi"
          ? "Trang giấy phép song ngữ của NOOS hiển thị license, cửa sổ nâng cấp và thang giá trước khi người mua thanh toán."
          : "NOOS bilingual license page showing license types, upgrade windows, and the pricing ladder before payment."
    })
  };
}

async function renderProductDetailPage(product: ProductDefinition, buyerId: string, locale: Locale): Promise<RouteResponse> {
  const localizedProduct = getLocalizedProduct(product, locale);
  const notes = getLocalizedCopyNotes(product, locale);
  const supportFaq = getLocalizedSupportFaq(locale);
  const faqItems = [...notes.faq, ...supportFaq].slice(0, 6);

  const body = `
    <main>
      <section class="hero" style="--hero-image: url('${getProductImageUrl(product.productCode)}')">
        <div class="hero-inner">
          <div class="hero-kicker">${escapeHtml(notes.theme)} / ${escapeHtml(localizedProduct.tierLabel)}</div>
          <h1>${escapeHtml(localizedProduct.name)}</h1>
          <p class="hero-copy">${escapeHtml(localizedProduct.positioning)}</p>
          <div class="meta-line">
            ${pill(localizedProduct.defaultLicenseLabel)}
            ${pill(localizedProduct.updateWindowLabel)}
            <span class="price">${formatUsd(product.priceUsd)}</span>
          </div>
          <div class="hero-actions">
            <a class="button" href="/checkout?buyer=${encodeURIComponent(buyerId)}&product=${product.productCode}">${escapeHtml(localizedProduct.primaryCta)}</a>
            <a class="secondary-button" href="/library?buyer=${encodeURIComponent(buyerId)}">${locale === "vi" ? "Mở thư viện demo" : "Open library demo"}</a>
          </div>
          <div class="trust-row">
            <span>${locale === "vi" ? "Giao ngay" : "Immediate delivery"}</span>
            <span>${locale === "vi" ? "Version hóa trong thư viện" : "Versioned in library"}</span>
            <span>${locale === "vi" ? "Đường nâng cấp đã map" : "Mapped upgrade path"}</span>
          </div>
        </div>
      </section>
      ${section(
        locale === "vi" ? "Định vị sản phẩm" : "Product Positioning",
        `<p>${escapeHtml(localizedProduct.positioning)} ${escapeHtml(locale === "vi" ? "Trang này giữ sản phẩm, license, delivery và đường nâng cấp trong cùng một bề mặt để Team 3 có thể ship mà không phải tự diễn giải truth layer." : "This page keeps product, license, delivery, and upgrade path in one surface so Team 3 can ship without improvising the truth layer.")}</p>`,
        "1"
      )}
      ${section(
        locale === "vi" ? "Dành cho ai" : "Who It Is For",
        `<ul class="feature-list">${localizedProduct.audience.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`,
        "2"
      )}
      ${section(
        locale === "vi" ? "Giải quyết vấn đề gì" : "What Problems It Solves",
        `<ul class="feature-list">${notes.problems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`,
        "3"
      )}
      ${section(
        locale === "vi" ? "Bao gồm những gì" : "What Is Included",
        `<ul class="feature-list">${localizedProduct.includedItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`,
        "4"
      )}
      ${section(
        locale === "vi" ? "Deliverables và định dạng" : "Deliverables and Format",
        `<div class="two-column">
          <div class="callout"><div class="callout-body"><h3>${locale === "vi" ? "Deliverables" : "Deliverables"}</h3><ul class="feature-list">${localizedProduct.deliverables
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}</ul></div></div>
          <div class="callout"><div class="callout-body"><h3>${locale === "vi" ? "Delivery truth" : "Delivery truth"}</h3><p>${locale === "vi" ? "Quyền truy cập thư viện, version handling và thông báo cập nhật đều bám cùng một đường entitlement." : "Library access, version handling, and update notice all stay attached to the same entitlement path."}</p></div></div>
        </div>`,
        "5"
      )}
      ${section(
        locale === "vi" ? "License và phạm vi dùng" : "License and Usage",
        `<div class="two-column">
          <div class="callout"><div class="callout-body"><h3>${escapeHtml(localizedProduct.defaultLicenseLabel)}</h3><ul class="feature-list"><li>${locale === "vi" ? "License mặc định đã khóa trong pricing truth." : "Default license locked in pricing truth."}</li><li>${locale === "vi" ? "Không cho phép phát tán công khai hay bán lại." : "No public redistribution or resale."}</li><li>${locale === "vi" ? "Đường nâng cấp" : "Upgrade path"}: ${escapeHtml(getLocalizedRelatedLabel(product.updatePolicy.upgradePath, locale))}</li></ul></div></div>
          <div class="callout"><div class="callout-body"><h3>${locale === "vi" ? "Ranh giới sử dụng" : "Usage boundary"}</h3><p>${locale === "vi" ? "Triển khai lớn hơn sẽ chuyển sang nâng cấp đã map hoặc inquiry cho tổ chức. Không có hành vi license ẩn." : "Larger deployment moves to mapped upgrade or organization inquiry. No hidden license behavior."}</p></div></div>
        </div>
        ${product.productCode === "P12" ? renderTeamLicenseComparison(product, buyerId, locale) : ""}`,
        "6"
      )}
      ${section(
        locale === "vi" ? "Phiên bản và cập nhật" : "Version and Updates",
        `<div class="two-column">
          <div class="callout"><div class="callout-body"><h3>${locale === "vi" ? "Phiên bản hiện tại" : "Current version"}</h3><p>${locale === "vi" ? "v1.0 đã khóa cho Team 3 build bề mặt." : "v1.0 locked for Team 3 surface build."}</p></div></div>
          <div class="callout"><div class="callout-body"><h3>${locale === "vi" ? "Cửa sổ cập nhật" : "Update window"}</h3><p>${escapeHtml(localizedProduct.updateWindowLabel)} ${locale === "vi" ? "với" : "with"} ${escapeHtml(localizedProduct.updateTypeLabels.join(", "))} ${locale === "vi" ? "cập nhật." : "updates."}</p></div></div>
        </div>`,
        "7"
      )}
      ${section(
        locale === "vi" ? "Vì sao điều này quan trọng" : "Why This Matters",
        `<p>${escapeHtml(notes.whyItMatters)}</p>`,
        "8"
      )}
      ${section(
        locale === "vi" ? "Sản phẩm liên quan" : "Related Products",
        `${renderRelatedProducts(product, buyerId, locale)}${renderProductTemplateComparison(product, locale)}`,
        "9"
      )}
      ${section(
        "FAQ",
        `<div class="faq-grid">${faqItems
          .map(
            (item) => `
              <article class="faq-card">
                <div class="faq-body">
                  <h3>${escapeHtml(item.question)}</h3>
                  <p>${escapeHtml(item.answer)}</p>
                </div>
              </article>
            `
          )
          .join("")}</div>`,
        "10"
      )}
      ${section(
        locale === "vi" ? "CTA cuối" : "Final CTA",
        `<div class="callout">
          <div class="callout-body">
            <h3>${escapeHtml(localizedProduct.primaryCta)}</h3>
            <p>${formatUsd(product.priceUsd)} · ${escapeHtml(localizedProduct.defaultLicenseLabel)} · ${escapeHtml(localizedProduct.updateWindowLabel)} ${locale === "vi" ? "cửa sổ cập nhật" : "update window"}</p>
            <div class="cta-row">
              <a class="button" href="/checkout?buyer=${encodeURIComponent(buyerId)}&product=${product.productCode}">${escapeHtml(localizedProduct.primaryCta)}</a>
              ${product.productCode === "P12"
                ? `<a class="secondary-button" href="/organization-inquiry?buyer=${encodeURIComponent(buyerId)}&from=${encodeURIComponent(product.productCode)}">${locale === "vi" ? "Mở inquiry cho tổ chức" : "Open organization inquiry"}</a>`
                : ""}
              <a class="secondary-button" href="/products?buyer=${encodeURIComponent(buyerId)}">${locale === "vi" ? "Quay lại catalog" : "Back to catalog"}</a>
            </div>
          </div>
        </div>`,
        "11"
      )}
    </main>
  `;

  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    body: layout({
      title: localizedProduct.name,
      active: product.route,
      body,
      buyerId,
      canonicalPath: product.route,
      locale,
      description: localizedProduct.positioning
    })
  };
}

async function renderLibraryPage(buyerId: string, role: BuyerRole, locale: Locale): Promise<RouteResponse> {
  const library = await loadLibraryAsync(buyerId);
  const roleProfile = getLocalizedRoleProfile(role, locale);
  const emptyRecommendation = roleProfile.recommendedProductCodes[0] ?? "P01";
  const nextPrimary =
    library.items.length === 0
      ? emptyRecommendation
      : library.recommendations.nextProductPrimary || emptyRecommendation;
  const body = `
    <main>
      <section class="hero" style="--hero-image: url('https://picsum.photos/seed/noos-library/1600/900')">
        <div class="hero-inner">
          <div class="hero-kicker">${locale === "vi" ? "Thư viện người mua" : "Buyer library"}</div>
          <h1>${locale === "vi" ? "Mọi giao dịch đều còn truy vết được sau khi thanh toán." : "Every purchase stays addressable after checkout."}</h1>
          <p class="hero-copy">${locale === "vi" ? "Bề mặt thư viện giữ purchase truth, access truth và version truth trong cùng một nơi cho Team 3 và Team 2 tích hợp." : "The library surface keeps purchase truth, access truth, and version truth in one place for Team 3 and Team 2 integration."}</p>
          <div class="hero-actions">
            <a class="button" href="/library/updates?buyer=${encodeURIComponent(buyerId)}&role=${role}">${locale === "vi" ? "Mở cập nhật" : "Open updates"}</a>
            <a class="secondary-button" href="/products?buyer=${encodeURIComponent(buyerId)}&role=${role}">${locale === "vi" ? "Xem sản phẩm" : "Browse products"}</a>
          </div>
        </div>
      </section>
      ${section(
        locale === "vi" ? "Sản phẩm đã mua" : "Purchased products",
        library.items.length
          ? library.items.map((item) => renderLibraryItem(item, buyerId, locale)).join("")
          : `<div class="callout"><div class="callout-body"><h3>${locale === "vi" ? "Chưa có giao dịch nào" : "No purchases yet"}</h3><p>${locale === "vi" ? `Thư viện trống là một trạng thái hạng nhất. Hãy bắt đầu với ${emptyRecommendation} từ góc nhìn vai trò hiện tại rồi quay lại đây sau khi fulfillment xong.` : `Empty library is a first-class state. Start with ${emptyRecommendation} from the active role view and return here after fulfillment.`}</p></div></div>`,
        locale === "vi" ? "Thư viện" : "Library"
      )}
      ${section(
        locale === "vi" ? "Đề xuất kế tiếp" : "Next recommendation",
        `<div class="callout"><div class="callout-body"><h3>${escapeHtml(getLocalizedRelatedLabel(nextPrimary, locale))}</h3><p>${escapeHtml(
          library.items.length === 0
            ? locale === "vi"
              ? `Góc nhìn ${roleProfile.label} đang dẫn đường cho giao dịch đầu tiên.`
              : `Role view ${roleProfile.label} is guiding the first purchase path.`
            : library.recommendations.upgradeLicenseOffer
            ? locale === "vi"
              ? `Ưu đãi nâng cấp: ${getLocalizedRelatedLabel(library.recommendations.upgradeLicenseOffer, locale)}`
              : `Upgrade offer: ${library.recommendations.upgradeLicenseOffer}`
            : locale === "vi"
            ? "Bước kế tiếp đã được map từ thang sản phẩm đã khóa."
            : "Mapped next step from the locked ladder."
        )}</p><div class="cta-row"><a class="button" href="${nextStepHref(nextPrimary, buyerId, locale, library.items.at(-1)?.productCode)}">${locale === "vi" ? "Mở bước kế tiếp" : "Open next step"}</a></div></div></div>`,
        locale === "vi" ? "Gợi ý" : "Recommendations"
      )}
      ${section(
        locale === "vi" ? "Route tài khoản" : "Account routes",
        `<div class="collection-links">
          <a class="secondary-button" href="/library/licenses?buyer=${encodeURIComponent(buyerId)}&role=${role}">${locale === "vi" ? "Giấy phép" : "Licenses"}</a>
          <a class="secondary-button" href="/library/account?buyer=${encodeURIComponent(buyerId)}&role=${role}">${locale === "vi" ? "Tài khoản" : "Account"}</a>
        </div>`,
        locale === "vi" ? "Điều hướng" : "Routes"
      )}
    </main>
  `;

  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    body: layout({
      title: locale === "vi" ? "Thư viện người mua" : "Buyer Library",
      active: "/library",
      body,
      buyerId,
      canonicalPath: "/library",
      locale,
      description:
        locale === "vi"
          ? "Thư viện người mua song ngữ của NOOS giữ purchase truth, access truth và version truth sau khi thanh toán."
          : "NOOS bilingual buyer library keeping purchase truth, access truth, and version truth visible after checkout.",
      noindex: true
    })
  };
}

async function renderLibraryProductPage(slug: string, buyerId: string, locale: Locale): Promise<RouteResponse> {
  const library = await loadLibraryAsync(buyerId);
  const product = await loadProductBySlugAsync(slug);
  if (!product) {
    return renderNotFound(locale === "vi" ? "Không tìm thấy sản phẩm trong thư viện" : "Library product not found", buyerId, locale);
  }

  const item = library.items.find((entry) => entry.productCode === product.productCode);
  if (!item) {
    return renderNotFound(locale === "vi" ? "Người mua này không sở hữu sản phẩm đó" : "This buyer does not own that product", buyerId, locale);
  }
  const localizedProduct = getLocalizedProduct(product, locale);

  const body = `
    <main>
      <section class="hero" style="--hero-image: url('${getProductImageUrl(product.productCode)}')">
        <div class="hero-inner">
          <div class="hero-kicker">${locale === "vi" ? "Chi tiết sản phẩm trong thư viện" : "Library product detail"}</div>
          <h1>${escapeHtml(localizedProduct.name)}</h1>
          <p class="hero-copy">${locale === "vi" ? "Purchase truth, khả năng nhìn thấy phiên bản và đường nâng cấp vẫn hiển thị sau khi thanh toán." : "Purchase truth, version visibility, and upgrade path stay visible after checkout."}</p>
          <div class="meta-line">
            ${pill(getLocalizedLicenseLabel(item.licenseType, locale))}
            <span class="status ${item.updateStatus}">${escapeHtml(getLocalizedStatusLabel(item.updateStatus, locale))}</span>
          </div>
        </div>
      </section>
      ${section(
        locale === "vi" ? "Bản ghi mua hàng" : "Purchase record",
        `<ul class="summary-list">
          <li>${locale === "vi" ? "Ngày mua" : "Purchased date"}: ${escapeHtml(formatDate(item.purchasedDate, locale))}</li>
          <li>${locale === "vi" ? "Phiên bản hiện tại" : "Current version"}: ${escapeHtml(item.currentVersion)}</li>
          <li>${locale === "vi" ? "Trạng thái cập nhật" : "Update status"}: ${escapeHtml(getLocalizedStatusLabel(item.updateStatus, locale))}</li>
        </ul>`,
        locale === "vi" ? "Bản ghi" : "Record"
      )}
      ${section(
        locale === "vi" ? "Tài sản đi kèm" : "Included assets",
        `<ul class="feature-list">${localizedProduct.deliverables.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul>`,
        locale === "vi" ? "Tài sản" : "Assets"
      )}
      ${section(
        locale === "vi" ? "Dòng thời gian phiên bản" : "Version timeline",
        `<div class="timeline-row"><div class="timeline-body"><h3>${escapeHtml(item.currentVersion)}</h3><p>${locale === "vi" ? "Phiên bản hiện tại gắn vào entitlement của bạn. Hành vi cập nhật đi theo cùng trạng thái truy cập trong thư viện." : "Current version attached to your entitlement. Update behavior follows the same access state shown in library."}</p></div></div>`,
        locale === "vi" ? "Phiên bản" : "Version"
      )}
      ${section(
        locale === "vi" ? "Tùy chọn nâng cấp" : "Upgrade options",
        `<div class="callout"><div class="callout-body"><h3>${escapeHtml(getLocalizedRelatedLabel(product.secondaryUpsell, locale))}</h3><p>${locale === "vi" ? "Bước kế tiếp đã được map từ thang sản phẩm đã khóa cho sản phẩm này." : "Mapped next step from the locked ladder for this product."}</p></div></div>`,
        locale === "vi" ? "Nâng cấp" : "Upgrade"
      )}
    </main>
  `;

  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    body: layout({
      title: localizedProduct.name,
      active: "/library",
      body,
      buyerId,
      canonicalPath: `/library/product/${slug}`,
      locale,
      description:
        locale === "vi"
          ? "Chi tiết thư viện song ngữ của NOOS cho biết bản ghi mua hàng, phiên bản và đường nâng cấp sau thanh toán."
          : "NOOS bilingual library detail showing purchase record, version state, and upgrade path after checkout.",
      noindex: true
    })
  };
}

async function renderUpdatesPage(buyerId: string, locale: Locale): Promise<RouteResponse> {
  const library = await loadLibraryAsync(buyerId);

  const body = `
    <main>
      <section class="hero" style="--hero-image: url('https://picsum.photos/seed/noos-updates/1600/900')">
        <div class="hero-inner">
          <div class="hero-kicker">${locale === "vi" ? "Phiên bản và cập nhật" : "Version and updates"}</div>
          <h1>${locale === "vi" ? "Tính đủ điều kiện cập nhật bám vào cùng một truth trong thư viện." : "Update eligibility stays attached to the same library truth."}</h1>
          <p class="hero-copy">${locale === "vi" ? "Route này cho thấy bốn trạng thái Team 3 phải hỗ trợ: current, update available, hết cửa sổ và đã nâng cấp." : "This route shows the four states Team 3 has to support: current, update available, window expired, and upgraded."}</p>
        </div>
      </section>
      ${section(
        locale === "vi" ? "Dòng thời gian cập nhật" : "Update timeline",
        library.items.length
          ? library.items
              .map(
                (item) => {
                  const localizedProduct = getProductByCode(item.productCode)
                    ? getLocalizedProduct(getProductByCode(item.productCode)!, locale)
                    : undefined;
                  return `
                  <article class="update-row">
                    <div class="update-body">
                      <div class="meta-line">
                        ${pill(item.productCode)}
                        <span class="status ${item.updateStatus}">${escapeHtml(getLocalizedStatusLabel(item.updateStatus, locale))}</span>
                      </div>
                      <h3>${escapeHtml(localizedProduct?.name ?? item.name)}</h3>
                      <p>${escapeHtml(
                        item.updateStatus === "update_available"
                          ? locale === "vi"
                            ? "Có phiên bản mới trong khi entitlement vẫn còn trong cửa sổ cập nhật, nên buyer có thể nhận selected updates ngay."
                            : "A newer version is available while the entitlement is still inside the update window, so the buyer can claim selected updates now."
                          : item.updateStatus === "window_expired"
                          ? locale === "vi"
                            ? "Cửa sổ cập nhật đã hết, vẫn giữ access và chuyển note sang đường nâng cấp."
                            : "The update window has closed, access stays active, and the note moves to the mapped upgrade path."
                          : item.updateStatus === "upgraded"
                          ? locale === "vi"
                            ? "Entitlement đã được nâng cấp, giữ lịch sử và chuyển buyer sang bundle mới."
                            : "The entitlement has been upgraded while preserving history and routing the buyer to the new bundle."
                          : locale === "vi"
                          ? "Entitlement vẫn còn trong cửa sổ cập nhật và có thể nhận selected updates."
                          : "The entitlement is still inside the update window and can receive selected updates."
                      )}</p>
                    </div>
                    <div class="actions">
                      <a class="button" href="/library/product/${getDocumentsSlug(getProductByCode(item.productCode)!)}?buyer=${encodeURIComponent(buyerId)}">${locale === "vi" ? "Mở sản phẩm" : "Open product"}</a>
                    </div>
                  </article>
                `;
                }
              )
              .join("")
          : `<div class="callout"><div class="callout-body"><h3>${locale === "vi" ? "Chưa có mục cập nhật" : "No update items yet"}</h3><p>${locale === "vi" ? "Cập nhật sẽ xuất hiện ở đây sau giao dịch đầu tiên được fulfillment." : "Updates will appear here after the first fulfilled purchase."}</p></div></div>`,
        locale === "vi" ? "Cập nhật" : "Updates"
      )}
    </main>
  `;

  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    body: layout({
      title: locale === "vi" ? "Cập nhật thư viện" : "Library Updates",
      active: "/library",
      body,
      buyerId,
      canonicalPath: "/library/updates",
      locale,
      description:
        locale === "vi"
          ? "Trang cập nhật thư viện song ngữ của NOOS hiển thị trạng thái current, hết cửa sổ và upgraded."
          : "NOOS bilingual library updates page showing current, expired window, and upgraded states.",
      noindex: true
    })
  };
}

async function renderLibraryLicensesPage(buyerId: string, locale: Locale): Promise<RouteResponse> {
  const library = await loadLibraryAsync(buyerId);
  const hasTeamBundle = library.items.some((item) => item.productCode === "P12");
  const body = `
    <main>
      <section class="hero" style="--hero-image: url('https://picsum.photos/seed/noos-license-library/1600/900')">
        <div class="hero-inner">
          <div class="hero-kicker">${locale === "vi" ? "Giấy phép trong thư viện" : "Library licenses"}</div>
          <h1>${locale === "vi" ? "License truth phải đi cùng từng entitlement." : "License truth stays attached to every entitlement."}</h1>
          <p class="hero-copy">${locale === "vi" ? "Bề mặt này tồn tại để buyer, support và ops thấy cùng một ranh giới sử dụng sau khi mua." : "This surface exists so buyer, support, and ops see the same usage boundary after purchase."}</p>
        </div>
      </section>
      ${section(
        locale === "vi" ? "Các license đang sở hữu" : "Owned licenses",
        library.items.length
          ? `<div class="license-grid">${library.items
              .map(
                (item) => {
                  const localizedProduct = getProductByCode(item.productCode)
                    ? getLocalizedProduct(getProductByCode(item.productCode)!, locale)
                    : undefined;
                  return `
                  <article class="license-card">
                    <div class="license-body">
                      <div class="meta-line">${pill(item.productCode)}<span class="status ${item.updateStatus}">${escapeHtml(getLocalizedStatusLabel(item.updateStatus, locale))}</span></div>
                      <h3>${escapeHtml(localizedProduct?.name ?? item.name)}</h3>
                      <p>${escapeHtml(getLocalizedLicenseLabel(item.licenseType, locale))}</p>
                    </div>
                  </article>
                `;
                }
              )
              .join("")}</div>`
          : `<div class="callout"><div class="callout-body"><h3>${locale === "vi" ? "Chưa có license nào" : "No licenses yet"}</h3><p>${locale === "vi" ? "Các trạng thái license sẽ xuất hiện ở đây sau khi fulfillment cấp entitlement đầu tiên." : "License states appear after checkout fulfillment grants the first entitlement."}</p></div></div>`,
        locale === "vi" ? "Giấy phép" : "Licenses"
      )}
      ${hasTeamBundle
        ? section(
            locale === "vi" ? "Bước lên quy mô tổ chức" : "Organization next step",
            `<div class="callout"><div class="callout-body"><h3>${locale === "vi" ? "Đã chạm ngưỡng Small Team" : "Small Team boundary reached"}</h3><p>${locale === "vi" ? "P12 đã mở đường handoff cho nhóm. Khi phạm vi vượt qua ranh giới này, hãy chuyển sang route inquiry cho tổ chức để giữ checkout, entitlement và library flow nhất quán." : "P12 opens the team handoff path. When scope moves beyond that boundary, route the buyer into the organization inquiry so checkout, entitlement, and library flow stay consistent."}</p><div class="cta-row"><a class="button" href="/organization-inquiry?buyer=${encodeURIComponent(buyerId)}&from=P12">${locale === "vi" ? "Mở inquiry cho tổ chức" : "Open organization inquiry"}</a></div></div></div>`,
            locale === "vi" ? "Bàn giao" : "Handoff"
          )
        : ""}
    </main>
  `;

  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    body: layout({
      title: locale === "vi" ? "Giấy phép trong thư viện" : "Library Licenses",
      active: "/library",
      body,
      buyerId,
      canonicalPath: "/library/licenses",
      locale,
      description:
        locale === "vi"
          ? "Trang giấy phép trong thư viện NOOS giữ license truth, trạng thái entitlement và đường inquiry cho tổ chức trong cùng một bề mặt."
          : "NOOS library licenses page showing entitlement state, usage boundaries, and the organization handoff path.",
      noindex: true
    })
  };
}

async function renderLibraryAccountPage(buyerId: string, locale: Locale): Promise<RouteResponse> {
  const library = await loadLibraryAsync(buyerId);
  const body = `
    <main>
      <section class="hero" style="--hero-image: url('https://picsum.photos/seed/noos-account/1600/900')">
        <div class="hero-inner">
          <div class="hero-kicker">${locale === "vi" ? "Tài khoản người mua" : "Buyer account"}</div>
          <h1>${locale === "vi" ? "Account view giữ buyer, route và support truth thẳng hàng." : "Account view keeps buyer, route, and support truth aligned."}</h1>
          <p class="hero-copy">${locale === "vi" ? "Đây là lớp account tối thiểu cho commerce của NOOS cho tới khi operator workspace đầy đủ hơn đi vào App." : "This is the minimum account layer for NOOS commerce until a fuller operator workspace lands in App."}</p>
        </div>
      </section>
      ${section(
        locale === "vi" ? "Tóm tắt tài khoản" : "Account summary",
        `<div class="summary-grid">
          <article class="summary-card"><div class="summary-body"><h3>${escapeHtml(buyerId)}</h3><p>${locale === "vi" ? "Số sản phẩm sở hữu" : "Owned products"}: ${library.items.length}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${locale === "vi" ? "Hàng đợi hỗ trợ" : "Support queues"}</h3><p>${escapeHtml(["purchase-access", "license-upgrade", "refund-dispute"].map((queue) => getLocalizedTeam4QueueDetail(queue, locale).label).join(" · "))}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${locale === "vi" ? "Route tài khoản" : "Account routes"}</h3><p>${escapeHtml(library.routeSet.map((route) => buildLocalePath(locale, route)).join(" · "))}</p></div></article>
        </div>`,
        locale === "vi" ? "Tài khoản" : "Account"
      )}
    </main>
  `;

  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    body: layout({
      title: locale === "vi" ? "Tài khoản thư viện" : "Library Account",
      active: "/library",
      body,
      buyerId,
      canonicalPath: "/library/account",
      locale,
      description:
        locale === "vi"
          ? "Trang tài khoản thư viện NOOS hiển thị buyer, tuyến support và route account sau giao dịch."
          : "NOOS library account page showing buyer summary, support queues, and account routes after purchase.",
      noindex: true
    })
  };
}

function renderOrderSummary(product: ProductDefinition, order: OrderRecord | undefined, locale: Locale): string {
  const localizedProduct = getLocalizedProduct(product, locale);
  if (!order) {
    return `<div class="callout"><div class="callout-body"><h3>${escapeHtml(localizedProduct.name)}</h3><p>${formatUsd(product.priceUsd)} · ${escapeHtml(localizedProduct.defaultLicenseLabel)} · ${locale === "vi" ? "Đang chờ tra cứu đơn hàng." : "Pending order lookup."}</p></div></div>`;
  }

  return `<div class="two-column">
    <div class="callout"><div class="callout-body"><h3>${escapeHtml(localizedProduct.name)}</h3><p>${formatUsd(order.amountSnapshotUsd)} · ${escapeHtml(getLocalizedLicenseLabel(order.licenseType, locale))}</p></div></div>
    <div class="callout"><div class="callout-body"><h3>${locale === "vi" ? "Đơn hàng" : "Order"} ${escapeHtml(order.orderId)}</h3><p>${escapeHtml(formatDate(order.purchasedAt, locale))}</p></div></div>
  </div>`;
}

function nextStepHref(nextStep: string | undefined, buyerId: string, locale: Locale, fallbackFrom?: ProductCode): string {
  const target = nextStep ?? "P01";
  if (/^P\d{2}$/.test(target)) {
    const product = getProductByCode(target as ProductCode);
    if (product) {
      return `${buildLocalePath(locale, product.route)}?buyer=${encodeURIComponent(buyerId)}`;
    }
  }

  const from = fallbackFrom ? `&from=${encodeURIComponent(fallbackFrom)}` : "";
  return `${buildLocalePath(locale, "/organization-inquiry")}?buyer=${encodeURIComponent(buyerId)}${from}`;
}

function renderTeamLicenseComparison(product: ProductDefinition, buyerId: string, locale: Locale): string {
  const localizedProduct = getLocalizedProduct(product, locale);
  return `<div class="two-column">
    <div class="callout">
      <div class="callout-body">
        <h3>${escapeHtml(localizedProduct.defaultLicenseLabel)}</h3>
        <ul class="feature-list">
          <li>${locale === "vi" ? "Builder handoff có ràng buộc số ghế cho nhóm implementation đầu tiên." : "Seat-aware builder handoff for the first implementation team."}</li>
          <li>${locale === "vi" ? "Giữ product truth duy nhất cho review giữa product, design và dev." : "Single product truth for product, design, and dev review."}</li>
          <li>${locale === "vi" ? "Giữ cửa sổ nâng cấp đã map hiển thị rõ, không cần thỏa thuận ngoài luồng." : "Keeps the mapped upgrade window visible without side agreements."}</li>
        </ul>
      </div>
    </div>
    <div class="callout">
      <div class="callout-body">
        <h3>${locale === "vi" ? "Handoff cho tổ chức" : "Organization handoff"}</h3>
        <ul class="feature-list">
          <li>${locale === "vi" ? "Dùng đường này khi phạm vi triển khai vượt qua ranh giới Small Team." : "Use this path when deployment scope exceeds the Small Team boundary."}</li>
          <li>${locale === "vi" ? "Gom strategic rollout, số ghế nhiều nhóm và delivery checkpoints vào một intake có kiểm soát." : "Routes strategic rollout, multi-team seats, and delivery checkpoints into one controlled intake."}</li>
          <li>${locale === "vi" ? "NOOS giữ đây là handoff về kiến trúc và vận hành, không phải bề mặt investor hay fundraising." : "NOOS keeps this as an architecture and ops handoff, not an investor or fundraising surface."}</li>
        </ul>
        <div class="cta-row">
          <a class="button" href="/organization-inquiry?buyer=${encodeURIComponent(buyerId)}&from=${encodeURIComponent(product.productCode)}">${locale === "vi" ? "Mở inquiry cho tổ chức" : "Open organization inquiry"}</a>
        </div>
      </div>
    </div>
  </div>`;
}

async function renderCheckoutPage(productCode: ProductCode, buyerId: string, locale: Locale): Promise<RouteResponse> {
  const product = getProductByCode(productCode);
  if (!product) {
    return renderNotFound(locale === "vi" ? "Không tìm thấy sản phẩm thanh toán" : "Checkout target not found", buyerId, locale);
  }
  const localizedProduct = getLocalizedProduct(product, locale);

  const body = `
    <main>
      <section class="hero" style="--hero-image: url('${getProductImageUrl(product.productCode)}')">
        <div class="hero-inner">
          <div class="hero-kicker">${locale === "vi" ? "Thanh toán" : "Checkout"}</div>
          <h1>${escapeHtml(localizedProduct.name)}</h1>
          <p class="hero-copy">${escapeHtml(localizedProduct.positioning)}</p>
          <div class="meta-line">
            ${pill(localizedProduct.defaultLicenseLabel)}
            ${pill(localizedProduct.updateWindowLabel)}
            <span class="price">${formatUsd(product.priceUsd)}</span>
          </div>
        </div>
      </section>
      ${section(
        locale === "vi" ? "Xác nhận giao dịch" : "Confirm purchase",
        `<form class="form-grid" method="post" action="/checkout">
          <input type="hidden" name="buyer" value="${escapeHtml(buyerId)}" />
          <input type="hidden" name="product" value="${escapeHtml(product.productCode)}" />
          <input type="hidden" name="locale" value="${escapeHtml(locale)}" />
          <label>Email
            <input name="email" type="email" value="${escapeHtml(buyerId.replace(/^buyer_/, "") || "buyer")}@example.com" required />
          </label>
          <label>${locale === "vi" ? "License" : "License"}
            <select name="license">
              <option value="${escapeHtml(product.defaultLicense)}">${escapeHtml(localizedProduct.defaultLicenseLabel)}</option>
              ${product.productCode === "P12" ? "" : `<option value="Small Team">${locale === "vi" ? "Nhóm nhỏ" : "Small Team"}</option>`}
            </select>
          </label>
          <div class="cta-row">
            <button class="button" type="submit">${escapeHtml(localizedProduct.primaryCta)}</button>
            <a class="secondary-button" href="${product.route}?buyer=${encodeURIComponent(buyerId)}">${locale === "vi" ? "Quay lại sản phẩm" : "Return to product"}</a>
          </div>
        </form>`,
        locale === "vi" ? "Thanh toán" : "Payment"
      )}
      ${section(
        locale === "vi" ? "Trước khi thanh toán" : "Before payment",
        `<ul class="feature-list">
          <li>${locale === "vi" ? "Điều khoản sản phẩm số được áp dụng." : "Digital product terms apply."}</li>
          <li>${locale === "vi" ? "Điều khoản license được áp dụng." : "License terms apply."}</li>
          <li>${locale === "vi" ? "Thuế có thể thay đổi theo khu vực." : "Taxes may vary by jurisdiction."}</li>
          <li>${locale === "vi" ? "Thanh toán thành công sẽ chuyển sang trang hoàn tất và mở handoff vào thư viện." : "Successful payment redirects to checkout success and opens library handoff."}</li>
        </ul>`,
        locale === "vi" ? "Pháp lý" : "Legal"
      )}
    </main>
  `;

  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    body: layout({
      title: locale === "vi" ? "Thanh toán" : "Checkout",
      active: "/products",
      body,
      buyerId,
      canonicalPath: "/checkout",
      locale,
      description:
        locale === "vi"
          ? "Trang checkout NOOS hiển thị sản phẩm, license và điều khoản trước khi người mua xác nhận giao dịch."
          : "NOOS checkout page showing product, license, and purchase terms before payment.",
      noindex: true
    })
  };
}

async function renderCheckoutSuccessPage(
  buyerId: string,
  productCode: ProductCode,
  role: BuyerRole,
  orderId: string | undefined,
  locale: Locale
): Promise<RouteResponse> {
  const product = getProductByCode(productCode);
  if (!product) {
    return renderNotFound(locale === "vi" ? "Không tìm thấy giao dịch vừa thanh toán" : "Checkout success target not found", buyerId, locale);
  }
  const localizedProduct = getLocalizedProduct(product, locale);

  const [order, library] = await Promise.all([
    orderId ? loadOrderAsync(orderId) : Promise.resolve(undefined),
    loadLibraryAsync(buyerId)
  ]);
  const purchasedProducts = library.items.length
    ? library.items.map((item) => item.productCode)
    : [productCode];
  const recommendation = await loadRecommendationAsync(purchasedProducts, role, "checkout-success");

  const body = `
    <main>
      <section class="hero" style="--hero-image: url('${getProductImageUrl(product.productCode)}')">
        <div class="hero-inner">
          <div class="hero-kicker">${locale === "vi" ? "Thanh toán thành công" : "Checkout success"}</div>
          <h1>${escapeHtml(localizedProduct.name)} ${locale === "vi" ? "đã sẵn sàng trong thư viện của bạn." : "is ready in your library."}</h1>
          <p class="hero-copy">${locale === "vi" ? "Bề mặt hoàn tất này giữ sản phẩm vừa mua, tóm tắt license, cửa sổ cập nhật và handoff vào thư viện trong một lần nhìn." : "This success surface keeps product bought, license summary, update window, and the library handoff visible in one scan."}</p>
          <div class="hero-actions">
            <a class="button" href="/library?buyer=${encodeURIComponent(buyerId)}&role=${role}">${locale === "vi" ? "Mở thư viện" : "Open library"}</a>
            <a class="secondary-button" href="${product.route}?buyer=${encodeURIComponent(buyerId)}">${locale === "vi" ? "Quay lại sản phẩm" : "Return to product"}</a>
          </div>
        </div>
      </section>
      ${section(locale === "vi" ? "Tóm tắt giao dịch" : "Purchase summary", renderOrderSummary(product, order, locale), locale === "vi" ? "Đơn hàng" : "Order")}
      ${section(
        locale === "vi" ? "Cửa sổ cập nhật" : "Update window",
        `<div class="callout"><div class="callout-body"><h3>${escapeHtml(localizedProduct.updateWindowLabel)}</h3><p>${escapeHtml(localizedProduct.updateTypeLabels.join(", "))} ${locale === "vi" ? "vẫn đi cùng entitlement này." : "updates stay tied to the same entitlement."}</p></div></div>`,
        locale === "vi" ? "Truy cập" : "Access"
      )}
      ${section(
        locale === "vi" ? "Bước kế tiếp" : "Next step",
        `<div class="callout"><div class="callout-body"><h3>${escapeHtml(
          getLocalizedRelatedLabel(recommendation.nextProductPrimary, locale)
        )}</h3><p>${escapeHtml(
          recommendation.upgradeLicenseOffer
            ? locale === "vi"
              ? `Có đường nâng cấp khả dụng: ${getLocalizedRelatedLabel(recommendation.upgradeLicenseOffer, locale)}.`
              : `Upgrade path available: ${recommendation.upgradeLicenseOffer}.`
            : locale === "vi"
            ? "Bước kế tiếp đã được map từ thang sản phẩm đã khóa."
            : "Mapped next step from the locked ladder."
        )}</p><div class="cta-row"><a class="button" href="${nextStepHref(recommendation.nextProductPrimary, buyerId, locale, product.productCode)}">${locale === "vi" ? "Mở bước kế tiếp" : "Open next step"}</a></div></div></div>`,
        locale === "vi" ? "Thang" : "Ladder"
      )}
      ${section(
        locale === "vi" ? "Đường hỗ trợ dự phòng" : "Support fallback",
        `<div class="callout"><div class="callout-body"><h3>${locale === "vi" ? "Cần hỗ trợ?" : "Need help?"}</h3><p>${locale === "vi" ? "Nếu webhook hoặc quyền truy cập thư viện bị chậm, support sẽ xử lý theo order record, entitlement grant và access log." : "If webhook or library access is delayed, support resolves against order record, entitlement grant, and access log."}</p></div></div>`,
        locale === "vi" ? "Vận hành" : "Ops"
      )}
    </main>
  `;

  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    body: layout({
      title: locale === "vi" ? "Thanh toán thành công" : "Checkout Success",
      active: "/products",
      body,
      buyerId,
      canonicalPath: "/checkout-success",
      locale,
      description:
        locale === "vi"
          ? "Trang hoàn tất giao dịch NOOS giữ order summary, cửa sổ cập nhật và bước kế tiếp sau checkout."
          : "NOOS checkout success page showing the order summary, update window, and next-step handoff.",
      noindex: true
    })
  };
}

function renderOrganizationInquiryPage(buyerId: string, fromCode: string | null, locale: Locale): RouteResponse {
  const sourceCode = fromCode && /^P\d{2}$/.test(fromCode) ? (fromCode as ProductCode) : "P12";
  const sourceProduct = getProductByCode(sourceCode) ?? getProductByCode("P12")!;
  const localizedSource = getLocalizedProduct(sourceProduct, locale);

  const body = `
    <main>
      <section class="hero" style="--hero-image: url('${getProductImageUrl("P12")}')">
        <div class="hero-inner">
          <div class="hero-kicker">${locale === "vi" ? "Liên hệ cho tổ chức" : "Organization inquiry"}</div>
          <h1>${locale === "vi" ? "Tổ chức và strategic rollout phải bắt đầu từ một handoff có kiểm soát." : "Organization and strategic rollout starts from a controlled handoff."}</h1>
          <p class="hero-copy">${locale === "vi" ? "NOOS dùng route này khi buyer đi vượt qua ranh giới Small Team sang triển khai nhiều nhóm, strategic rollout hoặc điều phối ở cấp tổ chức." : "NOOS uses this route when a buyer is moving beyond the Small Team boundary into multi-team deployment, strategic rollout, or institution-level coordination."}</p>
          <div class="hero-actions">
            <a class="button" href="/product/${getDocumentsSlug(sourceProduct)}?buyer=${encodeURIComponent(buyerId)}">${locale === "vi" ? `Quay lại ${localizedSource.productCode}` : `Return to ${sourceProduct.productCode}`}</a>
            <a class="secondary-button" href="/library/licenses?buyer=${encodeURIComponent(buyerId)}">${locale === "vi" ? "Xem lại license trong thư viện" : "Review library licenses"}</a>
          </div>
        </div>
      </section>
      ${section(
        locale === "vi" ? "Khi nào dùng route này" : "When to use this route",
        `<div class="two-column">
          <div class="callout"><div class="callout-body"><h3>${locale === "vi" ? "Đổi phạm vi" : "Scope shift"}</h3><ul class="feature-list"><li>${locale === "vi" ? "Số nhóm hoặc số ghế vượt ra ngoài phạm vi Small Team." : "More teams or seats than the Small Team license covers."}</li><li>${locale === "vi" ? "Cần một handoff có kiểm soát cho chuỗi triển khai, delivery vào thư viện và accountability." : "Need a controlled handoff for deployment sequence, library delivery, and accountability."}</li><li>${locale === "vi" ? "Cần buyer support và ops nhìn cùng một next-step truth." : "Need buyer support and ops to see the same next-step truth."}</li></ul></div></div>
          <div class="callout"><div class="callout-body"><h3>${locale === "vi" ? "Kiểm tra ranh giới" : "Boundary check"}</h3><p class="boundary-note">${locale === "vi" ? "Đây không phải route investor hay fundraising. Nó tồn tại để giữ NOOS ở đúng phạm vi kiến trúc, governance và commerce có cấu trúc." : "This is not an investor or fundraising route. It exists to keep NOOS on architecture, governance, and structured commerce surfaces only."}</p></div></div>
        </div>`,
        locale === "vi" ? "Bàn giao" : "Handoff"
      )}
      ${section(
        locale === "vi" ? "Từ Small Team lên Organization" : "Small Team to Organization",
        renderTeamLicenseComparison(sourceProduct, buyerId, locale),
        locale === "vi" ? "Đường license" : "License path"
      )}
      ${section(
        locale === "vi" ? "Những gì Team 2, Team 3 và Team 4 phải giữ thẳng hàng" : "What Team 2, Team 3, and Team 4 need aligned",
        `<ul class="ops-list">
          <li>${locale === "vi" ? "Team 2 giữ checkout, webhook, entitlement và delivery vào thư viện đúng contract đã khóa." : "Team 2 keeps checkout, webhook, entitlement, and library delivery on the locked contract."}</li>
          <li>${locale === "vi" ? "Team 3 giữ catalog, product và copy thư viện người mua thẳng hàng với ranh giới license đang hoạt động." : "Team 3 keeps catalog, product, and buyer-library copy aligned with the active license boundary."}</li>
          <li>${locale === "vi" ? "Team 4 dùng route này cho follow-up có kiểm soát mà không mở lại ngôn ngữ investor hay fundraising." : "Team 4 uses this route for controlled follow-up without reopening investor or fundraising language."}</li>
        </ul>`,
        locale === "vi" ? "Liên team" : "Cross-team"
      )}
    </main>
  `;

  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    body: layout({
      title: locale === "vi" ? "Liên hệ cho tổ chức" : "Organization Inquiry",
      active: "/products",
      body,
      buyerId,
      canonicalPath: "/organization-inquiry",
      locale,
      description:
        locale === "vi"
          ? "Route inquiry cho tổ chức của NOOS dùng để handoff từ Small Team sang triển khai nhiều nhóm mà không trượt sang investor surface."
          : "NOOS organization inquiry route for the handoff from Small Team into broader deployment without drifting into investor messaging."
    })
  };
}

async function renderOperationsPage(buyerId: string, locale: Locale): Promise<RouteResponse> {
  const [operations, team3Surface] = await Promise.all([
    loadTeam4OperationsAsync(),
    loadTeam3SurfaceAsync()
  ]);
  const statusSnapshot = getLocalizedTeam4StatusSnapshot(locale);
  const launchGates = getLocalizedTeam4LaunchGates(locale);
  const opsPacket = getLocalizedTeam4OpsPacketDetails(locale);
  const progress = getLocalizedTeam4ExecutionProgress(locale);

  const body = `
    <main>
      <section class="hero" style="--hero-image: url('https://picsum.photos/seed/noos-operations/1600/900')">
        <div class="hero-inner">
          <div class="hero-kicker">${locale === "vi" ? "Vận hành" : "Operations"}</div>
          <h1>${locale === "vi" ? "Kỷ luật launch và hỗ trợ của NOOS sống ở đây." : "NOOS launch and support discipline lives here."}</h1>
          <p class="hero-copy">${locale === "vi" ? "Route này biến các file lock của Team 4 thành bề mặt vận hành đang sống cho launch waves, KPI contract, support SLA và runbooks." : "This route turns Team 4 lock files into a live operational view for launch waves, KPI contract, support SLA, and runbooks."}</p>
        </div>
      </section>
      ${section(
        locale === "vi" ? "Trạng thái hiện tại" : "Current status",
        `<div class="summary-grid">
          <article class="summary-card"><div class="summary-body"><h3>${escapeHtml(statusSnapshot.releaseStatus)}</h3><p>${locale === "vi" ? "Trạng thái phát hành" : "Release status"}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${escapeHtml(statusSnapshot.activeScope)}</h3><p>${locale === "vi" ? "Phạm vi Team 4 hiện tại" : "Current Team 4 scope"}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${locale === "vi" ? "Ghi chú gate" : "Gate note"}</h3><p>${escapeHtml(statusSnapshot.blocker)}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${locale === "vi" ? "Phụ thuộc" : "Dependencies"}</h3><p>${escapeHtml(statusSnapshot.dependencies.join(" · "))}</p></div></article>
        </div>`,
        locale === "vi" ? "Mức sẵn sàng" : "Readiness"
      )}
      ${section(
        locale === "vi" ? "Tiến độ Team 4 và phần còn lại" : "Team 4 progress and remaining work",
        `<div class="summary-grid">
          <article class="summary-card"><div class="summary-body"><h3>${escapeHtml(progress.completedPercent)}</h3><p>${locale === "vi" ? "Hoàn thành theo kế hoạch Team 4" : "Completed against Team 4 plan"}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${escapeHtml(progress.remainingPercent)}</h3><p>${locale === "vi" ? "Phần việc còn lại" : "Remaining work"}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${escapeHtml(progress.asOf)}</h3><p>${locale === "vi" ? "Mốc cập nhật" : "As-of checkpoint"}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${escapeHtml(opsPacket.laneState)}</h3><p>${locale === "vi" ? "Lane gate hiện tại" : "Current lane gate"}</p></div></article>
        </div>
        <div class="two-column">
          <div class="callout"><div class="callout-body"><h3>${locale === "vi" ? "Ưu tiên triển khai ngay" : "Current focus"}</h3><ul class="ops-list">${progress.focusNow
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}</ul><h3>${locale === "vi" ? "Phụ thuộc đang theo dõi" : "Dependencies in view"}</h3><ul class="ops-list">${progress.blockedBy
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}</ul><div class="cta-row"><a class="mini-link" href="/operations/trace-map.json">${locale === "vi" ? "Mở trace map JSON" : "Open trace map JSON"}</a></div></div></div>
          <div class="callout"><div class="callout-body"><h3>${locale === "vi" ? "Guard locale EN/VI" : "EN/VI locale guard"}</h3><ul class="ops-list">${progress.localeGuard
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}</ul><h3>${locale === "vi" ? "Guard thứ tự lane" : "Lane sequence guard"}</h3><ul class="ops-list">${progress.sequenceGuard
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}</ul></div></div>
        </div>`,
        locale === "vi" ? "Execution" : "Execution"
      )}
      ${section(locale === "vi" ? "Các đợt launch" : "Launch waves", renderLaunchWaves(operations, buyerId, locale), locale === "vi" ? "Triển khai" : "Growth")}
      ${section(
        locale === "vi" ? "Hợp đồng KPI" : "KPI contract",
        `<div class="ops-grid">${operations.kpis
          .map(
            (kpi) => {
              const detail = getLocalizedTeam4KpiDetail(kpi, locale) ?? {
                label: kpi,
                owner: "Team 4",
                cadence: locale === "vi" ? "Hằng ngày" : "Daily",
                target: locale === "vi" ? "Được theo dõi theo hợp đồng Team 4 đã khóa." : "Tracked under the locked Team 4 contract.",
                yellow: locale === "vi" ? "Rà lại khi tín hiệu bắt đầu lệch baseline." : "Review when the signal trends away from baseline.",
                red: locale === "vi" ? "Escalate khi làm gãy kỷ luật launch." : "Escalate when it breaks launch discipline.",
                note: locale === "vi" ? "Dùng để giữ tăng trưởng doanh thu đi cùng niềm tin." : "Used to keep revenue growth aligned with trust."
              };

              return `
              <article class="ops-card">
                <div class="ops-body">
                  <div class="meta-line">
                    ${pill(kpi)}
                    <span>${escapeHtml(detail.owner)} · ${escapeHtml(detail.cadence)}</span>
                  </div>
                  <h3>${escapeHtml(detail.label)}</h3>
                  <p>${escapeHtml(detail.note)}</p>
                  <ul class="ops-list">
                    <li>${locale === "vi" ? "Mục tiêu" : "Target"}: ${escapeHtml(detail.target)}</li>
                    <li>${locale === "vi" ? "Vàng" : "Yellow"}: ${escapeHtml(detail.yellow)}</li>
                    <li>${locale === "vi" ? "Đỏ" : "Red"}: ${escapeHtml(detail.red)}</li>
                  </ul>
                </div>
              </article>
            `;
            }
          )
          .join("")}</div>`,
        "KPIs"
      )}
      ${section(
        locale === "vi" ? "SLA hỗ trợ" : "Support SLA",
        `<div class="summary-grid">
          <article class="summary-card"><div class="summary-body"><h3>${locale === "vi" ? "Phản hồi đầu tiên" : "First response"}</h3><p>${operations.supportSla.firstResponseHours} ${locale === "vi" ? "giờ" : "hours"}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${locale === "vi" ? "Xử lý" : "Resolution"}</h3><p>${operations.supportSla.resolutionHours} ${locale === "vi" ? "giờ" : "hours"}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${locale === "vi" ? "Hàng đợi" : "Queues"}</h3><p>${escapeHtml(operations.supportSla.queues.map((queue) => getLocalizedTeam4QueueDetail(queue, locale).label).join(" · "))}</p></div></article>
        </div>
        <div class="ops-grid">${operations.supportSla.queues
          .map((queue) => {
            const detail = getLocalizedTeam4QueueDetail(queue, locale) ?? {
              label: queue,
              summary:
                locale === "vi"
                  ? "Vận hành hàng đợi này dựa trên order truth, entitlement truth và support logs."
                  : "Operate this queue against order truth, entitlement truth, and support logs.",
              checks: [locale === "vi" ? "Xác nhận buyer state trước khi có bất kỳ thao tác tay nào." : "Confirm the buyer state before any manual action."]
            };
            return `
              <article class="ops-card">
                <div class="ops-body">
                  <div class="meta-line">
                    ${pill(queue)}
                    <span>${operations.supportSla.firstResponseHours}h ${locale === "vi" ? "phản hồi đầu" : "first response"} · ${operations.supportSla.resolutionHours}h ${locale === "vi" ? "xử lý" : "resolution"}</span>
                  </div>
                  <h3>${escapeHtml(detail.label)}</h3>
                  <p>${escapeHtml(detail.summary)}</p>
                  <ul class="ops-list">${detail.checks.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
                </div>
              </article>
            `;
          })
          .join("")}</div>`,
        locale === "vi" ? "Hỗ trợ" : "Support"
      )}
      ${section(
        locale === "vi" ? "Ops truth và ma trận owner/escalation" : "Ops truth and owner/escalation matrix",
        `<div class="summary-grid">
          <article class="summary-card"><div class="summary-body"><h3>${escapeHtml(opsPacket.packetStatus)}</h3><p>${locale === "vi" ? "Trạng thái packet Team 4" : "Team 4 packet status"}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${escapeHtml(opsPacket.laneState)}</h3><p>${locale === "vi" ? "Trạng thái lane" : "Lane state"}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${locale === "vi" ? "Ghi chú gate" : "Gate note"}</h3><p>${escapeHtml(opsPacket.laneReason)}</p></div></article>
          <article class="summary-card"><div class="summary-body"><h3>${locale === "vi" ? "Chuẩn ngôn ngữ" : "Language lock"}</h3><p>${locale === "vi" ? "EN-first cho quốc tế, VI có dấu đầy đủ cho bề mặt vi." : "EN-first for international routes, VI with full diacritics on vi routes."}</p></div></article>
        </div>
        <div class="ops-grid">${opsPacket.ownerRows
          .map(
            (row) => `
            <article class="ops-card">
              <div class="ops-body">
                <div class="meta-line">
                  ${pill(locale === "vi" ? "Owner matrix" : "Owner matrix")}
                  <span>${escapeHtml(row.primary)} · ${escapeHtml(row.backup)}</span>
                </div>
                <h3>${escapeHtml(row.responsibility)}</h3>
                <ul class="ops-list">
                  <li>${locale === "vi" ? "Primary" : "Primary"}: ${escapeHtml(row.primary)}</li>
                  <li>${locale === "vi" ? "Backup" : "Backup"}: ${escapeHtml(row.backup)}</li>
                  <li>${locale === "vi" ? "Escalate khi" : "Escalate when"}: ${escapeHtml(row.trigger)}</li>
                </ul>
              </div>
            </article>
          `
          )
          .join("")}</div>`,
        locale === "vi" ? "Packet trạng thái" : "Packet state"
      )}
      ${section(
        locale === "vi" ? "Recovery path và partner handoff" : "Recovery path and partner handoff",
        `<div class="two-column">
          <div class="callout">
            <div class="callout-body">
              <h3>${locale === "vi" ? "Recovery path" : "Recovery path"}</h3>
              <ul class="ops-list">${opsPacket.recoveryEntry.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
              <h3>${locale === "vi" ? "Ràng buộc không bypass" : "No-bypass constraints"}</h3>
              <ul class="ops-list">${opsPacket.recoveryConstraints.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </div>
          </div>
          <div class="callout">
            <div class="callout-body">
              <h3>${locale === "vi" ? "Partner handoff với vc.vetuonglai.com" : "Partner handoff with vc.vetuonglai.com"}</h3>
              <ul class="ops-list">${opsPacket.partnerHandoff.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </div>
          </div>
        </div>`,
        locale === "vi" ? "Recovery" : "Recovery"
      )}
      ${section(
        locale === "vi" ? "Incident matrix và support macros" : "Incident matrix and support macros",
        `<div class="ops-grid">${opsPacket.incidents
          .map(
            (incident) => `
            <article class="ops-card">
              <div class="ops-body">
                <div class="meta-line">${pill(locale === "vi" ? "Incident" : "Incident")}</div>
                <h3>${escapeHtml(incident.incident)}</h3>
                <p>${locale === "vi" ? "Support action" : "Support action"}</p>
                <ul class="ops-list">${incident.support.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
                <p>${locale === "vi" ? "Escalation path" : "Escalation path"}</p>
                <ul class="ops-list">${incident.escalation.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
              </div>
            </article>
          `
          )
          .join("")}</div>
        <div class="ops-grid">${opsPacket.traceMappings
          .map(
            (mapping) => `
            <article class="ops-card">
              <div class="ops-body">
                <div class="meta-line">${pill(locale === "vi" ? "Trace mapping" : "Trace mapping")}</div>
                <h3>${escapeHtml(mapping.scenario)}</h3>
                <p>${locale === "vi" ? "Tín hiệu phát hiện" : "Detection signals"}</p>
                <ul class="ops-list">${mapping.detectSignals.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
                <p>${locale === "vi" ? "Trường trace bắt buộc" : "Required trace fields"}</p>
                <ul class="ops-list">${mapping.requiredTraceFields.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
                <p>${locale === "vi" ? "Đường quyết định" : "Decision path"}</p>
                <ul class="ops-list">${mapping.decisionPath.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
                <p>${locale === "vi" ? "Escalation owner" : "Escalation owner"}</p>
                <ul class="ops-list">${mapping.escalateTo.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
              </div>
            </article>
          `
          )
          .join("")}</div>
        <div class="ops-grid">${opsPacket.macros
          .map(
            (macro) => `
            <article class="ops-card">
              <div class="ops-body">
                <div class="meta-line">${pill(locale === "vi" ? "Macro" : "Macro")}</div>
                <h3>${escapeHtml(macro.label)}</h3>
                <p>${escapeHtml(macro.message)}</p>
              </div>
            </article>
          `
          )
          .join("")}</div>`,
        locale === "vi" ? "Incident" : "Incident"
      )}
      ${section(
        locale === "vi" ? "Rollback communication" : "Rollback communication",
        `<div class="two-column">
          <div class="callout">
            <div class="callout-body">
              <h3>${locale === "vi" ? "Rollback owners" : "Rollback owners"}</h3>
              <ul class="ops-list">${opsPacket.rollbackOwners.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
              <h3>${locale === "vi" ? "Danh sách nhận thông báo" : "Notification list"}</h3>
              <ul class="ops-list">${opsPacket.rollbackNotify.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </div>
          </div>
          <div class="callout">
            <div class="callout-body">
              <h3>${locale === "vi" ? "Template giao tiếp khi rollback" : "Rollback communication templates"}</h3>
              <ul class="ops-list">${opsPacket.rollbackTemplates.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </div>
          </div>
        </div>`,
        locale === "vi" ? "Rollback" : "Rollback"
      )}
      ${section(
        locale === "vi" ? "Nguyên tắc vận hành, cổng mở và runbook" : "Guardrails, gates, and runbooks",
        `<div class="two-column">
          <div class="callout"><div class="callout-body"><h3>${locale === "vi" ? "Nguyên tắc vận hành" : "Guardrails"}</h3><ul class="ops-list">${operations.guardrails
            .map((item) => `<li>${escapeHtml(getLocalizedOpsToken(item, locale, guardrailLabels))}</li>`)
            .join("")}</ul></div></div>
          <div class="callout"><div class="callout-body"><h3>${locale === "vi" ? "Runbook xử lý" : "Runbooks"}</h3><ul class="ops-list">${operations.runbooks
            .map((item) => `<li>${escapeHtml(getLocalizedOpsToken(item, locale, runbookLabels))}</li>`)
            .join("")}</ul></div></div>
        </div>
        <div class="two-column">
          <div class="callout"><div class="callout-body"><h3>${locale === "vi" ? "Cổng mở launch" : "Launch gates"}</h3><ul class="ops-list">${launchGates
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}</ul></div></div>
          <div class="callout"><div class="callout-body"><h3>${locale === "vi" ? "Phụ thuộc liên team" : "Cross-team dependencies"}</h3><ul class="ops-list">${statusSnapshot.dependencies
            .map((item) => `<li>${escapeHtml(item)}</li>`)
            .join("")}
            <li>${locale === "vi" ? "Team 1 rà soát lock compliance khi wording, ownership hoặc release authority có dấu hiệu trôi." : "Team 1 lock compliance review when wording, ownership, or release authority drifts."}</li>
          </ul></div></div>
        </div>
        <div class="boundary-card"><div class="boundary-body"><h3>${locale === "vi" ? "Đóng ranh giới" : "Boundary closure"}</h3><p class="boundary-note">${locale === "vi" ? "Các route investor và fundraising cũ đều đã được redirect và noindex trước khi public release. Các component Team 3 đang khóa:" : "Investor and fundraising legacy routes are redirected and noindexed before public release. Team 3 components locked:"} ${escapeHtml(team3Surface.requiredComponents.join(" · "))}</p></div></div>`,
        locale === "vi" ? "Khóa ranh giới" : "Closure"
      )}
    </main>
  `;

  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    body: layout({
      title: locale === "vi" ? "Vận hành" : "Operations",
      active: "/operations",
      body,
      buyerId,
      canonicalPath: "/operations",
      locale,
      description:
        locale === "vi"
          ? "Bề mặt vận hành NOOS cho launch waves, KPI contract, support SLA và guardrails liên team."
          : "NOOS operations surface for launch waves, KPI contracts, support SLA, and cross-team guardrails."
    })
  };
}

function renderOperationsTraceMapJson(locale: Locale): RouteResponse {
  const opsPacket = getLocalizedTeam4OpsPacketDetails(locale);
  const progress = getLocalizedTeam4ExecutionProgress(locale);
  const payload = {
    generatedAt: new Date().toISOString(),
    locale,
    packetStatus: opsPacket.packetStatus,
    laneState: opsPacket.laneState,
    laneReason: opsPacket.laneReason,
    progress,
    traceMappings: opsPacket.traceMappings,
    rollbackOwners: opsPacket.rollbackOwners
  };

  return {
    status: 200,
    contentType: "application/json; charset=utf-8",
    headers: {
      "cache-control": "no-store",
      "x-robots-tag": "noindex,nofollow,noarchive"
    },
    body: JSON.stringify(payload, null, 2)
  };
}

function renderNotFound(message: string, buyerId: string, locale: Locale): RouteResponse {
  const body = `
    <main>
      <section class="hero" style="--hero-image: url('https://picsum.photos/seed/noos-not-found/1600/900')">
        <div class="hero-inner">
          <div class="hero-kicker">${locale === "vi" ? "Không tìm thấy" : "Not found"}</div>
          <h1>${escapeHtml(message)}</h1>
          <p class="hero-copy">${locale === "vi" ? "Hãy ở trên các route đã khóa để Team 3 có thể build theo IA và product truth ổn định." : "Stay on the locked routes so Team 3 can build against stable IA and product truth."}</p>
          <div class="hero-actions">
            <a class="button" href="/products?buyer=${encodeURIComponent(buyerId)}">${locale === "vi" ? "Mở sản phẩm" : "Open products"}</a>
            <a class="secondary-button" href="/library?buyer=${encodeURIComponent(buyerId)}">${locale === "vi" ? "Mở thư viện" : "Open library"}</a>
          </div>
        </div>
      </section>
    </main>
  `;

  return {
    status: 404,
    contentType: "text/html; charset=utf-8",
    body: layout({
      title: locale === "vi" ? "Không tìm thấy" : "Not Found",
      active: "/products",
      body,
      buyerId,
      canonicalPath: "/products",
      locale,
      description:
        locale === "vi"
          ? "Trang không tìm thấy của NOOS giữ người dùng trên các route đã khóa thuộc boundary hiện hành."
          : "NOOS not-found page that keeps users on the active boundary-locked routes.",
      noindex: true
    })
  };
}

function routeRedirectResponse(location: string): RouteResponse {
  return {
    status: 308,
    contentType: "text/plain; charset=utf-8",
    headers: {
      location,
      "x-robots-tag": "noindex, follow"
    },
    body: `Redirecting to ${location}`
  };
}

async function renderSitemap(): Promise<RouteResponse> {
  const catalog = await loadCatalogAsync();
  const baseRoutes = [
    "/products",
    "/documents",
    "/programs",
    "/licenses",
    "/operations",
    "/organization-inquiry",
    ...catalog.products.map((product) => product.route)
  ];
  const uniqueRoutes = Array.from(new Set(baseRoutes));
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${uniqueRoutes
  .flatMap((route) =>
    supportedLocales.map(
      (locale) => `  <url>
    <loc>${canonicalUrl(locale, route)}</loc>
${supportedLocales
  .map(
    (alternate) =>
      `    <xhtml:link rel="alternate" hreflang="${localeMeta[alternate].htmlLang}" href="${canonicalUrl(alternate, route)}" />`
  )
  .join("\n")}
  </url>`
    )
  )
  .join("\n")}
</urlset>`;

  return {
    status: 200,
    contentType: "application/xml; charset=utf-8",
    body
  };
}

function renderRobots(): RouteResponse {
  return {
    status: 200,
    contentType: "text/plain; charset=utf-8",
    body: `User-agent: *
Allow: /en/products
Allow: /en/documents
Allow: /en/programs
Allow: /en/licenses
Allow: /en/operations
Allow: /en/organization-inquiry
Allow: /vi/products
Allow: /vi/documents
Allow: /vi/programs
Allow: /vi/licenses
Allow: /vi/operations
Allow: /vi/organization-inquiry
Disallow: /library
Disallow: /en/library
Disallow: /vi/library
Disallow: /checkout
Disallow: /en/checkout
Disallow: /vi/checkout
Disallow: /checkout-success
Disallow: /en/checkout-success
Disallow: /vi/checkout-success
Disallow: /docs/investment-programs/
Disallow: /en/docs/investment-programs/
Disallow: /vi/docs/investment-programs/
Disallow: /investor
Disallow: /investors
Disallow: /fundraising
Sitemap: https://noos.iai.one/sitemap.xml
`
  };
}

export async function renderCheckoutFromForm(body: URLSearchParams, locale: Locale = defaultLocale): Promise<RouteResponse> {
  const buyerId = body.get("buyer") ?? getDefaultBuyerId();
  const productCode = (body.get("product") as ProductCode | null) ?? "P11";
  const buyerEmail = body.get("email") ?? undefined;
  const licenseType = body.get("license") ?? undefined;
  const checkout = await executeCheckoutFlowAsync({
    buyerId,
    productCode,
    buyerEmail,
    licenseType,
    sourceSurface: "product-detail"
  });

  return {
    status: 303,
    contentType: "text/plain; charset=utf-8",
    headers: {
      location: `${buildLocalePath(locale, "/checkout-success")}?buyer=${encodeURIComponent(checkout.buyerId)}&product=${checkout.productCode}&order=${encodeURIComponent(checkout.orderId)}`
    },
    body: "Redirecting to checkout success"
  };
}

export async function renderRoute(pathname: string, searchParams: URLSearchParams): Promise<RouteResponse> {
  if (pathname === "/sitemap.xml") {
    return renderSitemap();
  }

  if (pathname === "/robots.txt") {
    return renderRobots();
  }

  const localized = parseLocalizedPath(pathname);
  const buyerId = searchParams.get("buyer") ?? getDefaultBuyerId();
  const role = getLocalizedRoleProfile(searchParams.get("role"), localized.locale).role;
  const locale = localized.locale;
  const querySuffix = searchParamsSuffix(searchParams);
  const normalizedPath =
    localized.rootLocaleOnly || localized.normalizedPath === "/"
      ? "/products"
      : localized.normalizedPath;
  const boundaryRedirect = matchesLegacyBoundaryRoute(normalizedPath);

  if (boundaryRedirect) {
    return redirectResponse(`${boundaryRedirect}${querySuffix}`, buyerId, locale);
  }

  if (localized.isLocalized && localized.normalizedPath === "/sitemap.xml") {
    return routeRedirectResponse("/sitemap.xml");
  }

  if (localized.isLocalized && localized.normalizedPath === "/robots.txt") {
    return routeRedirectResponse("/robots.txt");
  }

  if (!localized.isLocalized) {
    return routeRedirectResponse(`${buildLocalePath(locale, normalizedPath)}${querySuffix}`);
  }

  if (localized.rootLocaleOnly) {
    return routeRedirectResponse(`${buildLocalePath(locale, "/products")}${querySuffix}`);
  }

  if (normalizedPath === "/products") {
    return renderCatalogPage("all", buyerId, role, locale);
  }

  if (normalizedPath === "/documents") {
    return renderCatalogPage("documents", buyerId, role, locale);
  }

  if (normalizedPath === "/programs") {
    return renderCatalogPage("programs", buyerId, role, locale);
  }

  if (normalizedPath === "/licenses") {
    return renderLicensePage(buyerId, locale);
  }

  if (normalizedPath === "/organization-inquiry") {
    return renderOrganizationInquiryPage(buyerId, searchParams.get("from"), locale);
  }

  if (normalizedPath === "/operations") {
    return renderOperationsPage(buyerId, locale);
  }

  if (normalizedPath === "/operations/trace-map.json") {
    return renderOperationsTraceMapJson(locale);
  }

  if (normalizedPath === "/library") {
    return renderLibraryPage(buyerId, role, locale);
  }

  if (normalizedPath === "/library/updates") {
    return renderUpdatesPage(buyerId, locale);
  }

  if (normalizedPath === "/library/licenses") {
    return renderLibraryLicensesPage(buyerId, locale);
  }

  if (normalizedPath === "/library/account") {
    return renderLibraryAccountPage(buyerId, locale);
  }

  if (normalizedPath === "/checkout") {
    const productCode = (searchParams.get("product") as ProductCode | null) ?? "P11";
    return renderCheckoutPage(productCode, buyerId, locale);
  }

  if (normalizedPath === "/checkout-success") {
    const productCode = (searchParams.get("product") as ProductCode | null) ?? "P11";
    const orderId = searchParams.get("order") ?? undefined;
    return renderCheckoutSuccessPage(buyerId, productCode, role, orderId, locale);
  }

  if (normalizedPath.startsWith("/product/")) {
    const slug = normalizedPath.slice("/product/".length);
    const product = await loadProductBySlugAsync(slug);
    return product
      ? renderProductDetailPage(product, buyerId, locale)
      : renderNotFound(locale === "vi" ? "Không tìm thấy sản phẩm" : "Product not found", buyerId, locale);
  }

  if (normalizedPath.startsWith("/library/product/")) {
    const slug = normalizedPath.slice("/library/product/".length);
    return renderLibraryProductPage(slug, buyerId, locale);
  }

  return renderNotFound(locale === "vi" ? "Không tìm thấy route" : "Route not found", buyerId, locale);
}
