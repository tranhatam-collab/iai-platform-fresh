export type SitePaymentAssignmentState = "ACTIVE_NOW" | "DEFERRED_UNTIL_FOUNDER_INSTRUCTION";

export interface SiteSenderPackage {
  billing: string;
  noreply: string;
  pay: string;
  support: string;
}

export interface SiteActivationRegistryEntry {
  allowedLocales: string[];
  currentBoardStatus: string;
  defaultLocale: string;
  domain: string;
  intakeId: string;
  marketType: string;
  nextOpsPacketAction: string;
  notes: string[];
  onboardingForm: string | null;
  paymentAssignmentNote: string;
  paymentAssignmentState: SitePaymentAssignmentState;
  payoutRequired: boolean | null;
  priority: "P0" | "P1" | "P2" | "P3";
  requiredEvidence: string[];
  requiredLinks: string[];
  senderPackage: SiteSenderPackage;
  siteCode: string;
  surfaceHint: string;
}

export interface SiteActivationRegistrySnapshot {
  assignmentCounts: {
    activeNow: number;
    deferredUntilFounderInstruction: number;
  };
  hardRules: string[];
  marketCounts: {
    international: number;
    tbd: number;
    vn: number;
  };
  scope: "team_d_intake_sites";
  totalSites: number;
  sites: SiteActivationRegistryEntry[];
  version: "2026-04-22";
}

const VN_FORM = "PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md";
const INTERNATIONAL_FORM = "PAY_IAI_ONE_INTERNATIONAL_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md";

function createSenderPackage(domain: string): SiteSenderPackage {
  return {
    billing: `billing@${domain}`,
    noreply: `noreply@${domain}`,
    pay: `pay@${domain}`,
    support: `support@${domain}`
  };
}

function createDefaultRequiredLinks(domain: string): string[] {
  return [
    `checkout_base_url:${domain}`,
    `success_url:${domain}`,
    `cancel_url:${domain}`,
    `retry_url:${domain}`,
    `support_url:${domain}`
  ];
}

const requiredEvidence = [
  "provider action or true sandbox action",
  "checkout_url or provider reference",
  "SMTP messageId",
  "D1 evidence",
  "inbox proof"
];

export const siteActivationRegistryEntries: SiteActivationRegistryEntry[] = [
  {
    allowedLocales: ["vi", "en"],
    currentBoardStatus: "FORM_IN_PROGRESS",
    defaultLocale: "vi",
    domain: "tranhatam.com",
    intakeId: "SITE-INTAKE-100",
    marketType: "VN",
    nextOpsPacketAction:
      "Keep the current founder-locked routing, repo-side outbound adapter, and guarded internal handoff route, but continue mailbox binding, inbound routing truth, MAIL_API runtime binding, live surface routing, payment-event trigger wiring, and evidence capture.",
    notes: [
      "Founder-approved receiver assignment already exists for the current tranhatam.com launch packet.",
      "This site is the only active-assignment exception in the current registry wave.",
      "Public hostname blocker, repo-side pay-to-mail adapter, and internal handoff route are closed, but send-live proof is still missing."
    ],
    onboardingForm: VN_FORM,
    paymentAssignmentNote: "Founder-approved routing is already locked for tranhatam.com.",
    paymentAssignmentState: "ACTIVE_NOW",
    payoutRequired: false,
    priority: "P0",
    requiredEvidence: [...requiredEvidence],
    requiredLinks: [
      "payment_routing_api",
      "checkout_base_url:tranhatam.com",
      "success_url:tranhatam.com",
      "cancel_url:tranhatam.com",
      "receipt_url:tranhatam.com",
      "support_url:tranhatam.com"
    ],
    senderPackage: createSenderPackage("tranhatam.com"),
    siteCode: "TRANHATAM-WEB",
    surfaceHint: "Founder site / primary one-time VND launch surface"
  },
  {
    allowedLocales: ["vi", "en"],
    currentBoardStatus: "FORM_IN_PROGRESS",
    defaultLocale: "vi",
    domain: "nguyenlananh.com",
    intakeId: "SITE-INTAKE-101",
    marketType: "VN",
    nextOpsPacketAction:
      "Lock legal owner, payOS merchant mapping, callback URLs, and mailbox ownership; keep receiver assignment deferred until founder instruction.",
    notes: [
      "High-priority VN collection candidate.",
      "Sender package and researched Team D core payment email packet are already locked in repo."
    ],
    onboardingForm: VN_FORM,
    paymentAssignmentNote: "Assignment deferred until founder names the payment rail.",
    paymentAssignmentState: "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
    payoutRequired: false,
    priority: "P0",
    requiredEvidence: [...requiredEvidence],
    requiredLinks: createDefaultRequiredLinks("nguyenlananh.com"),
    senderPackage: createSenderPackage("nguyenlananh.com"),
    siteCode: "NLA-WEB",
    surfaceHint: "High-priority VN public site"
  },
  {
    allowedLocales: ["vi", "en"],
    currentBoardStatus: "FORM_IN_PROGRESS",
    defaultLocale: "vi",
    domain: "omdala.com",
    intakeId: "SITE-INTAKE-102",
    marketType: "VN",
    nextOpsPacketAction:
      "Confirm one-time VND launch scope, legal owner, sender mailbox ownership, and return/cancel/callback URLs; keep receiver assignment deferred until founder instruction.",
    notes: [
      "Public site for one-time VND launch prep.",
      "Sender package and researched Team D core payment email packet are already locked in repo."
    ],
    onboardingForm: VN_FORM,
    paymentAssignmentNote: "Assignment deferred until founder chooses the first live collection receiver.",
    paymentAssignmentState: "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
    payoutRequired: false,
    priority: "P0",
    requiredEvidence: [...requiredEvidence],
    requiredLinks: createDefaultRequiredLinks("omdala.com"),
    senderPackage: createSenderPackage("omdala.com"),
    siteCode: "OMDALA-WEB",
    surfaceHint: "VN web surface"
  },
  {
    allowedLocales: ["vi", "en"],
    currentBoardStatus: "FORM_IN_PROGRESS",
    defaultLocale: "vi",
    domain: "app.omdala.com",
    intakeId: "SITE-INTAKE-103",
    marketType: "VN",
    nextOpsPacketAction:
      "Confirm the app.omdala.com checkout role, legal owner, callback URLs, and mailbox ownership; keep receiver assignment deferred until founder instruction.",
    notes: [
      "App surface may become the primary collection surface later.",
      "Workspace-oriented sender package and researched Team D core payment email packet are already locked in repo."
    ],
    onboardingForm: VN_FORM,
    paymentAssignmentNote: "Assignment deferred until founder confirms whether app.omdala.com actually initiates collection.",
    paymentAssignmentState: "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
    payoutRequired: false,
    priority: "P0",
    requiredEvidence: [...requiredEvidence],
    requiredLinks: createDefaultRequiredLinks("app.omdala.com"),
    senderPackage: createSenderPackage("app.omdala.com"),
    siteCode: "OMDALA-APP",
    surfaceHint: "Conditional collection app surface"
  },
  {
    allowedLocales: ["vi", "en"],
    currentBoardStatus: "FORM_IN_PROGRESS",
    defaultLocale: "vi",
    domain: "omdalat.com",
    intakeId: "SITE-INTAKE-104",
    marketType: "VN",
    nextOpsPacketAction:
      "Keep the founder-directed Thai Lam VND receiver assignment, then lock sender mailbox ownership, one-time catalog scope, callback URLs, MAIL_API runtime binding, payment-event trigger wiring, and evidence capture.",
    notes: [
      "Founder-directed legal owner and receiver assignment is Công ty TNHH SX - TM - DV Thai Lam.",
      "Primary VND receiver is recv_vnd_thailam_acb.",
      "Sender package and researched Team D core payment email packet are already locked in repo, but live evidence is still pending."
    ],
    onboardingForm: VN_FORM,
    paymentAssignmentNote: "Founder-directed assignment is active for omdalat.com using recv_vnd_thailam_acb.",
    paymentAssignmentState: "ACTIVE_NOW",
    payoutRequired: false,
    priority: "P0",
    requiredEvidence: [...requiredEvidence],
    requiredLinks: createDefaultRequiredLinks("omdalat.com"),
    senderPackage: createSenderPackage("omdalat.com"),
    siteCode: "OMDALAT-WEB",
    surfaceHint: "VN web surface"
  },
  {
    allowedLocales: ["vi", "en"],
    currentBoardStatus: "FORM_IN_PROGRESS",
    defaultLocale: "vi",
    domain: "app.omdalat.com",
    intakeId: "SITE-INTAKE-105",
    marketType: "VN",
    nextOpsPacketAction:
      "Confirm whether app.omdalat.com initiates checkout or only consumes post-purchase state, then lock mailbox ownership and callback URLs; keep receiver assignment deferred until founder instruction.",
    notes: [
      "Keep this in the same prep wave as omdalat.com.",
      "Workspace-oriented sender package and researched Team D core payment email packet are already locked in repo."
    ],
    onboardingForm: VN_FORM,
    paymentAssignmentNote: "Assignment deferred until founder confirms whether the app is a collection or post-purchase surface.",
    paymentAssignmentState: "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
    payoutRequired: false,
    priority: "P0",
    requiredEvidence: [...requiredEvidence],
    requiredLinks: createDefaultRequiredLinks("app.omdalat.com"),
    senderPackage: createSenderPackage("app.omdalat.com"),
    siteCode: "OMDALAT-APP",
    surfaceHint: "Conditional collection app surface"
  },
  {
    allowedLocales: ["vi", "en"],
    currentBoardStatus: "FORM_SELECTION_REQUIRED",
    defaultLocale: "vi",
    domain: "flow.iai.one",
    intakeId: "SITE-INTAKE-106",
    marketType: "VN_or_INTERNATIONAL_TBD",
    nextOpsPacketAction:
      "Confirm whether flow sells credits, plans, or service packages and what currency rail is needed before selecting the formal onboarding packet.",
    notes: [
      "Builder-first product surface.",
      "Sender package and researched Team D core payment email packet are already locked in repo."
    ],
    onboardingForm: null,
    paymentAssignmentNote: "Assignment deferred until founder chooses the commercial model and first live collection rail.",
    paymentAssignmentState: "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
    payoutRequired: false,
    priority: "P1",
    requiredEvidence: [...requiredEvidence],
    requiredLinks: createDefaultRequiredLinks("flow.iai.one"),
    senderPackage: createSenderPackage("flow.iai.one"),
    siteCode: "FLOW",
    surfaceHint: "Builder-first product site"
  },
  {
    allowedLocales: ["vi", "en"],
    currentBoardStatus: "FORM_SELECTION_REQUIRED",
    defaultLocale: "vi",
    domain: "life.iai.one",
    intakeId: "SITE-INTAKE-107",
    marketType: "VN_or_INTERNATIONAL_TBD",
    nextOpsPacketAction:
      "Lock product model, owner truth, payout need, and market type before selecting the formal onboarding packet.",
    notes: [
      "Commerce model still needs product truth.",
      "Sender package and researched Team D core payment email packet are already locked in repo."
    ],
    onboardingForm: null,
    paymentAssignmentNote: "Assignment deferred until founder confirms the commercial model and whether payouts exist.",
    paymentAssignmentState: "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
    payoutRequired: null,
    priority: "P1",
    requiredEvidence: [...requiredEvidence],
    requiredLinks: createDefaultRequiredLinks("life.iai.one"),
    senderPackage: createSenderPackage("life.iai.one"),
    siteCode: "LIFE-IAI",
    surfaceHint: "Warm-human product surface"
  },
  {
    allowedLocales: ["vi", "en"],
    currentBoardStatus: "FORM_IN_PROGRESS",
    defaultLocale: "vi",
    domain: "vc.vetuonglai.com",
    intakeId: "SITE-INTAKE-108",
    marketType: "VN",
    nextOpsPacketAction:
      "Confirm the exact paid product, owner, mailbox ownership, and callback endpoint; keep receiver assignment deferred until founder instruction.",
    notes: [
      "Keep vocabulary aligned with the current Về Tương Lai contract.",
      "Sender package and researched Team D core payment email packet are already locked in repo."
    ],
    onboardingForm: VN_FORM,
    paymentAssignmentNote: "Founder-locked dual-rail assignment: VND via recv_vnd_thanhtamphat_acb, USD via recv_usd_angeledutam_foundation_relay_thread; ID-country policy decides currency at checkout.",
    paymentAssignmentState: "ACTIVE_NOW",
    payoutRequired: false,
    priority: "P1",
    requiredEvidence: [...requiredEvidence],
    requiredLinks: createDefaultRequiredLinks("vc.vetuonglai.com"),
    senderPackage: createSenderPackage("vc.vetuonglai.com"),
    siteCode: "VC",
    surfaceHint: "Về Tương Lai paid VC surface"
  },
  {
    allowedLocales: ["vi", "en"],
    currentBoardStatus: "FORM_IN_PROGRESS",
    defaultLocale: "vi",
    domain: "invest.vetuonglai.com",
    intakeId: "SITE-INTAKE-109",
    marketType: "VN",
    nextOpsPacketAction:
      "Run product, finance, and risk alignment, then lock owner, disclosure links, and callback packet; keep receiver assignment deferred until founder instruction.",
    notes: [
      "Risk review remains a separate gate from payment assignment.",
      "Sender package and researched Team D core payment email packet are already locked in repo."
    ],
    onboardingForm: VN_FORM,
    paymentAssignmentNote: "Founder-locked dual-rail assignment: VND via recv_vnd_thanhtamphat_acb, USD via recv_usd_angeledutam_foundation_relay_thread; risk lane remains a separate gate.",
    paymentAssignmentState: "ACTIVE_NOW",
    payoutRequired: false,
    priority: "P1",
    requiredEvidence: [...requiredEvidence],
    requiredLinks: createDefaultRequiredLinks("invest.vetuonglai.com"),
    senderPackage: createSenderPackage("invest.vetuonglai.com"),
    siteCode: "INVEST",
    surfaceHint: "Risk-reviewed VN offer surface"
  },
  {
    allowedLocales: ["vi", "en"],
    currentBoardStatus: "FORM_IN_PROGRESS",
    defaultLocale: "vi",
    domain: "life.vetuonglai.com",
    intakeId: "SITE-INTAKE-110",
    marketType: "VN",
    nextOpsPacketAction:
      "Confirm whether life.vetuonglai.com is a direct collection or support-only surface, then lock owner, mailbox ownership, and callback URLs; keep receiver assignment deferred until founder instruction.",
    notes: [
      "Do not assume subscription language.",
      "Sender package and researched Team D core payment email packet are already locked in repo."
    ],
    onboardingForm: VN_FORM,
    paymentAssignmentNote: "Founder-locked dual-rail assignment: VND via recv_vnd_thanhtamphat_acb, USD via recv_usd_angeledutam_foundation_relay_thread; collection-vs-support role remains a separate scope question.",
    paymentAssignmentState: "ACTIVE_NOW",
    payoutRequired: false,
    priority: "P1",
    requiredEvidence: [...requiredEvidence],
    requiredLinks: createDefaultRequiredLinks("life.vetuonglai.com"),
    senderPackage: createSenderPackage("life.vetuonglai.com"),
    siteCode: "LIFE-VTL",
    surfaceHint: "Support or access surface"
  },
  {
    allowedLocales: ["en", "vi"],
    currentBoardStatus: "FORM_IN_PROGRESS",
    defaultLocale: "en",
    domain: "aiaccountingloop.com",
    intakeId: "SITE-INTAKE-111",
    marketType: "INTERNATIONAL",
    nextOpsPacketAction:
      "Run international onboarding intake, lock legal owner and collection-only versus collection-plus-payout scope, then confirm callback URLs and mailbox ownership; keep receiver assignment deferred until founder instruction.",
    notes: [
      "International governance stays separate from receiver assignment.",
      "Sender package and researched Team D core payment email packet are already locked in repo."
    ],
    onboardingForm: INTERNATIONAL_FORM,
    paymentAssignmentNote: "Assignment deferred until founder confirms collection-only versus collection-plus-payout and selects the live rail.",
    paymentAssignmentState: "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
    payoutRequired: null,
    priority: "P1",
    requiredEvidence: [...requiredEvidence],
    requiredLinks: createDefaultRequiredLinks("aiaccountingloop.com"),
    senderPackage: createSenderPackage("aiaccountingloop.com"),
    siteCode: "AAL",
    surfaceHint: "International collection or billing surface"
  },
  {
    allowedLocales: ["vi", "en"],
    currentBoardStatus: "FORM_IN_PROGRESS",
    defaultLocale: "vi",
    domain: "tramsaigon.com",
    intakeId: "SITE-INTAKE-112",
    marketType: "VN",
    nextOpsPacketAction:
      "Repo-side packet is locked (sender package, Team D core 4-template email registry, intake form bound). Founder still needs to lock paid offers, owner truth (company vs individual), and receiver assignment before payment goes live.",
    notes: [
      "Prep early but keep out of the immediate P0/P1 live wave.",
      "Sender package and researched Team D core payment email packet are already locked in repo.",
      "Promoted from NEW_INTAKE to FORM_IN_PROGRESS on 2026-04-28 by AI Owner Pay+Email — the VN onboarding form is bound, sender package fixed, and 4-template Team D core payment email set is locked. Live activation still blocked on founder receiver lock."
    ],
    onboardingForm: VN_FORM,
    paymentAssignmentNote: "Assignment deferred until founder locks the first paid offer and receiver.",
    paymentAssignmentState: "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
    payoutRequired: null,
    priority: "P2",
    requiredEvidence: [...requiredEvidence],
    requiredLinks: createDefaultRequiredLinks("tramsaigon.com"),
    senderPackage: createSenderPackage("tramsaigon.com"),
    siteCode: "TRAMSAIGON",
    surfaceHint: "VN public launch surface"
  },
  {
    allowedLocales: ["vi", "en"],
    currentBoardStatus: "FORM_SELECTION_REQUIRED",
    defaultLocale: "vi",
    domain: "app.iai.one",
    intakeId: "SITE-INTAKE-113",
    marketType: "TBD",
    nextOpsPacketAction:
      "Confirm whether app.iai.one is a direct collection surface or only a downstream account surface before selecting the formal onboarding packet.",
    notes: [
      "Do not treat app.iai.one as payment-active by default.",
      "Sender package and researched Team D core payment email packet are already locked in repo."
    ],
    onboardingForm: null,
    paymentAssignmentNote: "Assignment deferred until founder confirms collection role.",
    paymentAssignmentState: "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
    payoutRequired: false,
    priority: "P2",
    requiredEvidence: [...requiredEvidence],
    requiredLinks: createDefaultRequiredLinks("app.iai.one"),
    senderPackage: createSenderPackage("app.iai.one"),
    siteCode: "APP",
    surfaceHint: "Account surface with conditional payment role"
  },
  {
    allowedLocales: ["vi", "en"],
    currentBoardStatus: "FORM_SELECTION_REQUIRED",
    defaultLocale: "vi",
    domain: "noos.iai.one",
    intakeId: "SITE-INTAKE-114",
    marketType: "TBD",
    nextOpsPacketAction:
      "Lock the first commercial wave and payment model before selecting the formal onboarding packet.",
    notes: [
      "Leave commerce meaning-layer decisions open, but keep the prep packet ready.",
      "Sender package and researched Team D core payment email packet are already locked in repo."
    ],
    onboardingForm: null,
    paymentAssignmentNote: "Assignment deferred until founder defines the first collection rail.",
    paymentAssignmentState: "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
    payoutRequired: null,
    priority: "P2",
    requiredEvidence: [...requiredEvidence],
    requiredLinks: createDefaultRequiredLinks("noos.iai.one"),
    senderPackage: createSenderPackage("noos.iai.one"),
    siteCode: "NOOS",
    surfaceHint: "Commerce meaning-layer candidate"
  },
  {
    allowedLocales: ["vi", "en"],
    currentBoardStatus: "BLOCKED",
    defaultLocale: "vi",
    domain: "cios.iai.one",
    intakeId: "SITE-INTAKE-115",
    marketType: "TBD",
    nextOpsPacketAction:
      "Wait for product and policy closure before onboarding or Team B mapping resumes.",
    notes: [
      "Enterprise contract wording only.",
      "Blocked does not remove the site from prep coverage.",
      "Sender package and researched Team D core payment email packet are already locked in repo."
    ],
    onboardingForm: null,
    paymentAssignmentNote: "Assignment deferred until founder reopens policy and business scope for CIOS.",
    paymentAssignmentState: "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
    payoutRequired: false,
    priority: "P3",
    requiredEvidence: [...requiredEvidence],
    requiredLinks: createDefaultRequiredLinks("cios.iai.one"),
    senderPackage: createSenderPackage("cios.iai.one"),
    siteCode: "CIOS",
    surfaceHint: "Enterprise contract surface"
  },
  {
    allowedLocales: ["vi", "en"],
    currentBoardStatus: "BLOCKED",
    defaultLocale: "vi",
    domain: "lamviec.muonnoi.org",
    intakeId: "SITE-INTAKE-116",
    marketType: "VN_or_INTERNATIONAL_TBD",
    nextOpsPacketAction:
      "Do not migrate until recurring/subscription compatibility and the target payment model are explicitly approved.",
    notes: [
      "Migration remains blocked, but the packet can still be prepared.",
      "Sender package and researched Team D core payment email packet are already locked in repo."
    ],
    onboardingForm: null,
    paymentAssignmentNote: "Assignment deferred until founder approves migration compatibility and the target payment model.",
    paymentAssignmentState: "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
    payoutRequired: null,
    priority: "P3",
    requiredEvidence: [...requiredEvidence],
    requiredLinks: createDefaultRequiredLinks("lamviec.muonnoi.org"),
    senderPackage: createSenderPackage("lamviec.muonnoi.org"),
    siteCode: "LAMVIECMUONNOI",
    surfaceHint: "Migration candidate with compatibility risk"
  }
];

export function getSiteActivationRegistryEntry(domain: string): SiteActivationRegistryEntry | null {
  const normalized = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
  return siteActivationRegistryEntries.find((entry) => entry.domain === normalized) ?? null;
}

export function getSiteActivationRegistrySnapshot(): SiteActivationRegistrySnapshot {
  const activeNow = siteActivationRegistryEntries.filter(
    (entry) => entry.paymentAssignmentState === "ACTIVE_NOW"
  ).length;
  const deferred = siteActivationRegistryEntries.filter(
    (entry) => entry.paymentAssignmentState === "DEFERRED_UNTIL_FOUNDER_INSTRUCTION"
  ).length;
  const vn = siteActivationRegistryEntries.filter((entry) => entry.marketType === "VN").length;
  const international = siteActivationRegistryEntries.filter(
    (entry) => entry.marketType === "INTERNATIONAL"
  ).length;
  const tbd = siteActivationRegistryEntries.length - vn - international;

  return {
    assignmentCounts: {
      activeNow,
      deferredUntilFounderInstruction: deferred
    },
    hardRules: [
      "All 17 Team D intake sites must have prep packets even when payment assignment is deferred.",
      "Do not attach receiver or payout assignments for deferred domains until founder instruction exists.",
      "Prepared does not mean live; provider proof and payment email evidence still gate live claims."
    ],
    marketCounts: {
      international,
      tbd,
      vn
    },
    scope: "team_d_intake_sites",
    sites: siteActivationRegistryEntries,
    totalSites: siteActivationRegistryEntries.length,
    version: "2026-04-22"
  };
}
