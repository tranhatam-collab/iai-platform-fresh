import type { Locale } from "./i18n.js";

export type Team4KpiDetail = {
  label: string;
  owner: string;
  cadence: string;
  target: string;
  yellow: string;
  red: string;
  note: string;
};

export type Team4QueueDetail = {
  label: string;
  summary: string;
  checks: string[];
};

export type Team4WaveDetail = {
  status: string;
  summary: string;
  exitRule: string;
};

export type Team4OwnerEscalationRow = {
  responsibility: string;
  primary: string;
  backup: string;
  trigger: string;
};

export type Team4IncidentPlay = {
  incident: string;
  support: string[];
  escalation: string[];
};

export type Team4SupportMacro = {
  label: string;
  message: string;
};

export type Team4TraceMapping = {
  scenario: string;
  detectSignals: string[];
  requiredTraceFields: string[];
  decisionPath: string[];
  escalateTo: string[];
};

export type Team4OpsPacketDetails = {
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

export type Team4ExecutionProgress = {
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

export const guardrailLabels: Record<Locale, Record<string, string>> = {
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

export const runbookLabels: Record<Locale, Record<string, string>> = {
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

export function getLocalizedTeam4StatusSnapshot(locale: Locale) {
  return locale === "vi" ? team4StatusSnapshotVi : team4StatusSnapshot;
}

export function getLocalizedTeam4LaunchGates(locale: Locale): string[] {
  return locale === "vi" ? team4LaunchGatesVi : team4LaunchGates;
}

export function getLocalizedTeam4KpiDetail(kpi: string, locale: Locale): Team4KpiDetail {
  return (
    locale === "vi" ? team4KpiDetailsVi[kpi] ?? team4KpiDetails[kpi] : team4KpiDetails[kpi]
  ) ?? team4KpiDetails["conversion-rate-by-product"]!;
}

export function getLocalizedTeam4QueueDetail(queue: string, locale: Locale): Team4QueueDetail {
  return (
    locale === "vi" ? team4QueueDetailsVi[queue] ?? team4QueueDetails[queue] : team4QueueDetails[queue]
  ) ?? team4QueueDetails["purchase-access"]!;
}

export function getLocalizedTeam4WaveDetail(waveId: string, locale: Locale): Team4WaveDetail {
  return (
    locale === "vi" ? team4WaveDetailsVi[waveId] ?? team4WaveDetails[waveId] : team4WaveDetails[waveId]
  ) ?? team4WaveDetails["wave-1"]!;
}

export function getLocalizedTeam4OpsPacketDetails(locale: Locale): Team4OpsPacketDetails {
  return locale === "vi" ? team4OpsPacketDetailsVi : team4OpsPacketDetailsEn;
}

export function getLocalizedTeam4ExecutionProgress(locale: Locale): Team4ExecutionProgress {
  return locale === "vi" ? team4ExecutionProgressVi : team4ExecutionProgressEn;
}
