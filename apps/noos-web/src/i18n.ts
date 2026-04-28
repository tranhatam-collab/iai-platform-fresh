import {
  getCopyNotes,
  getProductByCode,
  type BuyerRole,
  type BuyerRoleProfile,
  type LibraryItem,
  type ProductCode,
  type ProductDefinition
} from "./data.js";

export type Locale = "en" | "vi";

export const defaultLocale: Locale = "en";
export const supportedLocales: Locale[] = ["en", "vi"];

export const localeMeta: Record<Locale, { flag: string; label: string; nativeLabel: string; htmlLang: string }> = {
  en: {
    flag: "🇺🇸",
    label: "English",
    nativeLabel: "English",
    htmlLang: "en"
  },
  vi: {
    flag: "🇻🇳",
    label: "Vietnamese",
    nativeLabel: "Tiếng Việt",
    htmlLang: "vi"
  }
};

type LocalizedProduct = Omit<ProductDefinition, "tier" | "defaultLicense" | "updatePolicy"> & {
  tierLabel: string;
  defaultLicenseLabel: string;
  updateWindowLabel: string;
  updateTypeLabels: string[];
};

type LocalizedCopyNotes = ReturnType<typeof getCopyNotes>;

const roleOrder: BuyerRoleProfile[] = [
  {
    role: "individual",
    label: "Individual",
    line: "",
    heroLine: "",
    recommendedProductCodes: ["P01", "P03", "P11"]
  },
  {
    role: "builder",
    label: "Builder",
    line: "",
    heroLine: "",
    recommendedProductCodes: ["P03", "P05", "P07", "P11"]
  },
  {
    role: "team",
    label: "Team",
    line: "",
    heroLine: "",
    recommendedProductCodes: ["P11", "P12", "P03"]
  },
  {
    role: "institution",
    label: "Institution",
    line: "",
    heroLine: "",
    recommendedProductCodes: ["P05", "P06", "P07", "P12"]
  }
];

const roleProfilesByLocale: Record<Locale, Record<BuyerRole, BuyerRoleProfile>> = {
  en: {
    individual: {
      role: "individual",
      label: "Individual",
      line: "Move fast into the right product while keeping the ladder visible.",
      heroLine:
        "Structured NOOS products for individual buyers who need to enter quickly, buy accurately, and move up the ladder with clarity.",
      recommendedProductCodes: ["P01", "P03", "P11"]
    },
    builder: {
      role: "builder",
      label: "Builder",
      line: "Lead with architecture, governance, Vietnam field context, and the flagship bundle.",
      heroLine:
        "Builder view brings P03, P05, P07, and P11 forward so product, design, and engineering can work from one shared system language.",
      recommendedProductCodes: ["P03", "P05", "P07", "P11"]
    },
    team: {
      role: "team",
      label: "Team",
      line: "Emphasize team-ready handoff, license clarity, and the path into organization deployment.",
      heroLine:
        "Team view prioritizes bundles, upgrade windows, and handoff surfaces so implementation can start with less friction.",
      recommendedProductCodes: ["P11", "P12", "P03"]
    },
    institution: {
      role: "institution",
      label: "Institution",
      line: "Emphasize governance, trust, sovereignty, and the inquiry path at the higher tier.",
      heroLine:
        "Institution view brings governance, trust, Vietnam resilience, and the organization path into one disciplined decision surface.",
      recommendedProductCodes: ["P05", "P06", "P07", "P12"]
    }
  },
  vi: {
    individual: {
      role: "individual",
      label: "Cá nhân",
      line: "Vào nhanh đúng sản phẩm và giữ được lộ trình nâng cấp rõ ràng.",
      heroLine:
        "Các sản phẩm NOOS được cấu trúc cho người mua cá nhân cần vào nhanh, mua đúng và đi lên đúng nấc trong thang giá trị.",
      recommendedProductCodes: ["P01", "P03", "P11"]
    },
    builder: {
      role: "builder",
      label: "Người xây",
      line: "Ưu tiên kiến trúc, quản trị, bối cảnh Việt Nam và gói chủ lực.",
      heroLine:
        "Góc nhìn builder đẩy P03, P05, P07 và P11 lên trước để product, design và engineering cùng dùng một ngôn ngữ hệ thống.",
      recommendedProductCodes: ["P03", "P05", "P07", "P11"]
    },
    team: {
      role: "team",
      label: "Nhóm",
      line: "Ưu tiên bàn giao cho nhóm, rõ license và đường đi lên quy mô tổ chức.",
      heroLine:
        "Góc nhìn nhóm ưu tiên bundle, cửa sổ nâng cấp và bề mặt handoff để vào implementation nhanh hơn.",
      recommendedProductCodes: ["P11", "P12", "P03"]
    },
    institution: {
      role: "institution",
      label: "Tổ chức",
      line: "Ưu tiên quản trị, niềm tin, chủ quyền và đường inquiry ở lớp cao hơn.",
      heroLine:
        "Góc nhìn tổ chức gom governance, trust, bối cảnh Việt Nam và đường đi lên organization vào một bề mặt quyết định chặt chẽ.",
      recommendedProductCodes: ["P05", "P06", "P07", "P12"]
    }
  }
};

const vietnameseProducts: Record<
  ProductCode,
  {
    name: string;
    positioning: string;
    audience: string[];
    includedItems: string[];
    deliverables: string[];
    primaryCta: string;
  }
> = {
  P01: {
    name: "Gói Tuyên ngôn và Nền tảng NOOS",
    positioning: "Điểm vào mạch lạc để bước vào thế giới quan và ngôn ngữ của NOOS.",
    audience: ["người mua lần đầu", "nhà chiến lược", "nhà nghiên cứu"],
    includedItems: ["bản tuyên ngôn", "ghi chú nền tảng", "bảng thuật ngữ", "lộ trình đọc"],
    deliverables: ["PDF", "mục trong thư viện"],
    primaryCta: "Mua Gói Nền tảng"
  },
  P02: {
    name: "Bạch thư NOOS - Bản mở rộng chính thức",
    positioning: "Bản white paper có cấu trúc chính thức dành cho người đọc nghiêm túc.",
    audience: ["lead đổi mới", "người đọc nghiên cứu", "nhóm chiến lược"],
    includedItems: ["white paper mở rộng", "phụ lục sơ đồ", "thứ tự đọc"],
    deliverables: ["PDF", "sơ đồ", "mục trong thư viện"],
    primaryCta: "Lấy Bản Mở rộng Chính thức"
  },
  P03: {
    name: "Gói Kiến trúc và Bản đồ Hệ thống NOOS",
    positioning: "Hiểu NOOS như một hệ thống có ranh giới và bản đồ rõ ràng.",
    audience: ["kiến trúc sư hệ thống", "lãnh đạo sản phẩm", "văn phòng đổi mới"],
    includedItems: ["tổng quan kiến trúc", "bản đồ phân cấp hệ thống", "bản đồ IA", "bản đồ ranh giới"],
    deliverables: ["bộ PDF", "sơ đồ", "mục trong thư viện"],
    primaryCta: "Lấy Gói Kiến trúc"
  },
  P04: {
    name: "8 Tầng Công nghệ cho Nền văn minh Tương lai",
    positioning: "Cẩm nang có cấu trúc cho stack công nghệ 8 tầng ở cấp độ nền văn minh.",
    audience: ["nhà giáo dục", "nhà chiến lược", "người học future-tech"],
    includedItems: ["mô hình 8 tầng", "bản đồ quan hệ", "ghi chú rủi ro", "đường ứng dụng"],
    deliverables: ["PDF", "phiếu tóm tắt", "mục trong thư viện"],
    primaryCta: "Lấy Cẩm nang 8 Tầng"
  },
  P05: {
    name: "Gói Quản trị, Niềm tin và Chủ quyền Con người",
    positioning: "Gói governance cho các hệ thống tương lai có trách nhiệm giải trình.",
    audience: ["nhóm chính sách", "nhóm trust/safety", "người đọc tổ chức"],
    includedItems: ["mô hình chủ quyền", "bounded autonomy", "rollback", "auditability"],
    deliverables: ["bộ PDF", "phiếu mô hình", "mục trong thư viện"],
    primaryCta: "Lấy Gói Governance và Trust"
  },
  P06: {
    name: "Gói Định hướng Hậu lượng tử, Auditability và Security",
    positioning: "Định hướng bảo mật chiến lược cho các hệ trust ở thời kỳ PQC.",
    audience: ["kiến trúc sư bảo mật", "nhóm trust", "nhà chiến lược hạ tầng"],
    includedItems: ["định hướng PQC", "truy vết bằng chứng", "ghi chú trust fabric"],
    deliverables: ["PDF", "phiếu security", "mục trong thư viện"],
    primaryCta: "Lấy Gói Định hướng Security"
  },
  P07: {
    name: "Gói Hồ sơ Chủ quyền và Chống chịu Việt Nam",
    positioning: "Góc nhìn triển khai thực địa cho các điều kiện chống chịu tại Việt Nam.",
    audience: ["nhà quy hoạch Việt Nam", "nhóm resilience", "nhà chiến lược hạ tầng"],
    includedItems: ["nhóm nhiệm vụ", "ma trận kết nối", "ghi chú chủ quyền", "hành lang"],
    deliverables: ["PDF", "phụ lục ma trận", "mục trong thư viện"],
    primaryCta: "Lấy Gói Hồ sơ Việt Nam"
  },
  P08: {
    name: "Gói Lưới Chăm sóc Hành tinh và Field Intelligence",
    positioning: "Chương trình cho các hệ thống cảm nhận phân tán và care-grid.",
    audience: ["nhóm hệ thống môi trường", "nhà quy hoạch resilience"],
    includedItems: ["mô hình care-grid", "khung sensing", "logic điều phối hiện trường"],
    deliverables: ["PDF chương trình", "sơ đồ", "mục trong thư viện"],
    primaryCta: "Lấy Chương trình Care Grid"
  },
  P09: {
    name: "Gói Orbit, NTN và Hạ tầng Tiện ích Không gian",
    positioning: "Khung utility-grade cho NTN và tính liên tục quỹ đạo.",
    audience: ["nhà chiến lược kết nối", "kiến trúc sư mạng", "nhóm resilience"],
    includedItems: ["khung NTN", "kiến trúc continuity", "mạng lưới theo mission"],
    deliverables: ["PDF chương trình", "sơ đồ connectivity", "mục trong thư viện"],
    primaryCta: "Lấy Chương trình Orbit và NTN"
  },
  P10: {
    name: "Gói Sinh học Lập trình được và Hệ tái sinh",
    positioning: "Chương trình biofuture có kỷ luật với lăng kính governance.",
    audience: ["nhà nghiên cứu biofuture", "lead đổi mới", "người đọc nâng cao"],
    includedItems: ["khung programmable biology", "hệ tái sinh", "ghi chú biosafety"],
    deliverables: ["PDF chương trình", "sơ đồ", "mục trong thư viện"],
    primaryCta: "Lấy Chương trình Bios và Tái sinh"
  },
  P11: {
    name: "Gói Tổng lực Công nghệ cho Nền văn minh Tương lai",
    positioning: "Bundle NOOS tích hợp chủ lực cho người mua cá nhân nghiêm túc.",
    audience: ["nhà chiến lược", "nhà nghiên cứu", "founder", "nhà giáo dục"],
    includedItems: ["P02", "P03", "P04", "P05", "phiếu thưởng/index"],
    deliverables: ["quyền truy cập bundle", "PDF", "phiếu roadmap", "mục trong thư viện"],
    primaryCta: "Lấy Gói Master"
  },
  P12: {
    name: "Bundle Builder NOOS cho Nhóm",
    positioning: "Bundle bàn giao sẵn cho nhóm để product/design/dev cùng căn chỉnh.",
    audience: ["nhóm dev", "nhóm design", "văn phòng đổi mới", "builder group"],
    includedItems: ["handoff kiến trúc", "logic IA/route", "ranh giới subsystem", "checklist"],
    deliverables: ["bộ bundle cho nhóm", "quyền truy cập thư viện", "phiếu license nhóm"],
    primaryCta: "Lấy Builder Bundle"
  }
};

const tierLabels: Record<Locale, Record<string, string>> = {
  en: {
    Entry: "Entry",
    "Entry/Core": "Entry/Core",
    Core: "Core",
    "Advanced Program": "Advanced Program",
    Master: "Master",
    Team: "Team",
    "Institutional/Strategic": "Institutional/Strategic"
  },
  vi: {
    Entry: "Khởi đầu",
    "Entry/Core": "Khởi đầu/Cốt lõi",
    Core: "Cốt lõi",
    "Advanced Program": "Chương trình nâng cao",
    Master: "Tổng lực",
    Team: "Nhóm",
    "Institutional/Strategic": "Tổ chức/Chiến lược"
  }
};

const licenseLabels: Record<Locale, Record<string, string>> = {
  en: {
    Individual: "Individual",
    "Small Team": "Small Team",
    Organization: "Organization",
    Strategic: "Strategic",
    "Organization Inquiry": "Organization Inquiry"
  },
  vi: {
    Individual: "Cá nhân",
    "Small Team": "Nhóm nhỏ",
    Organization: "Tổ chức",
    Strategic: "Chiến lược",
    "Organization Inquiry": "Liên hệ cho tổ chức"
  }
};

const themeLabels: Record<Locale, Record<string, string>> = {
  en: {
    Foundation: "Foundation",
    Architecture: "Architecture",
    Governance: "Governance",
    Trust: "Trust",
    Vietnam: "Vietnam",
    Grid: "Grid",
    Orbit: "Orbit",
    Bios: "Bios",
    Master: "Master",
    Teams: "Teams"
  },
  vi: {
    Foundation: "Nền tảng",
    Architecture: "Kiến trúc",
    Governance: "Quản trị",
    Trust: "Niềm tin",
    Vietnam: "Việt Nam",
    Grid: "Lưới",
    Orbit: "Quỹ đạo",
    Bios: "Sinh học",
    Master: "Tổng lực",
    Teams: "Nhóm"
  }
};

const statusLabels: Record<Locale, Record<LibraryItem["updateStatus"], string>> = {
  en: {
    current: "current version",
    update_available: "update available",
    window_expired: "update window expired",
    upgraded: "upgraded"
  },
  vi: {
    current: "phiên bản hiện tại",
    update_available: "có bản cập nhật",
    window_expired: "hết cửa sổ cập nhật",
    upgraded: "đã nâng cấp"
  }
};

const tierSummaryEn = [
  { sourceTier: "Entry", tier: "Entry", line: "A disciplined entry point into NOOS language and worldview." },
  {
    sourceTier: "Core",
    tier: "Core",
    line: "Packs you can bring directly into planning, architecture, governance, and field deployment."
  },
  { sourceTier: "Advanced Program", tier: "Advanced Program", line: "Deeper program surfaces for Grid, Orbit, and Bios." },
  { sourceTier: "Master", tier: "Master", line: "Flagship bundle for serious individual buyers." },
  {
    sourceTier: "Team",
    tier: "Team",
    line: "Builder bundle for teams, innovation offices, and the path into organization delivery."
  }
];

const supportFaqEn = [
  {
    question: "What do I receive after purchase?",
    answer: "The product opens in the buyer library immediately and includes file access when the entitlement allows it."
  },
  {
    question: "Is this a physical product?",
    answer: "No. These are digital products with library access and version handling."
  },
  {
    question: "Can I share it with a team?",
    answer: "Only when the license allows it. The default team path starts at P12."
  },
  {
    question: "What happens after the update window closes?",
    answer: "The buyer keeps access under the entitlement, while new updates move into the mapped upgrade note."
  }
];

const tierSummaryVi = [
  { sourceTier: "Entry", tier: "Khởi đầu", line: "Điểm vào có kỷ luật để bước vào ngôn ngữ và thế giới quan của NOOS." },
  {
    sourceTier: "Core",
    tier: "Cốt lõi",
    line: "Các pack có thể đưa thẳng vào planning, architecture, governance và triển khai thực địa."
  },
  {
    sourceTier: "Advanced Program",
    tier: "Chương trình nâng cao",
    line: "Các bề mặt chương trình đi sâu hơn cho Grid, Orbit và Bios."
  },
  {
    sourceTier: "Master",
    tier: "Tổng lực",
    line: "Bundle chủ lực dành cho người mua cá nhân nghiêm túc cần một điểm gom lực rõ ràng."
  },
  {
    sourceTier: "Team",
    tier: "Nhóm",
    line: "Builder bundle dành cho team, innovation office và đường đi sang triển khai ở cấp tổ chức."
  }
];

const supportFaqVi = [
  {
    question: "Tôi nhận được gì sau khi thanh toán?",
    answer: "Sản phẩm mở ngay trong thư viện người mua và kèm quyền tải tài liệu khi entitlement cho phép."
  },
  {
    question: "Đây có phải sản phẩm vật lý không?",
    answer: "Không. Đây là các sản phẩm số có library access và quản lý phiên bản."
  },
  {
    question: "Tôi có thể chia sẻ cho team không?",
    answer: "Chỉ khi license cho phép. Đường team mặc định bắt đầu từ P12."
  },
  {
    question: "Nếu hết cửa sổ cập nhật thì sao?",
    answer: "Bạn vẫn giữ quyền truy cập theo entitlement, còn các cập nhật mới sẽ đi sang ghi chú nâng cấp đã được map."
  }
];

function translateWindowLabel(windowLabel: string, locale: Locale): string {
  if (locale === "en") return windowLabel;
  return windowLabel.replace("months", "tháng").replace("month", "tháng");
}

function translateUpdateTypes(updateTypes: string[], locale: Locale): string[] {
  if (locale === "en") return updateTypes;
  return updateTypes.map((type) =>
    type === "minor" ? "cập nhật nhỏ" : type === "selected" ? "cập nhật chọn lọc" : type
  );
}

export function getLocalizedRoleProfiles(locale: Locale): BuyerRoleProfile[] {
  return roleOrder.map((profile) => roleProfilesByLocale[locale][profile.role]);
}

export function getLocalizedRoleProfile(role: string | null | undefined, locale: Locale): BuyerRoleProfile {
  return roleProfilesByLocale[locale][(role as BuyerRole) ?? "individual"] ?? roleProfilesByLocale[locale].individual;
}

export function getLocalizedProduct(product: ProductDefinition, locale: Locale): LocalizedProduct {
  const overrides = locale === "vi" ? vietnameseProducts[product.productCode] : undefined;
  return {
    ...product,
    name: overrides?.name ?? product.name,
    positioning: overrides?.positioning ?? product.positioning,
    audience: overrides?.audience ?? product.audience,
    includedItems: overrides?.includedItems ?? product.includedItems,
    deliverables: overrides?.deliverables ?? product.deliverables,
    primaryCta: overrides?.primaryCta ?? product.primaryCta,
    tierLabel: tierLabels[locale][product.tier] ?? product.tier,
    defaultLicenseLabel: licenseLabels[locale][product.defaultLicense] ?? product.defaultLicense,
    updateWindowLabel: translateWindowLabel(product.updatePolicy.windowLabel, locale),
    updateTypeLabels: translateUpdateTypes(product.updatePolicy.updateTypes, locale)
  };
}

export function getLocalizedRelatedLabel(value: string, locale: Locale): string {
  if (/^P\d{2}$/.test(value)) {
    const product = getProductByCode(value as ProductCode);
    if (product) {
      return `${value} · ${getLocalizedProduct(product, locale).name}`;
    }
  }
  if (value === "Organization Inquiry") {
    return locale === "vi" ? "Liên hệ triển khai cho tổ chức" : "Organization Inquiry";
  }
  return licenseLabels[locale][value] ?? value;
}

export function getLocalizedTierLabel(tier: string, locale: Locale): string {
  return tierLabels[locale][tier] ?? tier;
}

export function getLocalizedTierSummary(locale: Locale): Array<{ sourceTier: string; tier: string; line: string }> {
  return locale === "en" ? tierSummaryEn : tierSummaryVi;
}

export function getLocalizedSupportFaq(locale: Locale) {
  return locale === "en" ? supportFaqEn : supportFaqVi;
}

export function getLocalizedStatusLabel(value: LibraryItem["updateStatus"], locale: Locale): string {
  return statusLabels[locale][value];
}

export function getLocalizedThemeLabel(theme: string, locale: Locale): string {
  return themeLabels[locale][theme] ?? theme;
}

export function getLocalizedLicenseLabel(licenseType: string, locale: Locale): string {
  return licenseLabels[locale][licenseType] ?? licenseType;
}

function buildEnglishCopyNotes(product: ProductDefinition): LocalizedCopyNotes {
  const base = getCopyNotes(product.productCode);
  return {
    ...base,
    theme: getLocalizedThemeLabel(base.theme, "en"),
    problems: [
      `Brings ${product.name} into one disciplined asset instead of scattering the context across loose notes.`,
      `Gives ${product.audience.slice(0, 2).join(" and ")} a clear route into the NOOS system without guessing the next step.`,
      `Keeps price, license, delivery, and upgrade path visible before the buyer commits.`
    ],
    whyItMatters: `${product.name} turns ${product.positioning.toLowerCase().replace(/\.$/, "")} into an addressable library asset with a clear ladder path.`,
    faq: [
      {
        question: "What do I receive after purchase?",
        answer: `You receive ${product.deliverables.join(", ")} tied to the same entitlement path inside the library.`
      },
      {
        question: "Which license is included by default?",
        answer: `${product.defaultLicense} is the default license, and the mapped next step is ${product.updatePolicy.upgradePath}.`
      },
      {
        question: "How long does the update window stay open?",
        answer: `${product.updatePolicy.windowLabel} for ${product.updatePolicy.updateTypes.join(", ")} updates under the locked policy.`
      }
    ]
  };
}

function buildVietnameseCopyNotes(product: ProductDefinition): LocalizedCopyNotes {
  const base = getCopyNotes(product.productCode);
  const localizedProduct = getLocalizedProduct(product, "vi");
  const primaryAudience = localizedProduct.audience.slice(0, 2).join(" và ");
  const nextStep = getLocalizedRelatedLabel(product.updatePolicy.upgradePath, "vi");

  return {
    ...base,
    theme: getLocalizedThemeLabel(base.theme, "vi"),
    problems: [
      `Đưa ${localizedProduct.name} vào một tài sản có địa chỉ rõ ràng thay vì để bối cảnh bị rơi vào các ghi chú rời rạc.`,
      `Giúp ${primaryAudience} đi từ bối cảnh sang quyết định mua và triển khai mà không phải đoán bước kế tiếp.`,
      "Giữ giá, license, delivery và đường nâng cấp hiển thị ngay trước khi người mua cam kết."
    ],
    whyItMatters: `${localizedProduct.name} biến ${localizedProduct.positioning.toLowerCase().replace(/\.$/, "")} thành một tài sản thư viện có thể truy cập, đối chiếu và mở rộng theo đúng thang sản phẩm đã khóa.`,
    faq: [
      {
        question: "Tôi nhận được gì sau khi thanh toán?",
        answer: `Bạn nhận được ${localizedProduct.deliverables.join(", ")} gắn vào cùng entitlement path trong thư viện người mua.`
      },
      {
        question: "License mặc định là gì?",
        answer: `${localizedProduct.defaultLicenseLabel} là license mặc định, và bước kế tiếp đã map là ${nextStep}.`
      },
      {
        question: "Cửa sổ cập nhật kéo dài bao lâu?",
        answer: `${localizedProduct.updateWindowLabel} cho ${localizedProduct.updateTypeLabels.join(", ")} theo chính sách đã khóa.`
      }
    ]
  };
}

export function getLocalizedCopyNotes(product: ProductDefinition, locale: Locale): LocalizedCopyNotes {
  return locale === "en" ? buildEnglishCopyNotes(product) : buildVietnameseCopyNotes(product);
}
