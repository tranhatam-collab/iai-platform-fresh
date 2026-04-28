export type PaymentCurrency = "USD" | "VND";
export type PaymentReceiverStatus =
  | "ACTIVE_CONFIRMED"
  | "NEEDS_QR_SCAN_CONFIRMATION"
  | "NEEDS_LEGAL_NAME_CONFIRMATION";
export type PaymentChannelType =
  | "bank_qr"
  | "paypal_email"
  | "paypal_managed_qr"
  | "us_bank_account";
export type PaymentEntityType = "company" | "organization" | "personal";
import { siteActivationRegistryEntries } from "./site-activation-registry.js";

export type DomainAssignmentStatus =
  | "ACTIVE_NOW"
  | "DEFERRED_UNTIL_FOUNDER_INSTRUCTION"
  | "NOT_ASSIGNED_YET";

export interface PaymentReceiver {
  accountNumber?: string;
  assignmentStatus: "ACTIVE_DOMAIN_DEFAULT" | "ACTIVE_DOMAIN_FALLBACK" | "HOLD_NOT_ASSIGNED";
  bankName?: string;
  branch?: string | null;
  channelType: PaymentChannelType;
  country: string;
  currency: PaymentCurrency;
  defaultForDomains: string[];
  displayName: string;
  entityType: PaymentEntityType;
  legalName?: string;
  bankAddress?: string | null;
  bankProvider?: string | null;
  paypalEmail?: string;
  paypalManagedQrUrl?: string;
  paypalMeBaseUrl?: string;
  paypalUsername?: string;
  receiverId: string;
  routingNumber?: string;
  sourceNote: string;
  status: PaymentReceiverStatus;
  swiftCode?: string | null;
  usRailCapabilities?: string[];
  vietQrBankId?: string;
}

export interface DomainPaymentAssignment {
  domain: string;
  fallbackVndReceiverId?: string;
  notes: string;
  primaryUsdReceiverId?: string;
  primaryVndReceiverId?: string;
  status: DomainAssignmentStatus;
}

export interface PaymentRoutingQuery {
  amount?: number | null;
  country?: string | null;
  currency?: string | null;
  domain: string;
  /**
   * ID-issuing country for the payer (e.g. "VN" for a Vietnam-issued ID).
   * When present, ID-country policy overrides any caller-supplied currency:
   *   - VN → VND required
   *   - non-VN → USD required
   * The override is the only honest way to enforce KYC/regulatory currency
   * matching against the document presented at checkout.
   */
  idCountry?: string | null;
  packageCode?: string | null;
  reference?: string | null;
}

export type PaymentCurrencyPolicyRule =
  | "VN_ID_REQUIRES_VND"
  | "NON_VN_ID_REQUIRES_USD";

export interface PaymentCurrencyPolicy {
  rule: PaymentCurrencyPolicyRule;
  requiredCurrency: PaymentCurrency;
  /** Truth flag: was the caller-supplied currency overridden by ID-country policy. */
  overrodeRequestedCurrency: boolean;
}

interface ResolvedRoutingChannel {
  channelType: PaymentChannelType;
  currency: PaymentCurrency;
  displayInstruction: string;
  isPrimary: boolean;
  paymentTarget: Record<string, string | null>;
  quickLink: {
    accountName?: string;
    addInfo?: string;
    amount?: number | null;
    provider: "paypal_me" | "vietqr_quick_link";
    template?: string;
    url: string | null;
  } | null;
  receiver: PaymentReceiver;
  transactionNotification: {
    addresses: string[];
    deliveryOwner: "EMAIL_TEAM";
    required: true;
    status: "PENDING_CLOUDFLARE_DOMAIN_MAIL_BINDING";
  };
}

export interface PaymentRoutingResult {
  assignment: DomainPaymentAssignment | null;
  assignmentStatus: DomainAssignmentStatus;
  availableCurrencies: PaymentCurrency[];
  channels: ResolvedRoutingChannel[];
  /** Non-null when ID-country policy enforced a currency choice. */
  currencyPolicy: PaymentCurrencyPolicy | null;
  domain: string;
  fallbackChannels: ResolvedRoutingChannel[];
  notes: string[];
  requestedAmount: number | null;
  requestedCountry: string | null;
  requestedCurrency: string | null;
  /** Echo of the normalized id_country query parameter (or null when absent). */
  requestedIdCountry: string | null;
  resolvedCurrency: PaymentCurrency | null;
}

const notificationLocalParts = ["pay", "billing", "support"] as const;

const receiverRegistry: PaymentReceiver[] = [
  {
    accountNumber: "27588277",
    assignmentStatus: "ACTIVE_DOMAIN_DEFAULT",
    bankName: "ACB",
    branch: null,
    channelType: "bank_qr",
    country: "VN",
    currency: "VND",
    defaultForDomains: ["tranhatam.com"],
    displayName: "Trần Hà Tâm",
    entityType: "personal",
    legalName: "TRAN HA TAM",
    receiverId: "recv_vnd_personal_tranhatam_acb",
    sourceNote: "Ảnh QR ACB cá nhân",
    status: "ACTIVE_CONFIRMED",
    swiftCode: null,
    vietQrBankId: "ACB"
  },
  {
    accountNumber: "0231000091212",
    assignmentStatus: "ACTIVE_DOMAIN_FALLBACK",
    bankName: "Vietcombank",
    branch: "Trụ sở CN Đắk Lắk",
    channelType: "bank_qr",
    country: "VN",
    currency: "VND",
    defaultForDomains: ["tranhatam.com"],
    displayName: "Trần Hà Tâm",
    entityType: "personal",
    legalName: "TRAN HA TAM",
    receiverId: "recv_vnd_personal_tranhatam_vcb",
    sourceNote: "Ảnh QR Vietcombank cá nhân",
    status: "ACTIVE_CONFIRMED",
    swiftCode: null,
    vietQrBankId: "Vietcombank"
  },
  {
    assignmentStatus: "ACTIVE_DOMAIN_DEFAULT",
    channelType: "paypal_email",
    country: "US/International",
    currency: "USD",
    defaultForDomains: ["tranhatam.com"],
    displayName: "Trần Hà Tâm",
    entityType: "personal",
    paypalEmail: "tranhatam@gmail.com",
    receiverId: "recv_usd_personal_tranhatam_paypal",
    sourceNote: "Founder instruction",
    status: "ACTIVE_CONFIRMED"
  },
  {
    accountNumber: "20153108",
    assignmentStatus: "HOLD_NOT_ASSIGNED",
    bankName: "Ngân hàng TMCP Á Châu (ACB)",
    branch: "ACB - PGD Kỳ Đồng",
    channelType: "bank_qr",
    country: "VN",
    currency: "VND",
    defaultForDomains: [],
    displayName: "Công ty Cổ phần Đầu tư Việt Úc Toàn Cầu",
    entityType: "company",
    legalName: "CTY CO PHAN DAU TU VIET UC TOAN CAU",
    receiverId: "recv_vnd_vietuc_toancau_acb",
    sourceNote: "Ảnh QR VietQR ACB",
    status: "ACTIVE_CONFIRMED",
    swiftCode: "ASCBVNVX",
    vietQrBankId: "ACB"
  },
  {
    accountNumber: "12381288",
    assignmentStatus: "HOLD_NOT_ASSIGNED",
    bankName: "Ngân hàng TMCP Á Châu (ACB)",
    branch: "ACB - PGD Kỳ Đồng",
    channelType: "bank_qr",
    country: "VN",
    currency: "VND",
    defaultForDomains: [],
    displayName: "Công ty TNHH Tam Vesey Associates UK",
    entityType: "company",
    legalName: "CTY TNHH TAM VESEY ASSOCIATES UK",
    receiverId: "recv_vnd_tamvesey_uk_acb",
    sourceNote: "Ảnh QR VietQR ACB",
    status: "ACTIVE_CONFIRMED",
    swiftCode: "ASCBVNVX",
    vietQrBankId: "ACB"
  },
  {
    accountNumber: "30051378",
    assignmentStatus: "HOLD_NOT_ASSIGNED",
    bankName: "Ngân hàng TMCP Á Châu (ACB)",
    branch: "ACB - PGD Cống Quỳnh",
    channelType: "bank_qr",
    country: "VN",
    currency: "VND",
    defaultForDomains: [],
    displayName: "Công ty CP ĐT Giáo Dục và Du Lịch Hành Trình Ka...",
    entityType: "company",
    legalName: "CTY CP DT GIAO DUC VA DU LICH HANH TRINH KA...",
    receiverId: "recv_vnd_hanhtrinh_company_acb",
    sourceNote: "Tên pháp lý bị cắt trên ảnh, cần xác minh lại trước khi gán",
    status: "NEEDS_LEGAL_NAME_CONFIRMATION",
    swiftCode: "ASCBVNVX",
    vietQrBankId: "ACB"
  },
  {
    accountNumber: "3699636",
    assignmentStatus: "HOLD_NOT_ASSIGNED",
    bankName: "Ngân hàng TMCP Á Châu (ACB)",
    branch: "ACB - CN TP. Hồ Chí Minh",
    channelType: "bank_qr",
    country: "VN",
    currency: "USD",
    defaultForDomains: [],
    displayName: "Công ty TNHH ĐTTM Thanh Tam Phat",
    entityType: "company",
    legalName: "CTY TNHH DTTM THANH TAM PHAT",
    receiverId: "recv_usd_thanhtamphat_acb",
    sourceNote: "Ảnh QR ghi USD",
    status: "ACTIVE_CONFIRMED",
    swiftCode: "ASCBVNVX",
    vietQrBankId: "ACB"
  },
  {
    accountNumber: "369999996",
    assignmentStatus: "ACTIVE_DOMAIN_DEFAULT",
    bankName: "Ngân hàng TMCP Á Châu (ACB)",
    branch: "ACB - CN TP. Hồ Chí Minh",
    channelType: "bank_qr",
    country: "VN",
    currency: "VND",
    defaultForDomains: ["vc.vetuonglai.com", "invest.vetuonglai.com", "life.vetuonglai.com"],
    displayName: "Công ty TNHH ĐTTM Thanh Tam Phat",
    entityType: "company",
    legalName: "CTY TNHH DTTM THANH TAM PHAT",
    receiverId: "recv_vnd_thanhtamphat_acb",
    sourceNote: "Ảnh QR ghi VND",
    status: "ACTIVE_CONFIRMED",
    swiftCode: "ASCBVNVX",
    vietQrBankId: "ACB"
  },
  {
    accountNumber: "43545878",
    assignmentStatus: "ACTIVE_DOMAIN_DEFAULT",
    bankName: "Ngân hàng TMCP Á Châu (ACB)",
    branch: "ACB - CN Lâm Đồng",
    channelType: "bank_qr",
    country: "VN",
    currency: "VND",
    defaultForDomains: ["omdalat.com"],
    displayName: "Công ty TNHH SX - TM - DV Thai Lam",
    entityType: "company",
    legalName: "CONG TY TNHH SX - TM - DV THAI LAM",
    receiverId: "recv_vnd_thailam_acb",
    sourceNote: "Ảnh QR VietQR ACB",
    status: "ACTIVE_CONFIRMED",
    swiftCode: "ASCBVNVX",
    vietQrBankId: "ACB"
  },
  {
    accountNumber: "12381278",
    assignmentStatus: "HOLD_NOT_ASSIGNED",
    bankName: "Ngân hàng TMCP Á Châu (ACB)",
    branch: "ACB - PGD Cống Quỳnh",
    channelType: "bank_qr",
    country: "VN",
    currency: "VND",
    defaultForDomains: [],
    displayName: "Công ty Cổ phần Giải Trí Ngôi Sao Việt Can",
    entityType: "company",
    legalName: "CTY CO PHAN GIAI TRI NGOI SAO VIET CAN",
    receiverId: "recv_vnd_vietcan_acb",
    sourceNote: "Ảnh QR VietQR ACB",
    status: "ACTIVE_CONFIRMED",
    swiftCode: "ASCBVNVX",
    vietQrBankId: "ACB"
  },
  {
    assignmentStatus: "HOLD_NOT_ASSIGNED",
    channelType: "paypal_managed_qr",
    country: "US",
    currency: "USD",
    defaultForDomains: [],
    displayName: "Angel Edu Tam Foundation Inc",
    entityType: "organization",
    paypalManagedQrUrl:
      "https://www.paypal.com/qrcodes/managed/58701733-ae17-418e-bcf9-a31418519f3a?utm_source=old_merchant_lp",
    paypalMeBaseUrl: "https://paypal.me/AngelEduTamFoundationInc",
    paypalUsername: "@AngelEduTamFoundationInc",
    receiverId: "recv_paypal_angeledutam_foundation",
    sourceNote: "Đã scan QR trước đó, cần xác nhận màn hình nhận tiền / owner trước khi gán live",
    status: "NEEDS_QR_SCAN_CONFIRMATION"
  },
  {
    accountNumber: "200001161269",
    assignmentStatus: "ACTIVE_DOMAIN_DEFAULT",
    bankAddress: "210 E Main St, Rogersville, TN 37857",
    bankName: "Thread Bank",
    bankProvider: "Relay Financial",
    branch: "Thread Bank partner bank via Relay",
    channelType: "us_bank_account",
    country: "US",
    currency: "USD",
    defaultForDomains: [
      "vc.vetuonglai.com",
      "invest.vetuonglai.com",
      "life.vetuonglai.com"
    ],
    displayName: "Angel Edu Tam Foundation Inc",
    entityType: "organization",
    legalName: "Angel Edu Tam Foundation Inc",
    receiverId: "recv_usd_angeledutam_foundation_relay_thread",
    routingNumber: "064209588",
    sourceNote:
      "Founder-mapped USD rail for the vetuonglai surfaces (vc / invest / life). Relay account details from app.relayfi.com screenshots; the international USD path is via Thread Bank.",
    status: "ACTIVE_CONFIRMED",
    swiftCode: null,
    usRailCapabilities: [
      "US_ACH",
      "US_DOMESTIC_WIRE",
      "US_CHECK_DEPOSIT_DETAILS_IF_RELAY_ENABLED",
      "INTERNATIONAL_WIRE_REQUIRES_RELAY_SWIFT_DETAILS"
    ]
  }
];

const founderLockedDomainAssignments: DomainPaymentAssignment[] = [
  {
    domain: "tranhatam.com",
    fallbackVndReceiverId: "recv_vnd_personal_tranhatam_vcb",
    notes: "Founder-locked current active assignment.",
    primaryUsdReceiverId: "recv_usd_personal_tranhatam_paypal",
    primaryVndReceiverId: "recv_vnd_personal_tranhatam_acb",
    status: "ACTIVE_NOW"
  },
  {
    domain: "omdalat.com",
    notes:
      "Founder-directed active assignment for omdalat.com using Công ty TNHH SX - TM - DV Thai Lam as the primary VND receiver.",
    primaryVndReceiverId: "recv_vnd_thailam_acb",
    status: "ACTIVE_NOW"
  },
  {
    domain: "vc.vetuonglai.com",
    notes:
      "Founder-directed active VN assignment for vc.vetuonglai.com using Công ty TNHH ĐTTM Thanh Tam Phat as the primary VND receiver.",
    primaryVndReceiverId: "recv_vnd_thanhtamphat_acb",
    primaryUsdReceiverId: "recv_usd_angeledutam_foundation_relay_thread",
    status: "ACTIVE_NOW"
  },
  {
    domain: "invest.vetuonglai.com",
    notes:
      "Founder-directed active VN assignment for invest.vetuonglai.com using Công ty TNHH ĐTTM Thanh Tam Phat as the primary VND receiver, with Angel Edu Tam Foundation Inc as the international USD rail.",
    primaryVndReceiverId: "recv_vnd_thanhtamphat_acb",
    primaryUsdReceiverId: "recv_usd_angeledutam_foundation_relay_thread",
    status: "ACTIVE_NOW"
  },
  {
    domain: "life.vetuonglai.com",
    notes:
      "Founder-directed active VN assignment for life.vetuonglai.com using Công ty TNHH ĐTTM Thanh Tam Phat as the primary VND receiver, with Angel Edu Tam Foundation Inc as the international USD rail.",
    primaryVndReceiverId: "recv_vnd_thanhtamphat_acb",
    primaryUsdReceiverId: "recv_usd_angeledutam_foundation_relay_thread",
    status: "ACTIVE_NOW"
  }
];

const activeAssignmentDomains = new Set(
  founderLockedDomainAssignments.map((assignment) => normalizeDomain(assignment.domain))
);

const deferredDomainAssignments: DomainPaymentAssignment[] = siteActivationRegistryEntries
  .filter((entry) => !activeAssignmentDomains.has(normalizeDomain(entry.domain)))
  .map((entry) => ({
    domain: entry.domain,
    notes: `${entry.intakeId} prep packet is locked, but receiver assignment is deferred until founder instruction.`,
    status: "DEFERRED_UNTIL_FOUNDER_INSTRUCTION" as const
  }));

const domainAssignments: DomainPaymentAssignment[] = [
  ...founderLockedDomainAssignments,
  ...deferredDomainAssignments
];

const receiverRegistryById = new Map(receiverRegistry.map((receiver) => [receiver.receiverId, receiver]));
const domainAssignmentsByDomain = new Map(
  domainAssignments.map((assignment) => [normalizeDomain(assignment.domain), assignment])
);

export function getPaymentReceiverRegistrySnapshot() {
  return {
    assignmentMap: domainAssignments,
    generatedFrom: "PAY_IAI_ONE_RECEIVER_ACCOUNTS_MASTER_REGISTRY_2026.md",
    notificationRule: {
      deliveryOwner: "EMAIL_TEAM",
      mode: "domain_email_triplet",
      requiredAddresses: ["pay@domain", "billing@domain", "support@domain"],
      status: "PENDING_CLOUDFLARE_DOMAIN_MAIL_BINDING"
    },
    receiverCount: receiverRegistry.length,
    receivers: receiverRegistry.map(redactReceiverForRegistrySnapshot),
    rootRule:
      "No website may hard-code receiving accounts in UI or source code. All receiver selection must come from the centralized registry and domain assignment map.",
    routingRule: {
      nonVietnam: "show USD receiver first",
      vietnam: "show VND receiver first, optional USD fallback only if founder-assigned"
    },
    sensitiveReceiverRule:
      "HOLD_NOT_ASSIGNED receiver account details are redacted from the public registry snapshot. Full targets may only render through a founder-approved domain assignment.",
    version: "2026-04-23"
  } as const;
}

function redactReceiverForRegistrySnapshot(receiver: PaymentReceiver): PaymentReceiver {
  if (receiver.assignmentStatus !== "HOLD_NOT_ASSIGNED") {
    return receiver;
  }

  return {
    ...receiver,
    accountNumber: receiver.accountNumber ? "REDACTED_UNTIL_ASSIGNED" : undefined,
    routingNumber: receiver.routingNumber ? "REDACTED_UNTIL_ASSIGNED" : undefined,
    sourceNote:
      "Receiver is held for future founder assignment. Sensitive account details are redacted from the public registry snapshot."
  };
}

export function resolvePaymentRouting(query: PaymentRoutingQuery): PaymentRoutingResult {
  const domain = normalizeDomain(query.domain);
  const assignment = domainAssignmentsByDomain.get(domain) ?? null;
  const requestedCountry = normalizeCountry(query.country);
  const requestedCurrency = normalizeCurrency(query.currency);
  const requestedIdCountry = normalizeCountry(query.idCountry);
  const requestedAmount = normalizeAmount(query.amount);

  // ID-country policy is the strongest signal: if a payer presents a
  // VN-issued ID we must charge in VND; any other ID country must charge
  // USD. This OVERRIDES any caller-supplied currency or country hint, so
  // it is computed before resolveRequestedCurrency.
  const currencyPolicy: PaymentCurrencyPolicy | null = requestedIdCountry
    ? requestedIdCountry === "VN"
      ? {
          overrodeRequestedCurrency: requestedCurrency !== null && requestedCurrency !== "VND",
          requiredCurrency: "VND",
          rule: "VN_ID_REQUIRES_VND"
        }
      : {
          overrodeRequestedCurrency: requestedCurrency !== null && requestedCurrency !== "USD",
          requiredCurrency: "USD",
          rule: "NON_VN_ID_REQUIRES_USD"
        }
    : null;

  const effectiveCurrency = currencyPolicy?.requiredCurrency ?? requestedCurrency;
  const resolvedCurrency = resolveRequestedCurrency(requestedCountry, effectiveCurrency, assignment);
  const policyOverrideNote =
    currencyPolicy?.overrodeRequestedCurrency
      ? `Caller-supplied currency was overridden by ID-country policy (${currencyPolicy.rule}: ${currencyPolicy.requiredCurrency} required).`
      : null;

  if (!assignment) {
    return {
      assignment: null,
      assignmentStatus: "NOT_ASSIGNED_YET",
      availableCurrencies: [],
      channels: [],
      currencyPolicy,
      domain,
      fallbackChannels: [],
      notes: [
        ...(policyOverrideNote ? [policyOverrideNote] : []),
        "Domain has no founder-approved receiver assignment yet.",
        "Keep receiver selection blocked until founder maps domain -> currency -> receiver_id."
      ],
      requestedAmount,
      requestedCountry,
      requestedCurrency,
      requestedIdCountry,
      resolvedCurrency: null
    };
  }

  if (assignment.status === "DEFERRED_UNTIL_FOUNDER_INSTRUCTION") {
    return {
      assignment,
      assignmentStatus: assignment.status,
      availableCurrencies: [],
      channels: [],
      currencyPolicy,
      domain,
      fallbackChannels: [],
      notes: [
        ...(policyOverrideNote ? [policyOverrideNote] : []),
        // Keep assignment.notes at index 0 (or 1 if policy override fires) so
        // existing assertions on notes[0] containing "prep packet is locked"
        // still hold. The "Domain is prepared..." line below is the
        // user-facing summary surfaced by the payment-block render.
        assignment.notes,
        "Domain is prepared but receiver assignment is deferred until founder instruction.",
        "Payment assignment is intentionally deferred until founder maps domain -> currency -> receiver_id."
      ],
      requestedAmount,
      requestedCountry,
      requestedCurrency,
      requestedIdCountry,
      resolvedCurrency:
        currencyPolicy?.requiredCurrency ??
        requestedCurrency ??
        (requestedCountry === "VN" ? "VND" : requestedCountry ? "USD" : null)
    };
  }

  const channels: ResolvedRoutingChannel[] = [];
  const fallbackChannels: ResolvedRoutingChannel[] = [];
  const notes: string[] = [assignment.notes];

  if (resolvedCurrency === "VND") {
    if (assignment.primaryVndReceiverId) {
      channels.push(
        buildResolvedChannel({
          amount: requestedAmount,
          domain,
          isPrimary: true,
          packageCode: query.packageCode,
          receiverId: assignment.primaryVndReceiverId,
          reference: query.reference
        })
      );
    }

    if (assignment.fallbackVndReceiverId) {
      fallbackChannels.push(
        buildResolvedChannel({
          amount: requestedAmount,
          domain,
          isPrimary: false,
          packageCode: query.packageCode,
          receiverId: assignment.fallbackVndReceiverId,
          reference: query.reference
        })
      );
    }

    // Only expose USD as a fallback path when ID-country policy is NOT
    // forcing VND; if a VN-issued ID is presented, surfacing a USD rail
    // would invite policy-violating settlement.
    if (assignment.primaryUsdReceiverId && currencyPolicy?.rule !== "VN_ID_REQUIRES_VND") {
      notes.push("USD receiver remains optional fallback only for Vietnam-side routing.");
      fallbackChannels.push(
        buildResolvedChannel({
          amount: requestedAmount,
          domain,
          isPrimary: false,
          packageCode: query.packageCode,
          receiverId: assignment.primaryUsdReceiverId,
          reference: query.reference
        })
      );
    }
  } else if (resolvedCurrency === "USD") {
    if (assignment.primaryUsdReceiverId) {
      channels.push(
        buildResolvedChannel({
          amount: requestedAmount,
          domain,
          isPrimary: true,
          packageCode: query.packageCode,
          receiverId: assignment.primaryUsdReceiverId,
          reference: query.reference
        })
      );
    }

    // Only expose VND as a fallback path when ID-country policy is NOT
    // forcing USD; if a non-VN ID is presented, surfacing a VND rail
    // would invite policy-violating settlement.
    if (
      assignment.primaryVndReceiverId &&
      currencyPolicy?.rule !== "NON_VN_ID_REQUIRES_USD"
    ) {
      notes.push("VND local channel remains available only as a founder-controlled alternate path.");
      fallbackChannels.push(
        buildResolvedChannel({
          amount: requestedAmount,
          domain,
          isPrimary: false,
          packageCode: query.packageCode,
          receiverId: assignment.primaryVndReceiverId,
          reference: query.reference
        })
      );
    }
  }

  const availableCurrencies = Array.from(
    new Set(
      [...channels, ...fallbackChannels].map((channel) => channel.currency)
    )
  ) as PaymentCurrency[];

  if (policyOverrideNote) {
    notes.unshift(policyOverrideNote);
  }

  return {
    assignment,
    assignmentStatus: assignment.status,
    availableCurrencies,
    channels,
    currencyPolicy,
    domain,
    fallbackChannels,
    notes,
    requestedAmount,
    requestedCountry,
    requestedCurrency,
    requestedIdCountry,
    resolvedCurrency
  };
}

function buildResolvedChannel(input: {
  amount: number | null;
  domain: string;
  isPrimary: boolean;
  packageCode?: string | null;
  receiverId: string;
  reference?: string | null;
}): ResolvedRoutingChannel {
  const receiver = receiverRegistryById.get(input.receiverId);

  if (!receiver) {
    throw new Error(`Unknown payment receiver: ${input.receiverId}`);
  }

  const notificationAddresses = buildDomainNotificationAddresses(input.domain);
  const transferReference = buildTransferReference({
    domain: input.domain,
    packageCode: input.packageCode,
    reference: input.reference
  });

  if (receiver.channelType === "bank_qr") {
    return {
      channelType: receiver.channelType,
      currency: receiver.currency,
      displayInstruction:
        "Render bank transfer block with dynamic VietQR quick link, copy account controls, and transaction notification note.",
      isPrimary: input.isPrimary,
      paymentTarget: {
        account_holder_name: receiver.legalName ?? receiver.displayName,
        account_number: receiver.accountNumber ?? null,
        bank_name: receiver.bankName ?? null,
        branch: receiver.branch ?? null,
        swift_code: receiver.swiftCode ?? null
      },
      quickLink: {
        accountName: receiver.legalName ?? receiver.displayName,
        addInfo: transferReference,
        amount: input.amount,
        provider: "vietqr_quick_link",
        template: "compact2",
        url: buildVietQrQuickLink({
          accountName: receiver.legalName ?? receiver.displayName,
          accountNumber: receiver.accountNumber ?? "",
          addInfo: transferReference,
          amount: input.amount,
          bankId: receiver.vietQrBankId ?? receiver.bankName ?? "ACB"
        })
      },
      receiver,
      transactionNotification: {
        addresses: notificationAddresses,
        deliveryOwner: "EMAIL_TEAM",
        required: true,
        status: "PENDING_CLOUDFLARE_DOMAIN_MAIL_BINDING"
      }
    };
  }

  if (receiver.channelType === "paypal_managed_qr") {
    return {
      channelType: receiver.channelType,
      currency: receiver.currency,
      displayInstruction:
        "Render PayPal organization block with managed QR reference or paypal.me deep link only after owner confirmation.",
      isPrimary: input.isPrimary,
      paymentTarget: {
        paypal_managed_qr_url: receiver.paypalManagedQrUrl ?? null,
        paypal_username: receiver.paypalUsername ?? null,
        provider_name: "PayPal"
      },
      quickLink: {
        amount: input.amount,
        provider: "paypal_me",
        url: buildPaypalMeLink(receiver.paypalMeBaseUrl, input.amount)
      },
      receiver,
      transactionNotification: {
        addresses: notificationAddresses,
        deliveryOwner: "EMAIL_TEAM",
        required: true,
        status: "PENDING_CLOUDFLARE_DOMAIN_MAIL_BINDING"
      }
    };
  }

  if (receiver.channelType === "us_bank_account") {
    return {
      channelType: receiver.channelType,
      currency: receiver.currency,
      displayInstruction:
        "Render United States USD bank transfer details only after founder assigns this receiver to the domain. Support ACH and domestic wire from Relay/Thread Bank details; international wire requires the separate Relay SWIFT details screen.",
      isPrimary: input.isPrimary,
      paymentTarget: {
        account_holder_name: receiver.legalName ?? receiver.displayName,
        account_number: receiver.accountNumber ?? null,
        bank_address: receiver.bankAddress ?? null,
        bank_name: receiver.bankName ?? null,
        bank_provider: receiver.bankProvider ?? null,
        routing_number: receiver.routingNumber ?? null,
        supported_rails: receiver.usRailCapabilities?.join(", ") ?? null,
        swift_code: receiver.swiftCode ?? null
      },
      quickLink: null,
      receiver,
      transactionNotification: {
        addresses: notificationAddresses,
        deliveryOwner: "EMAIL_TEAM",
        required: true,
        status: "PENDING_CLOUDFLARE_DOMAIN_MAIL_BINDING"
      }
    };
  }

  return {
    channelType: receiver.channelType,
    currency: receiver.currency,
    displayInstruction:
      "Render PayPal email target and keep transaction-routing note explicit until a founder-approved PayPal.me or Checkout link is assigned.",
    isPrimary: input.isPrimary,
    paymentTarget: {
      paypal_email: receiver.paypalEmail ?? null,
      provider_name: "PayPal"
    },
    quickLink: {
      amount: input.amount,
      provider: "paypal_me",
      url: buildPaypalMeLink(receiver.paypalMeBaseUrl, input.amount)
    },
    receiver,
    transactionNotification: {
      addresses: notificationAddresses,
      deliveryOwner: "EMAIL_TEAM",
      required: true,
      status: "PENDING_CLOUDFLARE_DOMAIN_MAIL_BINDING"
    }
  };
}

function resolveRequestedCurrency(
  requestedCountry: string | null,
  requestedCurrency: PaymentCurrency | null,
  assignment: DomainPaymentAssignment | null
): PaymentCurrency | null {
  if (requestedCurrency) {
    return requestedCurrency;
  }

  if (requestedCountry === "VN") {
    return assignment?.primaryVndReceiverId ? "VND" : assignment?.primaryUsdReceiverId ? "USD" : null;
  }

  return assignment?.primaryUsdReceiverId ? "USD" : assignment?.primaryVndReceiverId ? "VND" : null;
}

function normalizeDomain(value: string): string {
  const trimmed = value.trim().toLowerCase();
  const withoutProtocol = trimmed.replace(/^https?:\/\//, "");
  const hostname = withoutProtocol.split("/")[0] ?? withoutProtocol;
  return hostname.replace(/^www\./, "");
}

function normalizeCountry(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value.trim().toUpperCase();
}

function normalizeCurrency(value: string | null | undefined): PaymentCurrency | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (normalized === "USD" || normalized === "VND") {
    return normalized;
  }

  return null;
}

function normalizeAmount(value: number | null | undefined): number | null {
  if (!Number.isFinite(value ?? NaN)) {
    return null;
  }

  const numeric = Math.max(0, Math.trunc(value ?? 0));
  return numeric > 0 ? numeric : null;
}

function buildTransferReference(input: {
  domain: string;
  packageCode?: string | null;
  reference?: string | null;
}): string {
  const rawValue = [input.reference, input.packageCode, input.domain.split(".")[0]]
    .filter((value) => typeof value === "string" && value.trim().length > 0)
    .join(" ")
    .trim();

  const normalized = rawValue
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  if (!normalized) {
    return "PAY IAI ONE";
  }

  return normalized.slice(0, 25).trim();
}

function buildDomainNotificationAddresses(domain: string): string[] {
  return notificationLocalParts.map((localPart) => `${localPart}@${domain}`);
}

export function buildVietQrQuickLink(input: {
  accountName: string;
  accountNumber: string;
  addInfo: string;
  amount: number | null;
  bankId: string;
}): string {
  const url = new URL(
    `https://img.vietqr.io/image/${encodeURIComponent(input.bankId)}-${encodeURIComponent(
      input.accountNumber
    )}-compact2.png`
  );

  if (input.amount) {
    url.searchParams.set("amount", String(input.amount));
  }

  if (input.addInfo) {
    url.searchParams.set("addInfo", input.addInfo);
  }

  if (input.accountName) {
    url.searchParams.set("accountName", input.accountName);
  }

  return url.toString();
}

function buildPaypalMeLink(baseUrl: string | undefined, amount: number | null): string | null {
  if (!baseUrl) {
    return null;
  }

  const normalizedBase = baseUrl.replace(/\/+$/, "");
  if (!amount) {
    return normalizedBase;
  }

  return `${normalizedBase}/${amount}`;
}
