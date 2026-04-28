import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "../../../");
const docsRoot = path.join(workspaceRoot, "docs", "noos");
const fixturesRoot = path.join(docsRoot, "NOOS_COMMERCE_FIXTURES_v0.1");

export type ProductCode =
  | "P01"
  | "P02"
  | "P03"
  | "P04"
  | "P05"
  | "P06"
  | "P07"
  | "P08"
  | "P09"
  | "P10"
  | "P11"
  | "P12";

export interface ProductDefinition {
  productCode: ProductCode;
  name: string;
  route: string;
  tier: string;
  priceUsd: number;
  positioning: string;
  audience: string[];
  includedItems: string[];
  deliverables: string[];
  defaultLicense: string;
  updatePolicy: {
    windowLabel: string;
    updateTypes: string[];
    upgradePath: string;
  };
  primaryCta: string;
  secondaryUpsell: string;
  entitlementCode: string;
  pageTemplateClass: string;
}

export interface ProductCatalogFixture {
  version: string;
  products: ProductDefinition[];
}

export interface PriceTier {
  tier: string;
  minPriceUsd: number;
  maxPriceUsd: number;
}

export interface UpgradeCreditPolicy {
  fromTier: string;
  toTier: string;
  windowDays: number;
  creditPercent: number;
  creditCapUsd?: number;
}

export interface LicensePolicy {
  licenseType: string;
  minSeats: number;
  maxSeats: number;
  allowsExternalSharing: boolean;
}

export interface PricingLadder {
  currency: string;
  priceTiers: PriceTier[];
  upgradeCreditPolicies: UpgradeCreditPolicy[];
  licensePolicies: LicensePolicy[];
}

export interface LibraryItem {
  productCode: ProductCode;
  name: string;
  currentVersion: string;
  purchasedDate: string;
  licenseType: string;
  updateStatus: "current" | "update_available" | "window_expired" | "upgraded";
  actions: string[];
}

export interface RecommendationResult {
  nextProductPrimary: string;
  nextProductSecondary?: string;
  upgradeLicenseOffer?: string;
  ruleRef?: string;
}

export interface ProductCatalogEntry {
  productCode: ProductCode;
  name: string;
  route: string;
  tier: string;
  priceUsd: number;
  defaultLicense: string;
  primaryUpsell: string;
}

export interface LibraryView {
  buyerId: string;
  items: LibraryItem[];
  recommendations: RecommendationResult;
  routeSet: string[];
}

export interface OrderRecord {
  orderId: string;
  buyerId: string;
  productCode: ProductCode;
  licenseType: string;
  amountSnapshotUsd: number;
  checkoutSessionId: string;
  status: string;
  purchasedAt: string;
  entitlementIds: string[];
}

export interface Team3SurfaceContract {
  routes: string[];
  requiredComponents: string[];
  productPageSections: string[];
  uiStates: string[];
  integrationCheckpoints: string[];
}

export interface LaunchWave {
  waveId: string;
  label: string;
  productCodes: ProductCode[];
}

export interface Team4OperationsContract {
  launchWaves: LaunchWave[];
  kpis: string[];
  supportSla: {
    firstResponseHours: number;
    resolutionHours: number;
    queues: string[];
  };
  guardrails: string[];
  runbooks: string[];
}

export interface CheckoutSessionReceipt {
  checkoutSessionId: string;
  productCode: ProductCode;
  licenseType: string;
  redirectUrl: string;
  fulfillmentStatus: string;
}

export interface CheckoutFlowResult {
  orderId: string;
  buyerId: string;
  productCode: ProductCode;
  licenseType: string;
  checkoutSessionId: string;
}

export interface EntitlementRecord {
  entitlementId: string;
  buyerId: string;
  productCode: ProductCode;
  licenseType: string;
  orderId: string;
  grantedAt: string;
  accessStatus: string;
  updateWindowEnd: string;
  entitlementCode: string;
  versionScope: string;
}

export type BuyerRole = "individual" | "builder" | "team" | "institution";

export interface BuyerRoleProfile {
  role: BuyerRole;
  label: string;
  line: string;
  heroLine: string;
  recommendedProductCodes: ProductCode[];
}

export type CommerceSourceMode = "local-fixtures" | "api-optional" | "api-required";

interface CommerceSchemaPack {
  components: {
    examples: {
      PricingLadderV1: {
        value: PricingLadder;
      };
      Team3SurfaceExample: {
        value: Team3SurfaceContract;
      };
      Team4OpsExample: {
        value: Team4OperationsContract;
      };
    };
  };
}

interface CommerceData {
  catalog: ProductCatalogFixture;
  pricing: PricingLadder;
  team3Surface: Team3SurfaceContract;
  team4Operations: Team4OperationsContract;
  libraries: Map<string, LibraryView>;
  productsByCode: Map<ProductCode, ProductDefinition>;
  productsBySlug: Map<string, ProductDefinition>;
}

const copyNotes: Record<
  ProductCode,
  {
    problems: string[];
    whyItMatters: string;
    faq: Array<{ question: string; answer: string }>;
    theme: string;
    color: string;
    imageSeed: string;
  }
> = {
  P01: {
    problems: [
      "Loai bo nhap mon roi rac khi buyer moi chua co ngon ngu chung.",
      "Rut ngan duong tu hieu y tuong sang nam duoc he thong.",
      "Bien su quan tam ban dau thanh mot nhan diem co cau truc."
    ],
    whyItMatters:
      "Foundation Pack giup nguoi moi buoc vao NOOS bang mot bo tu vung ro rang, khong bi dut mach giua triethoc, he thong, va ung dung.",
    faq: [
      {
        question: "Nhan duoc gi sau thanh toan?",
        answer: "Buyer nhan file PDF va library entry ngay sau khi fulfillment hoan tat."
      },
      {
        question: "Co duoc chia se noi bo khong?",
        answer: "Ban mac dinh la Individual, nen khong duoc chia se cho team."
      },
      {
        question: "Khi nao nen nang cap?",
        answer: "Nen di tiep sang P02 neu can mot ban white paper chinh quy hon."
      }
    ],
    theme: "Foundation",
    color: "#c85d3a",
    imageSeed: "noos-foundation"
  },
  P02: {
    problems: [
      "Can mot ban white paper nghiem tuc de doc va trich dan noi bo.",
      "Can bo diagrams va thu tu doc de khong bi ngat mach.",
      "Can mot diem vao co the dung cho research va strategy review."
    ],
    whyItMatters:
      "White Paper Edition dong vai tro van ban chinh thuc de team strategy, research, va innovation noi chung mot he tham chieu.",
    faq: [
      {
        question: "Ban nay khac gi noi dung free?",
        answer: "Ban nay khoa lai thanh mot edition co cau truc, co diagrams appendix, va co library access."
      },
      {
        question: "Co update khong?",
        answer: "Co cua so minor updates 6 thang theo lock pricing."
      },
      {
        question: "Buoc tiep theo la gi?",
        answer: "P03 la buoc hop ly neu can boundary map va architecture map."
      }
    ],
    theme: "Foundation",
    color: "#a64b63",
    imageSeed: "noos-whitepaper"
  },
  P03: {
    problems: [
      "Can thay ranh gioi he thong thay vi chi doc mo ta.",
      "Can map de align product, design, dev, va governance.",
      "Can mot architecture pack co the dua thang vao planning va implementation."
    ],
    whyItMatters:
      "P03 bien NOOS tu mot y tuong thanh mot so do he thong co the de review, handoff, va lock execution.",
    faq: [
      {
        question: "Pack nay dung cho ai?",
        answer: "System architects, product leaders, va innovation offices can boundary map that."
      },
      {
        question: "Co license team khong?",
        answer: "Mac dinh la Individual va co mapped upgrade path len team/org."
      },
      {
        question: "Nen mua rieng hay len Master?",
        answer: "Neu can bo tong hop de di nhanh voi nhieu team, P11 la buoc nang cap hop ly."
      }
    ],
    theme: "Architecture",
    color: "#007a78",
    imageSeed: "noos-architecture"
  },
  P04: {
    problems: [
      "Can mot khung 8 layers de nhin future-tech nhu mot stack co trinh tu.",
      "Can ket noi giua lop cong nghe, governance, va deployment reality.",
      "Can mot handbook de day, hoc, va explain nhanh."
    ],
    whyItMatters:
      "P04 gom he thong 8 layers thanh mot handbook co the scan nhanh nhung van du sau de dua vao planning va learning track.",
    faq: [
      {
        question: "Day la handbook hay essay?",
        answer: "Day la handbook co model, maps, risk notes, va application paths."
      },
      {
        question: "Co update gi?",
        answer: "Minor updates trong cua so 6 thang."
      },
      {
        question: "Buoc nang cap nao phu hop?",
        answer: "P11 neu can nhieu lop gia tri trong cung mot bundle."
      }
    ],
    theme: "Foundation",
    color: "#5a8f29",
    imageSeed: "noos-layers"
  },
  P05: {
    problems: [
      "Can governance pack de bounded autonomy va rollback khong bi mo ho.",
      "Can ngon ngu chung cho trust, sovereignty, va human veto.",
      "Can bo material de chot guardrails truoc khi build runtime."
    ],
    whyItMatters:
      "P05 dua governance vao trung tam cua he thong, de moi quyet dinh tu runtime den launch deu co ranh gioi ro rang va audit duoc.",
    faq: [
      {
        question: "Noi dung nay nghieng policy hay product?",
        answer: "No nghieng policy, trust, va implementation guardrails cho accountable systems."
      },
      {
        question: "Co phu hop cho trust/safety team?",
        answer: "Co. Day la mot trong nhung audience chinh."
      },
      {
        question: "Buoc tiep theo nen la gi?",
        answer: "P06 neu can day sang security direction va PQC-era trust."
      }
    ],
    theme: "Governance",
    color: "#9a3d28",
    imageSeed: "noos-governance"
  },
  P06: {
    problems: [
      "Can security direction de trust khong dung o muc TLS va RSA legacy.",
      "Can bo dinh huong cho evidence traceability va auditability.",
      "Can mot reference de align security architects va infra strategists."
    ],
    whyItMatters:
      "P06 dat trust fabric vao huong PQC-era ngay tu dau, giup he thong co duong di ro rang cho identity, signatures, va evidence.",
    faq: [
      {
        question: "Pack nay co phai security implementation guide khong?",
        answer: "No la direction pack chien luoc cho trust systems, khong phai hardening checklist chung chung."
      },
      {
        question: "Co update khong?",
        answer: "Co minor updates trong 6 thang."
      },
      {
        question: "Nen ket hop voi pack nao?",
        answer: "P11 neu can dat security direction vao context rong hon cua NOOS."
      }
    ],
    theme: "Trust",
    color: "#875e10",
    imageSeed: "noos-security"
  },
  P07: {
    problems: [
      "Can profile thuc chien cho deployment o Viet Nam thay vi framing truu tuong.",
      "Can mission classes, connectivity matrix, va sovereignty notes co the su dung ngay.",
      "Can ngam local resilience vao system planning tu dau."
    ],
    whyItMatters:
      "P07 dua NOOS xuong mat dat Viet Nam bang mission classes, corridor logic, va governance framing co the dung cho resilience planning ngay.",
    faq: [
      {
        question: "Pack nay phu hop cho team nao?",
        answer: "Vietnam planners, resilience teams, va infra strategists la audience trung tam."
      },
      {
        question: "No nghieng ly thuyet hay field deployment?",
        answer: "No nghieng field deployment worldview cho dieu kien resilience tai Viet Nam."
      },
      {
        question: "Buoc tiep theo la gi?",
        answer: "P08 neu can mo rong sang distributed sensing va care-grid systems."
      }
    ],
    theme: "Vietnam",
    color: "#006c5f",
    imageSeed: "noos-vietnam"
  },
  P08: {
    problems: [
      "Can mot program de gom field intelligence va care-grid logic vao mot bo.",
      "Can goc nhin distributed sensing ma khong roi vao dashboard noise.",
      "Can framing cho teams build resilience quanh field operations."
    ],
    whyItMatters:
      "P08 dua distributed sensing, field coordination, va care-grid thanh mot program co tinh he thong, huu ich cho resilience planners va environmental teams.",
    faq: [
      {
        question: "Program nay khac pack thong thuong o diem nao?",
        answer: "No sau hon o structure, diagrams, va cach bo tri gia tri cho mot chuong trinh phan tan."
      },
      {
        question: "Gia tri reuse nam o dau?",
        answer: "O care-grid model, sensing framework, va field coordination logic co the dung lai."
      },
      {
        question: "Buoc tiep theo la gi?",
        answer: "P11 neu can gom nhieu lop gia tri vao mot flagship bundle."
      }
    ],
    theme: "Grid",
    color: "#2b7f95",
    imageSeed: "noos-grid"
  },
  P09: {
    problems: [
      "Can utility-grade framing cho NTN va orbital continuity.",
      "Can networking duoc dat trong mission context thay vi mo ta tang cua.",
      "Can ket noi giua network architects va resilience teams."
    ],
    whyItMatters:
      "P09 giup NTN va orbital continuity duoc doc nhu utility layer phuc vu mission continuity, khong phai mot bo tu khoa cong nghe roi rac.",
    faq: [
      {
        question: "Audience chinh la ai?",
        answer: "Connectivity strategists, network architects, va resilience teams."
      },
      {
        question: "Pack nay co diagrams khong?",
        answer: "Co connectivity diagrams va program structure day du."
      },
      {
        question: "Nen leo ladder nhu the nao?",
        answer: "P11 la buoc tiep theo neu can bo tong hop rong hon."
      }
    ],
    theme: "Orbit",
    color: "#704fa0",
    imageSeed: "noos-orbit"
  },
  P10: {
    problems: [
      "Can biofuture framing co ky luat, khong bi sa vao slogan.",
      "Can regenerative systems duoc nhin cung governance lens.",
      "Can mot program sau hon cho advanced readers va innovation leads."
    ],
    whyItMatters:
      "P10 giu cho biology va regenerative systems di cung governance discipline, de buyer nhin thay ca co hoi lan gioi han cua lop nay.",
    faq: [
      {
        question: "Pack nay co nghieng speculative khong?",
        answer: "No giu ky luat, tap trung vao framework, systems, va biosafety notes."
      },
      {
        question: "Phu hop voi ai?",
        answer: "Biofuture researchers, innovation leads, va advanced readers."
      },
      {
        question: "Upsell hop ly la gi?",
        answer: "P11 neu can bo tong hop flagship."
      }
    ],
    theme: "Bios",
    color: "#8e3b6f",
    imageSeed: "noos-bios"
  },
  P11: {
    problems: [
      "Can mot bo flagship de khong phai mua tung pack roi tu map lai.",
      "Can mot bundle dung du cho serious buyers va cross-functional readers.",
      "Can mot library asset co gia tri reuse cao va ladder ro len team."
    ],
    whyItMatters:
      "P11 la diem gom luc cua NOOS commerce: mot bundle flagship co the mo ngay, hoc nhanh, va dua vao alignment giua strategy, architecture, va governance.",
    faq: [
      {
        question: "P11 gom gi ben trong?",
        answer: "P02, P03, P04, P05, bonus sheets/index, va bundle access trong library."
      },
      {
        question: "Co duoc nang cap len team khong?",
        answer: "Co mapped upgrade path len P12 trong cua so lock."
      },
      {
        question: "Bao lau duoc update?",
        answer: "Selected updates trong 12 thang."
      }
    ],
    theme: "Master",
    color: "#b2541d",
    imageSeed: "noos-master"
  },
  P12: {
    problems: [
      "Can mot bo handoff team-ready de product, design, va dev cung nhin mot truoc.",
      "Can seat-aware license thay cho viec chia se ad hoc.",
      "Can buoc chuyen tu individual buying sang org-level implementation."
    ],
    whyItMatters:
      "P12 la bo chuyen trang thai tu buyer ca nhan sang builder team, giu cho architecture handoff, route logic, va checklist di cung mot license team-ready.",
    faq: [
      {
        question: "License mac dinh cua P12 la gi?",
        answer: "Small Team la license mac dinh, va co inquiry path cho Organization."
      },
      {
        question: "P12 co phu hop cho innovation office khong?",
        answer: "Co, day la mot audience chinh cua bundle nay."
      },
      {
        question: "Buoc tiep theo sau P12 la gi?",
        answer: "Organization / Strategic license inquiry."
      }
    ],
    theme: "Teams",
    color: "#0f7c74",
    imageSeed: "noos-team"
  }
};

let cachedData: CommerceData | null = null;

const buyerRoleProfiles: BuyerRoleProfile[] = [
  {
    role: "individual",
    label: "Individual",
    line: "Doc nhanh, vao dung product, va giu duoc ladder ro rang.",
    heroLine:
      "Structured NOOS products cho nguoi mua ca nhan can vao nhanh, mua dung, va leo dung ladder.",
    recommendedProductCodes: ["P01", "P03", "P11"]
  },
  {
    role: "builder",
    label: "Builder",
    line: "Nghieng architecture, governance, Vietnam field profile, va flagship bundle.",
    heroLine:
      "Builder view day P03, P05, P07, va P11 len truoc de product, design, dev co mot ngon ngu chung.",
    recommendedProductCodes: ["P03", "P05", "P07", "P11"]
  },
  {
    role: "team",
    label: "Team",
    line: "Nghieng team-ready handoff, license clarity, va bundle path len org.",
    heroLine:
      "Team view uu tien bundle, upgrade window, va handoff surfaces de vao implementation nhanh hon.",
    recommendedProductCodes: ["P11", "P12", "P03"]
  },
  {
    role: "institution",
    label: "Institution",
    line: "Nghieng governance, trust, sovereignty, va inquiry path o lop cao hon.",
    heroLine:
      "Institution view uu tien governance, trust, Vietnam profile, va cac route tien len organization path.",
    recommendedProductCodes: ["P05", "P06", "P07", "P12"]
  }
];

function readJsonFile<T>(...segments: string[]): T {
  const filePath = path.join(...segments);
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function slugFromRoute(route: string): string {
  return route.split("/").filter(Boolean).at(-1) ?? "";
}

function loadData(): CommerceData {
  if (cachedData) return cachedData;

  const catalog = readJsonFile<ProductCatalogFixture>(
    fixturesRoot,
    "catalog",
    "product_definitions_all_v1.json"
  );
  const pricingPack = readJsonFile<CommerceSchemaPack>(
    docsRoot,
    "NOOS_COMMERCE_SCHEMA_PACK_v0.1.json"
  );
  const libraries = new Map<string, LibraryView>();

  for (const relativePath of [
    ["library", "library_active_master.json"],
    ["library", "library_expired_updates_architecture.json"],
    ["library", "library_upgraded_master_to_team.json"],
    ["library", "library_update_available_vietnam.json"]
  ]) {
    const library = readJsonFile<LibraryView>(fixturesRoot, ...relativePath);
    libraries.set(library.buyerId, library);
  }

  const productsByCode = new Map<ProductCode, ProductDefinition>();
  const productsBySlug = new Map<string, ProductDefinition>();
  for (const product of catalog.products) {
    productsByCode.set(product.productCode, product);
    productsBySlug.set(slugFromRoute(product.route), product);
  }

  cachedData = {
    catalog,
    pricing: pricingPack.components.examples.PricingLadderV1.value,
    team3Surface: pricingPack.components.examples.Team3SurfaceExample.value,
    team4Operations: pricingPack.components.examples.Team4OpsExample.value,
    libraries,
    productsByCode,
    productsBySlug
  };

  return cachedData;
}

export function getCatalog(): ProductCatalogFixture {
  return loadData().catalog;
}

export function getPricing(): PricingLadder {
  return loadData().pricing;
}

export function getTeam3Surface(): Team3SurfaceContract {
  return loadData().team3Surface;
}

export function getTeam4Operations(): Team4OperationsContract {
  return loadData().team4Operations;
}

export function getProductByCode(productCode: ProductCode): ProductDefinition | undefined {
  return loadData().productsByCode.get(productCode);
}

export function getProductBySlug(slug: string): ProductDefinition | undefined {
  return loadData().productsBySlug.get(slug);
}

export function getProductsByCollection(collection: "all" | "documents" | "programs"): ProductDefinition[] {
  const products = getCatalog().products;
  if (collection === "documents") {
    return products.filter((product) =>
      ["Entry", "Entry/Core", "Core", "Master"].includes(product.tier)
    );
  }
  if (collection === "programs") {
    return products.filter((product) => product.tier === "Advanced Program");
  }
  return products;
}

export function getLibrary(buyerId: string): LibraryView | undefined {
  return loadData().libraries.get(buyerId);
}

export function getDefaultBuyerId(): string {
  return "buyer_alpha001";
}

export function getRoleProfiles(): BuyerRoleProfile[] {
  return buyerRoleProfiles;
}

export function getRoleProfile(role: string | null | undefined): BuyerRoleProfile {
  return buyerRoleProfiles.find((entry) => entry.role === role) ?? buyerRoleProfiles[0]!;
}

export function getCopyNotes(productCode: ProductCode) {
  return copyNotes[productCode];
}

const crossSellMap: Record<
  ProductCode,
  { primary: string; secondary?: string; sibling?: ProductCode }
> = {
  P01: { primary: "P02", sibling: "P04" },
  P02: { primary: "P03", sibling: "P01" },
  P03: { primary: "P11", secondary: "P05", sibling: "P07" },
  P04: { primary: "P11", sibling: "P01" },
  P05: { primary: "P06", secondary: "P11", sibling: "P03" },
  P06: { primary: "P11", sibling: "P05" },
  P07: { primary: "P08", secondary: "P11", sibling: "P03" },
  P08: { primary: "P11", sibling: "P09" },
  P09: { primary: "P11", sibling: "P08" },
  P10: { primary: "P11", sibling: "P08" },
  P11: { primary: "P12", sibling: "P03" },
  P12: { primary: "Organization Inquiry", sibling: "P11" }
};

export function getRelatedProducts(productCode: ProductCode): ProductDefinition[] {
  const relation = crossSellMap[productCode];
  const products: ProductDefinition[] = [];

  if (relation.primary.startsWith("P")) {
    const product = getProductByCode(relation.primary as ProductCode);
    if (product) products.push(product);
  }

  if (relation.secondary?.startsWith("P")) {
    const product = getProductByCode(relation.secondary as ProductCode);
    if (product && !products.some((item) => item.productCode === product.productCode)) {
      products.push(product);
    }
  }

  if (relation.sibling) {
    const product = getProductByCode(relation.sibling);
    if (product && !products.some((item) => item.productCode === product.productCode)) {
      products.push(product);
    }
  }

  return products.slice(0, 3);
}

export function getRecommendationForOwnedProducts(productCodes: ProductCode[]): RecommendationResult {
  const lastCode = productCodes.at(-1) ?? "P11";
  const relation = crossSellMap[lastCode];
  const owned = new Set(productCodes);
  const primaryAllowed =
    relation.primary.startsWith("P") && owned.has(relation.primary as ProductCode)
      ? undefined
      : relation.primary;
  const secondaryAllowed =
    relation.secondary && relation.secondary.startsWith("P") && owned.has(relation.secondary as ProductCode)
      ? undefined
      : relation.secondary;

  return {
    nextProductPrimary: primaryAllowed ?? "Organization Inquiry",
    nextProductSecondary: secondaryAllowed,
    upgradeLicenseOffer:
      lastCode === "P11" ? "Small Team" : lastCode === "P12" ? "Organization" : undefined,
    ruleRef: `${lastCode}->${primaryAllowed ?? "Organization Inquiry"}`
  };
}

export function getProductImageUrl(productCode: ProductCode): string {
  const note = getCopyNotes(productCode);
  return `https://picsum.photos/seed/${note.imageSeed}/1600/900`;
}

export function getCollectionHeroImage(collection: "all" | "documents" | "programs"): string {
  const seed =
    collection === "documents" ? "noos-documents" : collection === "programs" ? "noos-programs" : "noos-catalog";
  return `https://picsum.photos/seed/${seed}/1600/900`;
}

export function getTierSummary(): Array<{ tier: string; line: string }> {
  return [
    {
      tier: "Entry",
      line: "Nhan diem de vao ngon ngu va worldview cua NOOS."
    },
    {
      tier: "Core",
      line: "Pack co the dua vao planning, architecture, governance, va field deployment."
    },
    {
      tier: "Advanced Program",
      line: "Program sau hon cho Grid, Orbit, va Bios."
    },
    {
      tier: "Master",
      line: "Flagship bundle cho serious individual buyers."
    },
    {
      tier: "Team",
      line: "Builder bundle cho team, innovation office, va org path."
    }
  ];
}

export function getDocumentsSlug(product: ProductDefinition): string {
  return slugFromRoute(product.route);
}

export function getSupportFaq() {
  return [
    {
      question: "Nhan duoc gi sau thanh toan?",
      answer: "Product mo ngay trong buyer library va co link tai file neu entitlement cho phep."
    },
    {
      question: "Day co phai san pham vat ly khong?",
      answer: "Khong. Day la digital products co library access va version handling."
    },
    {
      question: "Co duoc share voi team khong?",
      answer: "Chi khi license cho phep. Team path mac dinh bat dau o P12."
    },
    {
      question: "Neu het cua so update thi sao?",
      answer: "Buyer van giu access theo entitlement, nhung update moi se chuyen sang upgrade note."
    }
  ];
}

function getCommerceApiBase(): string | null {
  const value = process.env.NOOS_COMMERCE_API_BASE?.trim();
  return value ? value.replace(/\/+$/, "") : null;
}

function requireCommerceApi(): boolean {
  return process.env.NOOS_COMMERCE_REQUIRE_API === "1";
}

export function getCommerceSourceMode(): CommerceSourceMode {
  const apiBase = getCommerceApiBase();
  if (!apiBase) return "local-fixtures";
  return requireCommerceApi() ? "api-required" : "api-optional";
}

function buildEmptyLibrary(buyerId: string): LibraryView {
  return {
    buyerId,
    items: [],
    recommendations: {
      nextProductPrimary: "P01",
      nextProductSecondary: "P03",
      ruleRef: "empty->P01"
    },
    routeSet: [
      "/library",
      "/library/updates",
      "/library/licenses",
      "/library/account"
    ]
  };
}

function buildLocalOrderRecord(
  buyerId: string,
  product: ProductDefinition,
  licenseType: string,
  orderId: string,
  checkoutSessionId: string
): OrderRecord {
  return {
    orderId,
    buyerId,
    productCode: product.productCode,
    licenseType,
    amountSnapshotUsd: product.priceUsd,
    checkoutSessionId,
    status: "paid",
    purchasedAt: new Date().toISOString(),
    entitlementIds: []
  };
}

async function fetchJson<T>(pathname: string, init?: RequestInit): Promise<T | undefined> {
  const apiBase = getCommerceApiBase();
  if (!apiBase) return undefined;

  try {
    const response = await fetch(`${apiBase}${pathname}`, {
      headers: {
        accept: "application/json",
        ...(init?.body ? { "content-type": "application/json" } : {})
      },
      ...init
    });

    if (response.status === 404) return undefined;
    if (!response.ok) {
      throw new Error(`Commerce API ${pathname} failed with ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (requireCommerceApi()) {
      throw error instanceof Error
        ? error
        : new Error(`Commerce API ${pathname} failed`);
    }
    return undefined;
  }
}

function mergeCatalogEntry(entry: ProductCatalogEntry): ProductDefinition {
  const fallback = getProductByCode(entry.productCode);
  if (!fallback) {
    throw new Error(`Unknown product code in catalog: ${entry.productCode}`);
  }

  return {
    ...fallback,
    ...entry,
    primaryCta: fallback.primaryCta,
    positioning: fallback.positioning,
    audience: fallback.audience,
    includedItems: fallback.includedItems,
    deliverables: fallback.deliverables,
    updatePolicy: fallback.updatePolicy,
    secondaryUpsell: fallback.secondaryUpsell,
    entitlementCode: fallback.entitlementCode,
    pageTemplateClass: fallback.pageTemplateClass
  };
}

export async function loadCatalogAsync(): Promise<ProductCatalogFixture> {
  const remoteCatalog = await fetchJson<{ version: string; products: ProductCatalogEntry[] }>("/products");
  if (!remoteCatalog) return getCatalog();

  return {
    version: remoteCatalog.version,
    products: remoteCatalog.products.map((entry) => mergeCatalogEntry(entry))
  };
}

export async function loadPricingAsync(): Promise<PricingLadder> {
  return (await fetchJson<PricingLadder>("/pricing/ladder")) ?? getPricing();
}

export async function loadProductByCodeAsync(productCode: ProductCode): Promise<ProductDefinition | undefined> {
  const remoteProduct = await fetchJson<ProductDefinition>(`/products/${productCode}`);
  if (remoteProduct) {
    const fallback = getProductByCode(productCode);
    return fallback ? { ...fallback, ...remoteProduct } : remoteProduct;
  }
  return getProductByCode(productCode);
}

export async function loadProductBySlugAsync(slug: string): Promise<ProductDefinition | undefined> {
  const fallback = getProductBySlug(slug);
  if (!fallback) return undefined;
  return loadProductByCodeAsync(fallback.productCode);
}

export async function loadLibraryAsync(buyerId: string): Promise<LibraryView> {
  return (await fetchJson<LibraryView>(`/library/${encodeURIComponent(buyerId)}`)) ?? getLibrary(buyerId) ?? buildEmptyLibrary(buyerId);
}

export async function loadOrderAsync(orderId: string): Promise<OrderRecord | undefined> {
  return (await fetchJson<OrderRecord>(`/orders/${encodeURIComponent(orderId)}`)) ?? undefined;
}

export async function loadEntitlementAsync(entitlementId: string): Promise<EntitlementRecord | undefined> {
  return (await fetchJson<EntitlementRecord>(`/entitlements/${encodeURIComponent(entitlementId)}`)) ?? undefined;
}

export async function loadTeam3SurfaceAsync(): Promise<Team3SurfaceContract> {
  return (await fetchJson<Team3SurfaceContract>("/surfaces/team3")) ?? getTeam3Surface();
}

export async function loadTeam4OperationsAsync(): Promise<Team4OperationsContract> {
  return (await fetchJson<Team4OperationsContract>("/operations/team4")) ?? getTeam4Operations();
}

export async function loadRecommendationAsync(
  purchasedProducts: ProductCode[],
  roleTag: BuyerRole,
  sourceSurface: string
): Promise<RecommendationResult> {
  return (
    (await fetchJson<RecommendationResult>("/recommendations/next-step", {
      method: "POST",
      body: JSON.stringify({
        purchasedProducts,
        licenseType: purchasedProducts.at(-1) === "P12" ? "Small Team" : "Individual",
        lastPurchaseDate: new Date().toISOString(),
        roleTag,
        sourceSurface
      })
    })) ?? getRecommendationForOwnedProducts(purchasedProducts)
  );
}

function buyerEmailFromId(buyerId: string): string {
  const token = buyerId.replace(/^buyer_/, "") || "buyer";
  return `${token}@example.com`;
}

function buyerIdFromEmail(email: string): string {
  const token =
    email
      .split("@")[0]
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 24) || "buyer";
  return `buyer_${token}`;
}

export async function executeCheckoutFlowAsync(input: {
  buyerId: string;
  productCode: ProductCode;
  licenseType?: string;
  buyerEmail?: string;
  sourceSurface?: "product-detail" | "catalog" | "upsell-card" | "library";
}): Promise<CheckoutFlowResult> {
  const product = await loadProductByCodeAsync(input.productCode);
  if (!product) {
    throw new Error(`Unknown product ${input.productCode}`);
  }

  const licenseType = input.licenseType ?? product.defaultLicense;
  const buyerEmail = input.buyerEmail ?? buyerEmailFromId(input.buyerId);
  const resolvedBuyerId = input.buyerEmail ? buyerIdFromEmail(input.buyerEmail) : input.buyerId;
  const checkoutRequest = {
    productCode: product.productCode,
    licenseType,
    entitlementCode: product.entitlementCode,
    buyerEmail,
    successUrl: "https://noos.iai.one/checkout-success?session_id={CHECKOUT_SESSION_ID}",
    cancelUrl: `https://noos.iai.one${product.route}`,
    sourceSurface: input.sourceSurface ?? "product-detail",
    upgradePath: product.secondaryUpsell
  };

  const session = await fetchJson<CheckoutSessionReceipt>("/checkout/sessions", {
    method: "POST",
    body: JSON.stringify(checkoutRequest)
  });

  if (session) {
    const orderId = `ord_${Date.now().toString(36)}`;
    await fetchJson("/webhooks/stripe/checkout-session-completed", {
      method: "POST",
      body: JSON.stringify({
        eventType: "checkout.session.completed",
        checkoutSessionId: session.checkoutSessionId,
        productCode: product.productCode,
        licenseType,
        entitlementCode: product.entitlementCode,
        buyerEmail,
        orderId,
        fulfillmentKey: session.checkoutSessionId,
        idempotencyPassed: true,
        entitlementActions: [
          {
            action: "grant_parent_entitlement",
            entitlementCode: product.entitlementCode
          }
        ],
        confirmationEmailQueued: true,
        loggedAt: new Date().toISOString()
      })
    });

    return {
      orderId,
      buyerId: resolvedBuyerId,
      productCode: product.productCode,
      licenseType,
      checkoutSessionId: session.checkoutSessionId
    };
  }

  return {
      orderId: buildLocalOrderRecord(
      resolvedBuyerId,
      product,
      licenseType,
      `ord_local_${Date.now().toString(36)}`,
      `cs_local_${Date.now().toString(36)}`
    ).orderId,
    buyerId: resolvedBuyerId,
    productCode: product.productCode,
    licenseType,
    checkoutSessionId: `cs_local_${Date.now().toString(36)}`
  };
}
