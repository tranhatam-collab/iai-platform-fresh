import {
  getPaymentSurfaceRegistryEntry,
  type PaymentSurfaceRegistryEntry
} from "./payment-surface-registry.js";
import {
  getTeamDPaymentEmailProfile,
  type TeamDPaymentEmailProfile
} from "./team-d-payment-email-profiles.js";

export interface PaymentEmailLocalizedCopy {
  en: string;
  vi: string;
}

export type PaymentEmailTemplateId =
  | "adjustment_notice"
  | "billing_failed"
  | "checkout_pending"
  | "checkout_status_update"
  | "contact_request_received"
  | "credit_note_or_adjustment"
  | "docs_access_guidance"
  | "invoice_available"
  | "invoice_issued"
  | "invoice_paid"
  | "join_request_received"
  | "mailbox_sender_binding_missing"
  | "manual_payment_instruction"
  | "manual_review_notice"
  | "payment_email_delivery_failed"
  | "payment_expired"
  | "payment_failed"
  | "payment_failed_notice"
  | "payment_method_update_required"
  | "payment_receipt"
  | "payment_received"
  | "provider_webhook_failed"
  | "quote_ready"
  | "receiver_profile_missing"
  | "refund_manual_review_required"
  | "refund_notice"
  | "renewal_failed"
  | "renewal_success"
  | "settlement_mismatch_alert"
  | "support_request_received"
  | "usage_threshold_notice";

export interface PaymentEmailTemplateDefinition {
  id: PaymentEmailTemplateId;
  previewText: PaymentEmailLocalizedCopy;
  replyTo: string;
  sender: string;
  subject: PaymentEmailLocalizedCopy;
  textBody: string;
  trigger: string;
}

export interface PaymentEmailTemplateRegistry {
  allowedLocales: string[];
  commonVariables: string[];
  customerFacingPaymentEmailAllowed: boolean;
  defaultLocale: string;
  domain: string;
  footer: string;
  paymentPack: string;
  policy: {
    billingFailedRefundSender: string;
    noreplyAllowedForPaymentMail: boolean;
    paymentReceiptSender: string;
    replyTo: string;
  };
  recommendedMapping: Array<{
    flow: string;
    sender: string;
    templateId: PaymentEmailTemplateId;
  }>;
  status: "LOCKED_READY_FOR_RUNTIME_BINDING";
  surfaceClass: string;
  surfaceRole: string;
  templateCount: number;
  templateScope?: string;
  templates: Partial<Record<PaymentEmailTemplateId, PaymentEmailTemplateDefinition>>;
  toneMode: string;
  version: "2026-04-22";
}

interface TemplateMeta {
  billingSender: string;
  brandName: string;
  domain: string;
  paySender: string;
  replyTo: string;
  supportEmail: string;
  surface: PaymentSurfaceRegistryEntry;
}

interface PackRegistryBuildResult {
  recommendedMapping: PaymentEmailTemplateRegistry["recommendedMapping"];
  templates: Partial<Record<PaymentEmailTemplateId, PaymentEmailTemplateDefinition>>;
}

function buildTeamDSiteCoreRegistry(
  profile: TeamDPaymentEmailProfile
): PaymentEmailTemplateRegistry {
  const templates: Partial<Record<PaymentEmailTemplateId, PaymentEmailTemplateDefinition>> = {
    payment_receipt: createTemplate(
      "payment_receipt",
      profile.senderPolicy.paySender,
      profile.senderPolicy.replyTo,
      profile.copy.receipt.subject,
      profile.copy.receipt.preview,
      `Xin chào {{customer_name}},

${profile.copy.receipt.intro.vi}

Thông tin thanh toán
- ${profile.reference.label.vi}: ${profile.reference.valueVariable}
- ${profile.item.label.vi}: ${profile.item.valueVariable}
- Số tiền: {{amount}} {{currency}}
- Thời gian xác nhận: {{paid_at}}
- Mã tham chiếu cổng thanh toán: {{provider_ref}}

${profile.links.receipt.label.vi}:
${profile.links.receipt.valueVariable}

Nếu bạn cần hỗ trợ thêm hoặc thấy giao dịch này không đúng, vui lòng liên hệ:
{{support_email}}

Trân trọng,
${profile.brandName}

---

Hello {{customer_name}},

${profile.copy.receipt.intro.en}

Payment details
- ${profile.reference.label.en}: ${profile.reference.valueVariable}
- ${profile.item.label.en}: ${profile.item.valueVariable}
- Amount: {{amount}} {{currency}}
- Confirmed at: {{paid_at}}
- Provider reference: {{provider_ref}}

${profile.links.receipt.label.en}:
${profile.links.receipt.valueVariable}

If you need support or this transaction looks incorrect, contact:
{{support_email}}

Best regards,
${profile.brandName}`,
      profile.triggers.receipt
    ),
    checkout_status_update: createTemplate(
      "checkout_status_update",
      profile.senderPolicy.billingSender,
      profile.senderPolicy.replyTo,
      profile.copy.pending.subject,
      profile.copy.pending.preview,
      `Xin chào {{customer_name}},

${profile.copy.pending.intro.vi}

Thông tin checkout
- ${profile.reference.label.vi}: ${profile.reference.valueVariable}
- ${profile.item.label.vi}: ${profile.item.valueVariable}
- Số tiền: {{amount}} {{currency}}
- Cổng thanh toán: {{provider_name}}

${profile.links.pending.label.vi}:
${profile.links.pending.valueVariable}

Nếu trạng thái chưa thay đổi sau một khoảng thời gian hợp lý, vui lòng liên hệ:
{{support_email}}

Trân trọng,
${profile.brandName}

---

Hello {{customer_name}},

${profile.copy.pending.intro.en}

Checkout details
- ${profile.reference.label.en}: ${profile.reference.valueVariable}
- ${profile.item.label.en}: ${profile.item.valueVariable}
- Amount: {{amount}} {{currency}}
- Provider: {{provider_name}}

${profile.links.pending.label.en}:
${profile.links.pending.valueVariable}

If the status does not change after a reasonable window, contact:
{{support_email}}

Best regards,
${profile.brandName}`,
      profile.triggers.pending
    ),
    payment_failed_notice: createTemplate(
      "payment_failed_notice",
      profile.senderPolicy.billingSender,
      profile.senderPolicy.replyTo,
      profile.copy.failed.subject,
      profile.copy.failed.preview,
      `Xin chào {{customer_name}},

${profile.copy.failed.intro.vi}

Thông tin giao dịch
- ${profile.reference.label.vi}: ${profile.reference.valueVariable}
- ${profile.item.label.vi}: ${profile.item.valueVariable}
- Số tiền: {{amount}} {{currency}}
- Cổng thanh toán: {{provider_name}}

${profile.links.failed.label.vi}:
${profile.links.failed.valueVariable}

Nếu bạn tin rằng giao dịch đã bị trừ tiền nhưng hệ thống vẫn báo chưa hoàn tất, vui lòng liên hệ ngay:
{{support_email}}

Trân trọng,
${profile.brandName}

---

Hello {{customer_name}},

${profile.copy.failed.intro.en}

Transaction details
- ${profile.reference.label.en}: ${profile.reference.valueVariable}
- ${profile.item.label.en}: ${profile.item.valueVariable}
- Amount: {{amount}} {{currency}}
- Provider: {{provider_name}}

${profile.links.failed.label.en}:
${profile.links.failed.valueVariable}

If you believe funds were captured but the system still shows the payment as incomplete, contact:
{{support_email}}

Best regards,
${profile.brandName}`,
      profile.triggers.failed
    ),
    refund_notice: createTemplate(
      "refund_notice",
      profile.senderPolicy.billingSender,
      profile.senderPolicy.replyTo,
      profile.copy.refund.subject,
      profile.copy.refund.preview,
      `Xin chào {{customer_name}},

${profile.copy.refund.intro.vi}

Thông tin cập nhật
- ${profile.reference.label.vi}: ${profile.reference.valueVariable}
- ${profile.item.label.vi}: ${profile.item.valueVariable}
- Số tiền hoàn / điều chỉnh: {{refund_amount}} {{currency}}
- Lý do: {{refund_reason}}

${profile.links.refund.label.vi}:
${profile.links.refund.valueVariable}

Nếu bạn cần đối chiếu thêm, vui lòng liên hệ:
{{support_email}}

Trân trọng,
${profile.brandName}

---

Hello {{customer_name}},

${profile.copy.refund.intro.en}

Update details
- ${profile.reference.label.en}: ${profile.reference.valueVariable}
- ${profile.item.label.en}: ${profile.item.valueVariable}
- Refunded / adjusted amount: {{refund_amount}} {{currency}}
- Reason: {{refund_reason}}

${profile.links.refund.label.en}:
${profile.links.refund.valueVariable}

If you need further reconciliation, contact:
{{support_email}}

Best regards,
${profile.brandName}`,
      profile.triggers.refund
    )
  };

  if (profile.domain === "omdalat.com") {
    Object.assign(templates, createOmdalatPaymentAndInteractionTemplates(profile));
  }

  return {
    allowedLocales: [...profile.allowedLocales],
    commonVariables: createCoreCommonVariables(),
    customerFacingPaymentEmailAllowed: profile.customerFacingPaymentEmailAllowed,
    defaultLocale: profile.defaultLocale,
    domain: profile.domain,
    footer: createFooter(
      profile.brandName,
      profile.domain,
      profile.senderPolicy.supportEmail
    ),
    paymentPack: profile.paymentPack,
    policy: {
      billingFailedRefundSender: profile.senderPolicy.billingSender,
      noreplyAllowedForPaymentMail: profile.senderPolicy.noreplyAllowedForPaymentMail,
      paymentReceiptSender: profile.senderPolicy.paySender,
      replyTo: profile.senderPolicy.replyTo
    },
    recommendedMapping: [
      {
        flow: "checkout_status_update",
        sender: profile.senderPolicy.billingSender,
        templateId: "checkout_status_update"
      },
      {
        flow: "payment_receipt",
        sender: profile.senderPolicy.paySender,
        templateId: "payment_receipt"
      },
      {
        flow: "payment_failed_notice",
        sender: profile.senderPolicy.billingSender,
        templateId: "payment_failed_notice"
      },
      {
        flow: "refund_notice",
        sender: profile.senderPolicy.billingSender,
        templateId: "refund_notice"
      },
      ...createOmdalatRecommendedMapping(profile)
    ],
    status: "LOCKED_READY_FOR_RUNTIME_BINDING",
    surfaceClass: profile.surfaceClass,
    surfaceRole: profile.surfaceRole,
    templateCount: Object.keys(templates).length,
    templateScope: profile.templateScope,
    templates,
    toneMode: profile.toneMode,
    version: "2026-04-22"
  };
}

function createOmdalatPaymentAndInteractionTemplates(
  profile: TeamDPaymentEmailProfile
): Partial<Record<PaymentEmailTemplateId, PaymentEmailTemplateDefinition>> {
  const paySender = profile.senderPolicy.paySender;
  const billingSender = profile.senderPolicy.billingSender;
  const supportSender = profile.senderPolicy.supportEmail;
  const replyTo = profile.senderPolicy.replyTo;

  return {
    checkout_pending: createTemplate(
      "checkout_pending",
      billingSender,
      replyTo,
      {
        en: "Om Dalat | Checkout is waiting for confirmation",
        vi: "Ôm Đà Lạt | Checkout đang chờ xác nhận"
      },
      {
        en: "We recorded your Om Dalat checkout and are waiting for provider confirmation.",
        vi: "Chúng tôi đã ghi nhận checkout Ôm Đà Lạt của bạn và đang chờ xác nhận từ cổng thanh toán."
      },
      `Xin chào {{customer_name}},

Chúng tôi đã ghi nhận checkout cho quyền tham gia Ôm Đà Lạt. Giao dịch hiện đang chờ xác nhận từ cổng thanh toán.

Thông tin checkout
- Mã đơn hàng: {{order_id}}
- Gói / quyền tham gia: {{product_name}}
- Số tiền: {{amount}} {{currency}}
- Cổng thanh toán: {{provider_name}}
- Hết hạn thanh toán: {{expires_at}}

Tiếp tục hoặc kiểm tra checkout:
{{checkout_url}}

Tài liệu hướng dẫn Ôm Đà Lạt:
{{docs_url}}

Nếu bạn cần hỗ trợ, hãy trả lời email này hoặc liên hệ:
{{support_email}}

Trân trọng,
Ôm Đà Lạt

---

Hello {{customer_name}},

We recorded your Om Dalat checkout. The transaction is currently waiting for provider confirmation.

Checkout details
- Order ID: {{order_id}}
- Access / membership: {{product_name}}
- Amount: {{amount}} {{currency}}
- Provider: {{provider_name}}
- Payment expires at: {{expires_at}}

Continue or review checkout:
{{checkout_url}}

Om Dalat documentation:
{{docs_url}}

If you need help, reply to this email or contact:
{{support_email}}

Best regards,
Om Dalat`,
      "checkout Ôm Đà Lạt đã tạo nhưng cổng thanh toán chưa xác nhận"
    ),
    manual_payment_instruction: createTemplate(
      "manual_payment_instruction",
      paySender,
      replyTo,
      {
        en: "Om Dalat | Official payment instructions #{{order_id}}",
        vi: "Ôm Đà Lạt | Hướng dẫn thanh toán chính thức #{{order_id}}"
      },
      {
        en: "Use only the official Om Dalat payment route in this email.",
        vi: "Vui lòng chỉ dùng tuyến thanh toán chính thức của Ôm Đà Lạt trong email này."
      },
      `Xin chào {{customer_name}},

Ôm Đà Lạt đã tạo hướng dẫn thanh toán chính thức cho yêu cầu của bạn.

Thông tin thanh toán
- Mã đơn hàng: {{order_id}}
- Gói / quyền tham gia: {{product_name}}
- Số tiền: {{amount}} {{currency}}
- Mã phiên thanh toán: {{payment_intent_id}}

Đường dẫn thanh toán chính thức:
{{checkout_url}}

Sau khi hoàn tất, hệ thống sẽ gửi biên nhận và hướng dẫn bước tiếp theo. Không chuyển khoản hoặc thanh toán qua đường dẫn không thuộc hệ thống Ôm Đà Lạt.

Tài liệu hướng dẫn:
{{docs_url}}

Hỗ trợ:
{{support_email}}

Trân trọng,
Ôm Đà Lạt

---

Hello {{customer_name}},

Om Dalat created the official payment instructions for your request.

Payment details
- Order ID: {{order_id}}
- Access / membership: {{product_name}}
- Amount: {{amount}} {{currency}}
- Payment intent ID: {{payment_intent_id}}

Official payment link:
{{checkout_url}}

After completion, the system will send your receipt and next-step guidance. Do not pay through links outside the Om Dalat system.

Documentation:
{{docs_url}}

Support:
{{support_email}}

Best regards,
Om Dalat`,
      "hướng dẫn thanh toán thủ công hoặc VietQR chính thức được tạo"
    ),
    payment_failed: createTemplate(
      "payment_failed",
      billingSender,
      replyTo,
      {
        en: "Om Dalat | Payment was not completed #{{order_id}}",
        vi: "Ôm Đà Lạt | Thanh toán chưa hoàn tất #{{order_id}}"
      },
      {
        en: "Your Om Dalat payment was not completed. You can retry safely.",
        vi: "Thanh toán Ôm Đà Lạt của bạn chưa hoàn tất. Bạn có thể thử lại an toàn."
      },
      `Xin chào {{customer_name}},

Thanh toán cho quyền tham gia Ôm Đà Lạt chưa hoàn tất.

Thông tin giao dịch
- Mã đơn hàng: {{order_id}}
- Gói / quyền tham gia: {{product_name}}
- Số tiền: {{amount}} {{currency}}
- Cổng thanh toán: {{provider_name}}
- Mã tham chiếu cổng thanh toán: {{provider_ref}}

Thử lại thanh toán:
{{checkout_url}}

Nếu tài khoản của bạn đã bị trừ tiền nhưng email này vẫn báo chưa hoàn tất, vui lòng gửi biên nhận cho:
{{support_email}}

Tài liệu hỗ trợ:
{{docs_url}}

Trân trọng,
Ôm Đà Lạt

---

Hello {{customer_name}},

Your Om Dalat payment was not completed.

Transaction details
- Order ID: {{order_id}}
- Access / membership: {{product_name}}
- Amount: {{amount}} {{currency}}
- Provider: {{provider_name}}
- Provider reference: {{provider_ref}}

Retry payment:
{{checkout_url}}

If your account was charged but this email still says incomplete, send your proof to:
{{support_email}}

Support docs:
{{docs_url}}

Best regards,
Om Dalat`,
      "thanh toán Ôm Đà Lạt thất bại hoặc bị cổng thanh toán từ chối"
    ),
    payment_expired: createTemplate(
      "payment_expired",
      billingSender,
      replyTo,
      {
        en: "Om Dalat | Payment link expired #{{order_id}}",
        vi: "Ôm Đà Lạt | Link thanh toán đã hết hạn #{{order_id}}"
      },
      {
        en: "Your Om Dalat payment link expired. Create a new checkout if you still want to continue.",
        vi: "Link thanh toán Ôm Đà Lạt đã hết hạn. Bạn có thể tạo checkout mới nếu vẫn muốn tiếp tục."
      },
      `Xin chào {{customer_name}},

Link thanh toán cho đơn Ôm Đà Lạt này đã hết hạn.

Thông tin đơn
- Mã đơn hàng: {{order_id}}
- Gói / quyền tham gia: {{product_name}}
- Hết hạn lúc: {{expires_at}}

Tạo hoặc mở lại checkout:
{{checkout_url}}

Tài liệu hướng dẫn:
{{docs_url}}

Hỗ trợ:
{{support_email}}

Trân trọng,
Ôm Đà Lạt

---

Hello {{customer_name}},

The payment link for this Om Dalat order has expired.

Order details
- Order ID: {{order_id}}
- Access / membership: {{product_name}}
- Expired at: {{expires_at}}

Create or reopen checkout:
{{checkout_url}}

Documentation:
{{docs_url}}

Support:
{{support_email}}

Best regards,
Om Dalat`,
      "link thanh toán Ôm Đà Lạt hết hạn"
    ),
    adjustment_notice: createTemplate(
      "adjustment_notice",
      billingSender,
      replyTo,
      {
        en: "Om Dalat | Payment adjustment update #{{order_id}}",
        vi: "Ôm Đà Lạt | Cập nhật điều chỉnh thanh toán #{{order_id}}"
      },
      {
        en: "A payment adjustment was recorded for your Om Dalat order.",
        vi: "Một điều chỉnh thanh toán đã được ghi nhận cho đơn Ôm Đà Lạt của bạn."
      },
      `Xin chào {{customer_name}},

Ôm Đà Lạt đã ghi nhận một điều chỉnh liên quan đến giao dịch của bạn.

Thông tin điều chỉnh
- Mã đơn hàng: {{order_id}}
- Gói / quyền tham gia: {{product_name}}
- Số tiền điều chỉnh: {{refund_amount}} {{currency}}
- Lý do: {{refund_reason}}

Xem chi tiết:
{{billing_url}}

Tài liệu đối chiếu:
{{docs_url}}

Nếu thông tin chưa đúng, vui lòng liên hệ:
{{support_email}}

Trân trọng,
Ôm Đà Lạt

---

Hello {{customer_name}},

Om Dalat recorded an adjustment related to your transaction.

Adjustment details
- Order ID: {{order_id}}
- Access / membership: {{product_name}}
- Adjusted amount: {{refund_amount}} {{currency}}
- Reason: {{refund_reason}}

Review details:
{{billing_url}}

Reconciliation docs:
{{docs_url}}

If anything looks incorrect, contact:
{{support_email}}

Best regards,
Om Dalat`,
      "điều chỉnh thanh toán Ôm Đà Lạt được ghi nhận"
    ),
    invoice_available: createTemplate(
      "invoice_available",
      billingSender,
      replyTo,
      {
        en: "Om Dalat | Invoice is available #{{invoice_id}}",
        vi: "Ôm Đà Lạt | Hóa đơn đã sẵn sàng #{{invoice_id}}"
      },
      {
        en: "Your Om Dalat invoice or payment record is ready to review.",
        vi: "Hóa đơn hoặc bản ghi thanh toán Ôm Đà Lạt của bạn đã sẵn sàng để xem."
      },
      `Xin chào {{customer_name}},

Hóa đơn hoặc bản ghi thanh toán Ôm Đà Lạt đã sẵn sàng.

Thông tin
- Mã hóa đơn: {{invoice_id}}
- Mã đơn hàng: {{order_id}}
- Gói / quyền tham gia: {{product_name}}
- Số tiền: {{amount}} {{currency}}

Xem hóa đơn:
{{invoice_url}}

Tài liệu hướng dẫn:
{{docs_url}}

Hỗ trợ:
{{support_email}}

Trân trọng,
Ôm Đà Lạt

---

Hello {{customer_name}},

Your Om Dalat invoice or payment record is ready.

Details
- Invoice ID: {{invoice_id}}
- Order ID: {{order_id}}
- Access / membership: {{product_name}}
- Amount: {{amount}} {{currency}}

View invoice:
{{invoice_url}}

Documentation:
{{docs_url}}

Support:
{{support_email}}

Best regards,
Om Dalat`,
      "hóa đơn hoặc bản ghi thanh toán Ôm Đà Lạt đã sẵn sàng"
    ),
    contact_request_received: createTemplate(
      "contact_request_received",
      supportSender,
      replyTo,
      {
        en: "Om Dalat | We received your message",
        vi: "Ôm Đà Lạt | Chúng tôi đã nhận được tin nhắn của bạn"
      },
      {
        en: "The Om Dalat team received your message and will reply from the support mailbox.",
        vi: "Đội ngũ Ôm Đà Lạt đã nhận được tin nhắn của bạn và sẽ phản hồi từ hộp thư hỗ trợ."
      },
      `Xin chào {{customer_name}},

Chúng tôi đã nhận được tin nhắn của bạn gửi tới Ôm Đà Lạt.

Thông tin tham chiếu
- Mã yêu cầu: {{request_id}}
- Chủ đề / nhu cầu: {{product_name}}

Trong lúc chờ phản hồi, bạn có thể xem tài liệu hướng dẫn tại:
{{docs_url}}

Nếu cần bổ sung thông tin, vui lòng trả lời trực tiếp email này.

Trân trọng,
Ôm Đà Lạt

---

Hello {{customer_name}},

We received your message to Om Dalat.

Reference details
- Request ID: {{request_id}}
- Topic / need: {{product_name}}

While waiting for a reply, you can review our documentation here:
{{docs_url}}

If you need to add context, reply directly to this email.

Best regards,
Om Dalat`,
      "form liên hệ Ôm Đà Lạt được gửi từ web"
    ),
    support_request_received: createTemplate(
      "support_request_received",
      supportSender,
      replyTo,
      {
        en: "Om Dalat | Support request received #{{request_id}}",
        vi: "Ôm Đà Lạt | Đã nhận yêu cầu hỗ trợ #{{request_id}}"
      },
      {
        en: "We received your Om Dalat support request and opened a support thread.",
        vi: "Chúng tôi đã nhận yêu cầu hỗ trợ Ôm Đà Lạt của bạn và mở một luồng hỗ trợ."
      },
      `Xin chào {{customer_name}},

Yêu cầu hỗ trợ của bạn đã được ghi nhận.

Thông tin yêu cầu
- Mã yêu cầu: {{request_id}}
- Chủ đề: {{product_name}}
- Workspace / bối cảnh: {{workspace_name}}

Tài liệu tự xử lý nhanh:
{{docs_url}}

Kênh hỗ trợ:
{{support_email}}

Trân trọng,
Ôm Đà Lạt

---

Hello {{customer_name}},

Your support request has been recorded.

Request details
- Request ID: {{request_id}}
- Topic: {{product_name}}
- Workspace / context: {{workspace_name}}

Self-service documentation:
{{docs_url}}

Support channel:
{{support_email}}

Best regards,
Om Dalat`,
      "yêu cầu hỗ trợ Ôm Đà Lạt được tạo"
    ),
    join_request_received: createTemplate(
      "join_request_received",
      supportSender,
      replyTo,
      {
        en: "Om Dalat | Join request received",
        vi: "Ôm Đà Lạt | Đã nhận yêu cầu tham gia"
      },
      {
        en: "We received your request to join Om Dalat and will guide the next step.",
        vi: "Chúng tôi đã nhận yêu cầu tham gia Ôm Đà Lạt và sẽ hướng dẫn bước tiếp theo."
      },
      `Xin chào {{customer_name}},

Ôm Đà Lạt đã nhận yêu cầu tham gia của bạn.

Thông tin
- Gói / nhu cầu: {{product_name}}
- Mã yêu cầu: {{request_id}}

Nếu yêu cầu cần thanh toán hoặc xác minh thêm, hệ thống sẽ gửi email tiếp theo từ pay@omdalat.com hoặc billing@omdalat.com.

Đọc tài liệu bắt đầu:
{{docs_url}}

Liên hệ hỗ trợ:
{{support_email}}

Trân trọng,
Ôm Đà Lạt

---

Hello {{customer_name}},

Om Dalat received your join request.

Details
- Package / need: {{product_name}}
- Request ID: {{request_id}}

If the request requires payment or additional verification, the system will send the next email from pay@omdalat.com or billing@omdalat.com.

Start here:
{{docs_url}}

Support:
{{support_email}}

Best regards,
Om Dalat`,
      "yêu cầu tham gia Ôm Đà Lạt được gửi từ web"
    ),
    docs_access_guidance: createTemplate(
      "docs_access_guidance",
      supportSender,
      replyTo,
      {
        en: "Om Dalat | Documentation and next steps",
        vi: "Ôm Đà Lạt | Tài liệu hướng dẫn và bước tiếp theo"
      },
      {
        en: "Use this email to continue with Om Dalat documentation and support.",
        vi: "Dùng email này để tiếp tục với tài liệu và hỗ trợ của Ôm Đà Lạt."
      },
      `Xin chào {{customer_name}},

Đây là bộ hướng dẫn chính thức để bạn tiếp tục với Ôm Đà Lạt.

Tài liệu:
{{docs_url}}

Trang hỗ trợ:
{{support_url}}

Nếu email này liên quan đến thanh toán, vui lòng giữ lại các mã sau để đối chiếu:
- Mã đơn hàng: {{order_id}}
- Mã phiên thanh toán: {{payment_intent_id}}
- Mã tham chiếu cổng thanh toán: {{provider_ref}}

Trân trọng,
Ôm Đà Lạt

---

Hello {{customer_name}},

This is the official guidance packet for continuing with Om Dalat.

Documentation:
{{docs_url}}

Support page:
{{support_url}}

If this email relates to a payment, keep these references for reconciliation:
- Order ID: {{order_id}}
- Payment intent ID: {{payment_intent_id}}
- Provider reference: {{provider_ref}}

Best regards,
Om Dalat`,
      "gửi hướng dẫn docs hoặc next-step cho người dùng Ôm Đà Lạt"
    )
  };
}

function createOmdalatRecommendedMapping(
  profile: TeamDPaymentEmailProfile
): PaymentEmailTemplateRegistry["recommendedMapping"] {
  if (profile.domain !== "omdalat.com") {
    return [];
  }

  return [
    {
      flow: "checkout_pending",
      sender: profile.senderPolicy.billingSender,
      templateId: "checkout_pending"
    },
    {
      flow: "manual_payment_instruction",
      sender: profile.senderPolicy.paySender,
      templateId: "manual_payment_instruction"
    },
    {
      flow: "payment_failed",
      sender: profile.senderPolicy.billingSender,
      templateId: "payment_failed"
    },
    {
      flow: "payment_expired",
      sender: profile.senderPolicy.billingSender,
      templateId: "payment_expired"
    },
    {
      flow: "adjustment_notice",
      sender: profile.senderPolicy.billingSender,
      templateId: "adjustment_notice"
    },
    {
      flow: "invoice_available",
      sender: profile.senderPolicy.billingSender,
      templateId: "invoice_available"
    },
    {
      flow: "contact_request_received",
      sender: profile.senderPolicy.supportEmail,
      templateId: "contact_request_received"
    },
    {
      flow: "support_request_received",
      sender: profile.senderPolicy.supportEmail,
      templateId: "support_request_received"
    },
    {
      flow: "join_request_received",
      sender: profile.senderPolicy.supportEmail,
      templateId: "join_request_received"
    },
    {
      flow: "docs_access_guidance",
      sender: profile.senderPolicy.supportEmail,
      templateId: "docs_access_guidance"
    }
  ];
}

function createFooter(brandName: string, domain: string, supportEmail: string) {
  return `Email này được gửi tự động từ ${brandName} liên quan đến giao dịch hoặc trạng thái thanh toán của bạn.
Nếu bạn cần hỗ trợ, vui lòng liên hệ: ${supportEmail}
https://${domain}

---

This email was sent automatically from ${brandName} regarding your transaction or payment status.
If you need support, please contact: ${supportEmail}
https://${domain}`;
}

function createTemplate(
  id: PaymentEmailTemplateId,
  sender: string,
  replyTo: string,
  subject: PaymentEmailLocalizedCopy,
  previewText: PaymentEmailLocalizedCopy,
  textBody: string,
  trigger: string
): PaymentEmailTemplateDefinition {
  return {
    id,
    previewText,
    replyTo,
    sender,
    subject,
    textBody,
    trigger
  };
}

function createCoreCommonVariables() {
  return [
    "{{brand_name}}",
    "{{surface_domain}}",
    "{{customer_name}}",
    "{{workspace_name}}",
    "{{order_id}}",
    "{{payment_intent_id}}",
    "{{receipt_id}}",
    "{{invoice_id}}",
    "{{product_name}}",
    "{{package_name}}",
    "{{amount}}",
    "{{currency}}",
    "{{paid_at}}",
    "{{expires_at}}",
    "{{checkout_url}}",
    "{{invoice_url}}",
    "{{receipt_url}}",
    "{{billing_url}}",
    "{{contact_url}}",
    "{{docs_url}}",
    "{{join_url}}",
    "{{request_id}}",
    "{{support_url}}",
    "{{support_email}}",
    "{{refund_amount}}",
    "{{refund_reason}}",
    "{{provider_name}}",
    "{{provider_ref}}",
    "{{receiver_profile_id}}"
  ];
}

function buildSurfaceTemplateRegistry(
  surface: PaymentSurfaceRegistryEntry
): PaymentEmailTemplateRegistry | null {
  if (surface.paymentPack === "PACK_NONE" || !surface.senderPolicy) {
    return null;
  }

  const paySender = surface.senderPolicy.emailFromPay ?? `pay@${surface.domain}`;
  const billingSender = surface.senderPolicy.emailFromBilling ?? `billing@${surface.domain}`;
  const replyTo =
    surface.senderPolicy.emailReplyToSupport ??
    surface.senderPolicy.supportEmail ??
    `support@${surface.domain}`;
  const supportEmail = surface.senderPolicy.supportEmail ?? replyTo;

  const meta: TemplateMeta = {
    billingSender,
    brandName: surface.brandName,
    domain: surface.domain,
    paySender,
    replyTo,
    supportEmail,
    surface
  };

  const registry =
    surface.paymentPack === "PACK_A"
      ? buildPackARegistry(meta)
      : surface.paymentPack === "PACK_B"
        ? buildPackBRegistry(meta)
        : surface.paymentPack === "PACK_C"
          ? buildPackCRegistry(meta)
          : buildPackDRegistry(meta);

  return {
    allowedLocales: [...surface.allowedLocales],
    commonVariables: createCoreCommonVariables(),
    customerFacingPaymentEmailAllowed: surface.customerFacingPaymentEmailAllowed,
    defaultLocale: surface.defaultLocale,
    domain: surface.domain,
    footer: createFooter(meta.brandName, meta.domain, meta.supportEmail),
    paymentPack: surface.paymentPack,
    policy: {
      billingFailedRefundSender: billingSender,
      noreplyAllowedForPaymentMail: surface.senderPolicy.noreplyAllowedForPaymentMail,
      paymentReceiptSender: paySender,
      replyTo
    },
    recommendedMapping: registry.recommendedMapping,
    status: "LOCKED_READY_FOR_RUNTIME_BINDING",
    surfaceClass: surface.surfaceClass,
    surfaceRole: surface.surfaceRole,
    templateCount: Object.keys(registry.templates).length,
    templateScope: "PACK_FULL_SET",
    templates: registry.templates,
    toneMode: surface.toneMode,
    version: "2026-04-22"
  };
}

function buildPackARegistry(meta: TemplateMeta): PackRegistryBuildResult {
  const templates: Partial<Record<PaymentEmailTemplateId, PaymentEmailTemplateDefinition>> = {
    checkout_pending: createTemplate(
      "checkout_pending",
      meta.billingSender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Payment pending confirmation`,
        vi: `${meta.brandName} | Thanh toán đang chờ xác nhận`
      },
      {
        en: "We recorded your checkout and are waiting for provider confirmation.",
        vi: "Chúng tôi đã ghi nhận checkout của bạn và đang chờ xác nhận từ cổng thanh toán."
      },
      `Xin chào {{customer_name}},

${meta.brandName} đã ghi nhận checkout của bạn, nhưng giao dịch hiện vẫn đang ở trạng thái chờ xác nhận.

Thông tin checkout
- Mã đơn hàng: {{order_id}}
- Gói / sản phẩm: {{product_name}}
- Số tiền: {{amount}} {{currency}}
- Cổng thanh toán: {{provider_name}}

Bạn có thể tiếp tục hoặc kiểm tra trạng thái tại đây:
{{checkout_url}}

Nếu trạng thái chưa thay đổi sau thời gian hợp lý, vui lòng liên hệ:
{{support_email}}

Trân trọng,
${meta.brandName}

---

Hello {{customer_name}},

${meta.brandName} recorded your checkout, but the transaction is still pending confirmation.

Checkout details
- Order ID: {{order_id}}
- Package / product: {{product_name}}
- Amount: {{amount}} {{currency}}
- Provider: {{provider_name}}

You can continue or review the status here:
{{checkout_url}}

If the state does not change after a reasonable window, contact:
{{support_email}}

Best regards,
${meta.brandName}`,
      "checkout đã tạo nhưng provider chưa xác nhận"
    ),
    manual_payment_instruction: createTemplate(
      "manual_payment_instruction",
      meta.paySender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Manual payment instructions`,
        vi: `${meta.brandName} | Hướng dẫn thanh toán thủ công`
      },
      {
        en: "Use the official payment route and keep this email for support.",
        vi: "Vui lòng dùng đúng tuyến thanh toán được cấp và giữ email này để hỗ trợ khi cần."
      },
      `Xin chào {{customer_name}},

${meta.brandName} đã mở phiên thanh toán thủ công cho đơn của bạn.

Thông tin cần dùng
- Mã đơn hàng: {{order_id}}
- Gói / sản phẩm: {{product_name}}
- Số tiền: {{amount}} {{currency}}
- Mã phiên thanh toán: {{payment_intent_id}}

Vui lòng dùng đúng liên kết hoặc hướng dẫn thanh toán:
{{checkout_url}}

Nếu bạn đã chuyển khoản hoặc đã hoàn tất thao tác với nhà cung cấp, hãy giữ lại biên nhận và liên hệ khi cần:
{{support_email}}

Trân trọng,
${meta.brandName}

---

Hello {{customer_name}},

${meta.brandName} opened a manual payment session for your order.

Use these details
- Order ID: {{order_id}}
- Package / product: {{product_name}}
- Amount: {{amount}} {{currency}}
- Payment intent ID: {{payment_intent_id}}

Please use only the official payment route or instructions:
{{checkout_url}}

If you already transferred funds or completed the provider step, keep your proof and contact:
{{support_email}}

Best regards,
${meta.brandName}`,
      "phiên thanh toán thủ công hoặc QR / chuyển khoản đã được tạo"
    ),
    payment_receipt: createTemplate(
      "payment_receipt",
      meta.paySender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Payment receipt #{{order_id}}`,
        vi: `${meta.brandName} | Biên nhận thanh toán #{{order_id}}`
      },
      {
        en: "Your payment has been confirmed successfully.",
        vi: "Thanh toán của bạn đã được xác nhận thành công."
      },
      `Xin chào {{customer_name}},

${meta.brandName} đã xác nhận thành công khoản thanh toán của bạn.

Thông tin thanh toán
- Mã đơn hàng: {{order_id}}
- Gói / sản phẩm: {{product_name}}
- Số tiền: {{amount}} {{currency}}
- Thời gian xác nhận: {{paid_at}}
- Mã tham chiếu provider: {{provider_ref}}

Nếu có biên nhận hoặc trang chi tiết, bạn có thể xem tại:
{{receipt_url}}

Nếu bạn không thực hiện giao dịch này, vui lòng liên hệ ngay:
{{support_email}}

Trân trọng,
${meta.brandName}

---

Hello {{customer_name}},

${meta.brandName} successfully confirmed your payment.

Payment details
- Order ID: {{order_id}}
- Package / product: {{product_name}}
- Amount: {{amount}} {{currency}}
- Confirmed at: {{paid_at}}
- Provider reference: {{provider_ref}}

If a receipt or detail page is available, review it here:
{{receipt_url}}

If you did not make this transaction, contact us immediately:
{{support_email}}

Best regards,
${meta.brandName}`,
      "thanh toán thành công và đã được xác nhận"
    ),
    payment_failed: createTemplate(
      "payment_failed",
      meta.billingSender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Payment failed for order #{{order_id}}`,
        vi: `${meta.brandName} | Thanh toán thất bại cho đơn #{{order_id}}`
      },
      {
        en: "The payment was not completed. Review the session or try again safely.",
        vi: "Thanh toán chưa hoàn tất. Hãy xem lại phiên giao dịch hoặc thử lại an toàn."
      },
      `Xin chào {{customer_name}},

${meta.brandName} chưa thể hoàn tất giao dịch của bạn.

Thông tin giao dịch
- Mã đơn hàng: {{order_id}}
- Gói / sản phẩm: {{product_name}}
- Số tiền: {{amount}} {{currency}}
- Cổng thanh toán: {{provider_name}}

Bạn có thể mở lại phiên hoặc thử lại tại đây:
{{checkout_url}}

Nếu bạn tin rằng đã bị trừ tiền nhưng hệ thống vẫn báo thất bại, hãy liên hệ ngay:
{{support_email}}

Trân trọng,
${meta.brandName}

---

Hello {{customer_name}},

${meta.brandName} could not complete your transaction.

Transaction details
- Order ID: {{order_id}}
- Package / product: {{product_name}}
- Amount: {{amount}} {{currency}}
- Provider: {{provider_name}}

You can reopen the session or retry safely here:
{{checkout_url}}

If you believe funds were captured but the system still shows failure, contact:
{{support_email}}

Best regards,
${meta.brandName}`,
      "provider trả fail hoặc checkout bị từ chối"
    ),
    payment_expired: createTemplate(
      "payment_expired",
      meta.billingSender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Payment session expired`,
        vi: `${meta.brandName} | Phiên thanh toán đã hết hạn`
      },
      {
        en: "The checkout session expired before confirmation completed.",
        vi: "Phiên thanh toán đã hết hạn trước khi hoàn tất xác nhận."
      },
      `Xin chào {{customer_name}},

Phiên thanh toán của bạn trên ${meta.brandName} đã hết hạn.

Thông tin phiên
- Mã đơn hàng: {{order_id}}
- Phiên thanh toán: {{payment_intent_id}}
- Hết hạn lúc: {{expires_at}}

Nếu bạn vẫn muốn tiếp tục, vui lòng mở lại checkout:
{{checkout_url}}

Khi cần hỗ trợ, vui lòng liên hệ:
{{support_email}}

Trân trọng,
${meta.brandName}

---

Hello {{customer_name}},

Your payment session on ${meta.brandName} expired before confirmation completed.

Session details
- Order ID: {{order_id}}
- Payment intent: {{payment_intent_id}}
- Expired at: {{expires_at}}

If you still want to continue, reopen checkout here:
{{checkout_url}}

For help, contact:
{{support_email}}

Best regards,
${meta.brandName}`,
      "phiên checkout hết hạn"
    ),
    refund_notice: createTemplate(
      "refund_notice",
      meta.billingSender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Refund update for order #{{order_id}}`,
        vi: `${meta.brandName} | Cập nhật hoàn tiền cho đơn #{{order_id}}`
      },
      {
        en: "We processed a refund update for your transaction.",
        vi: "Chúng tôi đã xử lý cập nhật hoàn tiền cho giao dịch của bạn."
      },
      `Xin chào {{customer_name}},

${meta.brandName} đã ghi nhận và xử lý một cập nhật hoàn tiền.

Thông tin hoàn tiền
- Mã đơn hàng: {{order_id}}
- Gói / sản phẩm: {{product_name}}
- Số tiền hoàn: {{refund_amount}} {{currency}}
- Lý do: {{refund_reason}}

Nếu bạn cần đối chiếu thêm, vui lòng liên hệ:
{{support_email}}

Trân trọng,
${meta.brandName}

---

Hello {{customer_name}},

${meta.brandName} processed a refund update for your transaction.

Refund details
- Order ID: {{order_id}}
- Package / product: {{product_name}}
- Refunded amount: {{refund_amount}} {{currency}}
- Reason: {{refund_reason}}

If you need further reconciliation, contact:
{{support_email}}

Best regards,
${meta.brandName}`,
      "refund thành công hoặc cập nhật hoàn tiền"
    ),
    adjustment_notice: createTemplate(
      "adjustment_notice",
      meta.billingSender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Payment adjustment update`,
        vi: `${meta.brandName} | Cập nhật điều chỉnh thanh toán`
      },
      {
        en: "A payment adjustment was applied to your order.",
        vi: "Một điều chỉnh thanh toán đã được áp dụng cho đơn hàng của bạn."
      },
      `Xin chào {{customer_name}},

${meta.brandName} đã áp dụng một điều chỉnh liên quan đến đơn hàng của bạn.

Thông tin điều chỉnh
- Mã đơn hàng: {{order_id}}
- Gói / sản phẩm: {{product_name}}
- Mức điều chỉnh: {{refund_amount}} {{currency}}
- Lý do: {{refund_reason}}

Nếu bạn cần giải thích thêm, vui lòng liên hệ:
{{support_email}}

Trân trọng,
${meta.brandName}

---

Hello {{customer_name}},

${meta.brandName} applied an adjustment related to your order.

Adjustment details
- Order ID: {{order_id}}
- Package / product: {{product_name}}
- Adjustment amount: {{refund_amount}} {{currency}}
- Reason: {{refund_reason}}

If you need more context, contact:
{{support_email}}

Best regards,
${meta.brandName}`,
      "điều chỉnh số tiền hoặc trạng thái thanh toán"
    ),
    invoice_available: createTemplate(
      "invoice_available",
      meta.billingSender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Invoice available for order #{{order_id}}`,
        vi: `${meta.brandName} | Hóa đơn đã sẵn sàng cho đơn #{{order_id}}`
      },
      {
        en: "Your invoice or billing detail is now available.",
        vi: "Hóa đơn hoặc chi tiết tính phí của bạn đã sẵn sàng."
      },
      `Xin chào {{customer_name}},

${meta.brandName} đã sẵn sàng hóa đơn hoặc chi tiết tính phí cho giao dịch của bạn.

Thông tin liên quan
- Mã đơn hàng: {{order_id}}
- Hóa đơn: {{invoice_id}}

Bạn có thể xem tại:
{{invoice_url}}

Nếu có câu hỏi, vui lòng liên hệ:
{{support_email}}

Trân trọng,
${meta.brandName}

---

Hello {{customer_name}},

${meta.brandName} made your invoice or billing detail available.

Relevant details
- Order ID: {{order_id}}
- Invoice ID: {{invoice_id}}

You can review it here:
{{invoice_url}}

If you have questions, contact:
{{support_email}}

Best regards,
${meta.brandName}`,
      "hóa đơn hoặc chi tiết billing đã sẵn sàng"
    )
  };

  const recommendedMapping: PaymentEmailTemplateRegistry["recommendedMapping"] = [
      { flow: "checkout_pending", sender: meta.billingSender, templateId: "checkout_pending" },
      {
        flow: "manual_payment_instruction",
        sender: meta.paySender,
        templateId: "manual_payment_instruction"
      },
      { flow: "payment_receipt", sender: meta.paySender, templateId: "payment_receipt" },
      { flow: "payment_failed", sender: meta.billingSender, templateId: "payment_failed" },
      { flow: "payment_expired", sender: meta.billingSender, templateId: "payment_expired" },
      { flow: "refund_notice", sender: meta.billingSender, templateId: "refund_notice" },
      { flow: "adjustment_notice", sender: meta.billingSender, templateId: "adjustment_notice" },
      { flow: "invoice_available", sender: meta.billingSender, templateId: "invoice_available" }
    ];

  return {
    recommendedMapping,
    templates
  };
}

function buildPackBRegistry(meta: TemplateMeta): PackRegistryBuildResult {
  const templates: Partial<Record<PaymentEmailTemplateId, PaymentEmailTemplateDefinition>> = {
    invoice_issued: createTemplate(
      "invoice_issued",
      meta.billingSender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Invoice issued`,
        vi: `${meta.brandName} | Hóa đơn đã phát hành`
      },
      {
        en: "A billing invoice is now available for your workspace.",
        vi: "Một hóa đơn tính phí đã sẵn sàng cho workspace của bạn."
      },
      `Xin chào {{customer_name}},

${meta.brandName} đã phát hành hóa đơn mới cho workspace của bạn.

Thông tin hóa đơn
- Invoice ID: {{invoice_id}}
- Workspace: {{workspace_name}}
- Số tiền: {{amount}} {{currency}}

Xem hóa đơn tại:
{{invoice_url}}

Nếu cần hỗ trợ, vui lòng liên hệ:
{{support_email}}

Trân trọng,
${meta.brandName}

---

Hello {{customer_name}},

${meta.brandName} issued a new invoice for your workspace.

Invoice details
- Invoice ID: {{invoice_id}}
- Workspace: {{workspace_name}}
- Amount: {{amount}} {{currency}}

Review the invoice here:
{{invoice_url}}

If you need help, contact:
{{support_email}}

Best regards,
${meta.brandName}`,
      "billing invoice được tạo"
    ),
    invoice_paid: createTemplate(
      "invoice_paid",
      meta.paySender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Invoice paid`,
        vi: `${meta.brandName} | Hóa đơn đã thanh toán`
      },
      {
        en: "We confirmed payment for your billing invoice.",
        vi: "Chúng tôi đã xác nhận thanh toán cho hóa đơn của bạn."
      },
      `Xin chào {{customer_name}},

${meta.brandName} đã xác nhận thanh toán cho hóa đơn của bạn.

Thông tin
- Invoice ID: {{invoice_id}}
- Workspace: {{workspace_name}}
- Số tiền: {{amount}} {{currency}}
- Thời gian xác nhận: {{paid_at}}

Biên nhận / hóa đơn:
{{invoice_url}}

Nếu bạn cần hỗ trợ thêm:
{{support_email}}

Trân trọng,
${meta.brandName}

---

Hello {{customer_name}},

${meta.brandName} confirmed payment for your invoice.

Details
- Invoice ID: {{invoice_id}}
- Workspace: {{workspace_name}}
- Amount: {{amount}} {{currency}}
- Confirmed at: {{paid_at}}

Receipt / invoice:
{{invoice_url}}

If you need help:
{{support_email}}

Best regards,
${meta.brandName}`,
      "hóa đơn billing đã được thanh toán"
    ),
    billing_failed: createTemplate(
      "billing_failed",
      meta.billingSender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Billing attempt failed`,
        vi: `${meta.brandName} | Lần thu phí không thành công`
      },
      {
        en: "The billing attempt did not complete successfully.",
        vi: "Lần thu phí vừa rồi chưa hoàn tất thành công."
      },
      `Xin chào {{customer_name}},

${meta.brandName} chưa thể hoàn tất lần thu phí gần nhất.

Thông tin
- Invoice ID: {{invoice_id}}
- Workspace: {{workspace_name}}
- Số tiền: {{amount}} {{currency}}

Vui lòng kiểm tra thông tin billing hoặc liên hệ:
{{support_email}}

Chi tiết:
{{billing_url}}

Trân trọng,
${meta.brandName}

---

Hello {{customer_name}},

${meta.brandName} could not complete the latest billing attempt.

Details
- Invoice ID: {{invoice_id}}
- Workspace: {{workspace_name}}
- Amount: {{amount}} {{currency}}

Please review your billing details or contact:
{{support_email}}

Details:
{{billing_url}}

Best regards,
${meta.brandName}`,
      "lần thu phí / invoice collection không thành công"
    ),
    payment_method_update_required: createTemplate(
      "payment_method_update_required",
      meta.billingSender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Payment method update required`,
        vi: `${meta.brandName} | Cần cập nhật phương thức thanh toán`
      },
      {
        en: "Your billing profile needs an updated payment method.",
        vi: "Hồ sơ thanh toán của bạn cần được cập nhật phương thức chi trả."
      },
      `Xin chào {{customer_name}},

${meta.brandName} cần bạn cập nhật phương thức thanh toán hoặc hồ sơ billing để tránh gián đoạn.

Bạn có thể cập nhật tại:
{{billing_url}}

Nếu cần hỗ trợ, vui lòng liên hệ:
{{support_email}}

Trân trọng,
${meta.brandName}

---

Hello {{customer_name}},

${meta.brandName} needs you to update your payment method or billing profile to avoid interruption.

Update it here:
{{billing_url}}

For help, contact:
{{support_email}}

Best regards,
${meta.brandName}`,
      "cần cập nhật payment method hoặc hồ sơ billing"
    ),
    usage_threshold_notice: createTemplate(
      "usage_threshold_notice",
      meta.billingSender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Usage threshold notice`,
        vi: `${meta.brandName} | Thông báo ngưỡng sử dụng`
      },
      {
        en: "Your workspace is nearing a billing or usage threshold.",
        vi: "Workspace của bạn đang tiến gần một ngưỡng billing hoặc sử dụng."
      },
      `Xin chào {{customer_name}},

${meta.brandName} ghi nhận workspace của bạn đang tiến gần ngưỡng sử dụng hoặc billing đã cấu hình.

Workspace: {{workspace_name}}

Bạn có thể xem thêm tại:
{{billing_url}}

Nếu cần hỗ trợ, vui lòng liên hệ:
{{support_email}}

Trân trọng,
${meta.brandName}

---

Hello {{customer_name}},

${meta.brandName} recorded that your workspace is nearing a configured usage or billing threshold.

Workspace: {{workspace_name}}

Review more here:
{{billing_url}}

If you need support, contact:
{{support_email}}

Best regards,
${meta.brandName}`,
      "ngưỡng sử dụng hoặc billing threshold được chạm tới"
    ),
    refund_notice: createTemplate(
      "refund_notice",
      meta.billingSender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Billing refund update`,
        vi: `${meta.brandName} | Cập nhật hoàn tiền billing`
      },
      {
        en: "A billing refund or credit update has been processed.",
        vi: "Một cập nhật hoàn tiền hoặc credit billing đã được xử lý."
      },
      `Xin chào {{customer_name}},

${meta.brandName} đã xử lý một cập nhật hoàn tiền hoặc credit cho billing của bạn.

Thông tin
- Invoice ID: {{invoice_id}}
- Số tiền hoàn / credit: {{refund_amount}} {{currency}}
- Lý do: {{refund_reason}}

Nếu cần hỗ trợ:
{{support_email}}

Trân trọng,
${meta.brandName}

---

Hello {{customer_name}},

${meta.brandName} processed a refund or credit update for your billing.

Details
- Invoice ID: {{invoice_id}}
- Refunded / credited amount: {{refund_amount}} {{currency}}
- Reason: {{refund_reason}}

If you need support:
{{support_email}}

Best regards,
${meta.brandName}`,
      "refund hoặc credit billing"
    ),
    adjustment_notice: createTemplate(
      "adjustment_notice",
      meta.billingSender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Billing adjustment notice`,
        vi: `${meta.brandName} | Thông báo điều chỉnh billing`
      },
      {
        en: "A billing adjustment has been applied to your account.",
        vi: "Một điều chỉnh billing đã được áp dụng cho tài khoản của bạn."
      },
      `Xin chào {{customer_name}},

${meta.brandName} đã áp dụng một điều chỉnh trên billing của bạn.

Thông tin
- Invoice ID: {{invoice_id}}
- Workspace: {{workspace_name}}
- Giá trị điều chỉnh: {{refund_amount}} {{currency}}
- Lý do: {{refund_reason}}

Chi tiết:
{{billing_url}}

Nếu cần hỗ trợ:
{{support_email}}

Trân trọng,
${meta.brandName}

---

Hello {{customer_name}},

${meta.brandName} applied an adjustment to your billing.

Details
- Invoice ID: {{invoice_id}}
- Workspace: {{workspace_name}}
- Adjustment amount: {{refund_amount}} {{currency}}
- Reason: {{refund_reason}}

Details:
{{billing_url}}

If you need support:
{{support_email}}

Best regards,
${meta.brandName}`,
      "điều chỉnh billing"
    )
  };

  const recommendedMapping: PaymentEmailTemplateRegistry["recommendedMapping"] = [
      { flow: "invoice_issued", sender: meta.billingSender, templateId: "invoice_issued" },
      { flow: "invoice_paid", sender: meta.paySender, templateId: "invoice_paid" },
      { flow: "billing_failed", sender: meta.billingSender, templateId: "billing_failed" },
      {
        flow: "payment_method_update_required",
        sender: meta.billingSender,
        templateId: "payment_method_update_required"
      },
      {
        flow: "usage_threshold_notice",
        sender: meta.billingSender,
        templateId: "usage_threshold_notice"
      },
      { flow: "refund_notice", sender: meta.billingSender, templateId: "refund_notice" },
      { flow: "adjustment_notice", sender: meta.billingSender, templateId: "adjustment_notice" }
    ];

  return {
    recommendedMapping,
    templates
  };
}

function buildPackCRegistry(meta: TemplateMeta): PackRegistryBuildResult {
  const templates: Partial<Record<PaymentEmailTemplateId, PaymentEmailTemplateDefinition>> = {
    quote_ready: createTemplate(
      "quote_ready",
      meta.billingSender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Quote ready for review`,
        vi: `${meta.brandName} | Báo giá đã sẵn sàng để xem`
      },
      {
        en: "Your quote is ready for enterprise review.",
        vi: "Báo giá của bạn đã sẵn sàng cho bước rà soát doanh nghiệp."
      },
      `Xin chào {{customer_name}},

${meta.brandName} đã chuẩn bị báo giá cho yêu cầu của bạn.

Thông tin
- Gói / dịch vụ: {{package_name}}
- Giá trị dự kiến: {{amount}} {{currency}}

Nếu cần trao đổi thêm, vui lòng liên hệ:
{{support_email}}

Trân trọng,
${meta.brandName}

---

Hello {{customer_name}},

${meta.brandName} prepared a quote for your request.

Details
- Package / service: {{package_name}}
- Estimated amount: {{amount}} {{currency}}

If you need further discussion, contact:
{{support_email}}

Best regards,
${meta.brandName}`,
      "báo giá enterprise đã sẵn sàng"
    ),
    invoice_issued: createTemplate(
      "invoice_issued",
      meta.billingSender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Enterprise invoice issued`,
        vi: `${meta.brandName} | Hóa đơn doanh nghiệp đã phát hành`
      },
      {
        en: "An enterprise invoice has been issued.",
        vi: "Một hóa đơn doanh nghiệp đã được phát hành."
      },
      `Xin chào {{customer_name}},

${meta.brandName} đã phát hành hóa đơn doanh nghiệp cho giao dịch của bạn.

Thông tin
- Invoice ID: {{invoice_id}}
- Số tiền: {{amount}} {{currency}}

Xem hóa đơn tại:
{{invoice_url}}

Nếu cần hỗ trợ:
{{support_email}}

Trân trọng,
${meta.brandName}

---

Hello {{customer_name}},

${meta.brandName} issued an enterprise invoice for your transaction.

Details
- Invoice ID: {{invoice_id}}
- Amount: {{amount}} {{currency}}

View the invoice here:
{{invoice_url}}

If you need support:
{{support_email}}

Best regards,
${meta.brandName}`,
      "enterprise invoice được phát hành"
    ),
    payment_received: createTemplate(
      "payment_received",
      meta.paySender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Payment received`,
        vi: `${meta.brandName} | Đã nhận thanh toán`
      },
      {
        en: "We received payment for your enterprise transaction.",
        vi: "Chúng tôi đã nhận thanh toán cho giao dịch doanh nghiệp của bạn."
      },
      `Xin chào {{customer_name}},

${meta.brandName} đã nhận và ghi nhận thanh toán cho giao dịch của bạn.

Thông tin
- Invoice ID: {{invoice_id}}
- Số tiền: {{amount}} {{currency}}
- Thời gian xác nhận: {{paid_at}}

Nếu cần hỗ trợ:
{{support_email}}

Trân trọng,
${meta.brandName}

---

Hello {{customer_name}},

${meta.brandName} received and recorded payment for your transaction.

Details
- Invoice ID: {{invoice_id}}
- Amount: {{amount}} {{currency}}
- Confirmed at: {{paid_at}}

If you need support:
{{support_email}}

Best regards,
${meta.brandName}`,
      "thanh toán enterprise đã được nhận"
    ),
    manual_review_notice: createTemplate(
      "manual_review_notice",
      meta.billingSender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Payment is under manual review`,
        vi: `${meta.brandName} | Thanh toán đang được rà soát thủ công`
      },
      {
        en: "The transaction requires manual review before completion.",
        vi: "Giao dịch cần được rà soát thủ công trước khi hoàn tất."
      },
      `Xin chào {{customer_name}},

${meta.brandName} đang giữ giao dịch của bạn ở bước rà soát thủ công để xác minh thêm.

Mã giao dịch: {{payment_intent_id}}

Nếu cần bổ sung thông tin, chúng tôi sẽ liên hệ từ đúng hộp thư này. Bạn cũng có thể liên hệ:
{{support_email}}

Trân trọng,
${meta.brandName}

---

Hello {{customer_name}},

${meta.brandName} placed your transaction into manual review for additional verification.

Transaction ID: {{payment_intent_id}}

If more information is required, we will contact you from this mailbox. You may also contact:
{{support_email}}

Best regards,
${meta.brandName}`,
      "manual review được kích hoạt"
    ),
    credit_note_or_adjustment: createTemplate(
      "credit_note_or_adjustment",
      meta.billingSender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Credit note or adjustment update`,
        vi: `${meta.brandName} | Cập nhật credit note hoặc điều chỉnh`
      },
      {
        en: "A credit note or adjustment has been recorded.",
        vi: "Một credit note hoặc điều chỉnh đã được ghi nhận."
      },
      `Xin chào {{customer_name}},

${meta.brandName} đã ghi nhận một credit note hoặc điều chỉnh cho giao dịch của bạn.

Thông tin
- Invoice ID: {{invoice_id}}
- Giá trị: {{refund_amount}} {{currency}}
- Lý do: {{refund_reason}}

Nếu cần hỗ trợ:
{{support_email}}

Trân trọng,
${meta.brandName}

---

Hello {{customer_name}},

${meta.brandName} recorded a credit note or adjustment for your transaction.

Details
- Invoice ID: {{invoice_id}}
- Amount: {{refund_amount}} {{currency}}
- Reason: {{refund_reason}}

If you need support:
{{support_email}}

Best regards,
${meta.brandName}`,
      "credit note hoặc điều chỉnh enterprise"
    ),
    refund_notice: createTemplate(
      "refund_notice",
      meta.billingSender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Refund update`,
        vi: `${meta.brandName} | Cập nhật hoàn tiền`
      },
      {
        en: "A refund update has been processed for your enterprise transaction.",
        vi: "Một cập nhật hoàn tiền đã được xử lý cho giao dịch doanh nghiệp của bạn."
      },
      `Xin chào {{customer_name}},

${meta.brandName} đã xử lý cập nhật hoàn tiền cho giao dịch của bạn.

Thông tin
- Invoice ID: {{invoice_id}}
- Số tiền hoàn: {{refund_amount}} {{currency}}
- Lý do: {{refund_reason}}

Nếu cần hỗ trợ:
{{support_email}}

Trân trọng,
${meta.brandName}

---

Hello {{customer_name}},

${meta.brandName} processed a refund update for your transaction.

Details
- Invoice ID: {{invoice_id}}
- Refunded amount: {{refund_amount}} {{currency}}
- Reason: {{refund_reason}}

If you need support:
{{support_email}}

Best regards,
${meta.brandName}`,
      "refund enterprise"
    )
  };

  const recommendedMapping: PaymentEmailTemplateRegistry["recommendedMapping"] = [
      { flow: "quote_ready", sender: meta.billingSender, templateId: "quote_ready" },
      { flow: "invoice_issued", sender: meta.billingSender, templateId: "invoice_issued" },
      { flow: "payment_received", sender: meta.paySender, templateId: "payment_received" },
      {
        flow: "manual_review_notice",
        sender: meta.billingSender,
        templateId: "manual_review_notice"
      },
      {
        flow: "credit_note_or_adjustment",
        sender: meta.billingSender,
        templateId: "credit_note_or_adjustment"
      },
      { flow: "refund_notice", sender: meta.billingSender, templateId: "refund_notice" }
    ];

  return {
    recommendedMapping,
    templates
  };
}

function buildPackDRegistry(meta: TemplateMeta): PackRegistryBuildResult {
  const templates: Partial<Record<PaymentEmailTemplateId, PaymentEmailTemplateDefinition>> = {
    provider_webhook_failed: createTemplate(
      "provider_webhook_failed",
      meta.billingSender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Provider webhook failed`,
        vi: `${meta.brandName} | Webhook provider thất bại`
      },
      {
        en: "Provider callback failed and needs operator review.",
        vi: "Callback từ provider thất bại và cần operator rà soát."
      },
      `Cảnh báo nội bộ

${meta.brandName} ghi nhận webhook từ provider thất bại.

- Provider: {{provider_name}}
- Provider ref: {{provider_ref}}
- Payment intent: {{payment_intent_id}}
- Receiver profile: {{receiver_profile_id}}

Mở tuyến điều tra và đối soát ngay nếu trạng thái tiếp tục lệch.

---

Internal alert

${meta.brandName} recorded a failed provider webhook.

- Provider: {{provider_name}}
- Provider ref: {{provider_ref}}
- Payment intent: {{payment_intent_id}}
- Receiver profile: {{receiver_profile_id}}

Open the reconciliation path immediately if the state remains divergent.`,
      "provider webhook callback thất bại"
    ),
    settlement_mismatch_alert: createTemplate(
      "settlement_mismatch_alert",
      meta.billingSender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Settlement mismatch alert`,
        vi: `${meta.brandName} | Cảnh báo lệch quyết toán`
      },
      {
        en: "Settlement state diverges from payment or ledger truth.",
        vi: "Trạng thái quyết toán đang lệch so với payment hoặc ledger truth."
      },
      `Cảnh báo nội bộ

${meta.brandName} phát hiện chênh lệch giữa settlement và payment truth.

- Payment intent: {{payment_intent_id}}
- Provider ref: {{provider_ref}}
- Số tiền: {{amount}} {{currency}}

Yêu cầu đối soát thủ công trước khi đưa ra kết luận với người dùng.

---

Internal alert

${meta.brandName} detected a mismatch between settlement and payment truth.

- Payment intent: {{payment_intent_id}}
- Provider ref: {{provider_ref}}
- Amount: {{amount}} {{currency}}

Manual reconciliation is required before concluding anything to the customer.`,
      "settlement mismatch hoặc lệch ledger"
    ),
    payment_email_delivery_failed: createTemplate(
      "payment_email_delivery_failed",
      meta.billingSender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Payment email delivery failed`,
        vi: `${meta.brandName} | Gửi email thanh toán thất bại`
      },
      {
        en: "The payment email path failed after orchestration accepted the event.",
        vi: "Tuyến email thanh toán thất bại sau khi orchestration đã nhận event."
      },
      `Cảnh báo nội bộ

Một email thanh toán đã không gửi thành công.

- Domain: {{surface_domain}}
- Payment intent: {{payment_intent_id}}
- Message / receipt: {{receipt_id}}
- Provider ref: {{provider_ref}}

Kiểm tra sender binding, suppression, route và inbox proof.

---

Internal alert

A payment email failed after orchestration accepted the event.

- Domain: {{surface_domain}}
- Payment intent: {{payment_intent_id}}
- Message / receipt: {{receipt_id}}
- Provider ref: {{provider_ref}}

Check sender binding, suppression, route, and inbox proof.`,
      "delivery path của payment email thất bại"
    ),
    refund_manual_review_required: createTemplate(
      "refund_manual_review_required",
      meta.billingSender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Refund requires manual review`,
        vi: `${meta.brandName} | Hoàn tiền cần rà soát thủ công`
      },
      {
        en: "Refund flow is blocked pending manual review.",
        vi: "Luồng hoàn tiền đang bị giữ để rà soát thủ công."
      },
      `Cảnh báo nội bộ

Refund đang chờ rà soát thủ công.

- Order / invoice: {{order_id}} / {{invoice_id}}
- Số tiền hoàn: {{refund_amount}} {{currency}}
- Lý do: {{refund_reason}}

Không gửi cam kết cuối cùng cho khách trước khi review xong.

---

Internal alert

Refund is waiting for manual review.

- Order / invoice: {{order_id}} / {{invoice_id}}
- Refund amount: {{refund_amount}} {{currency}}
- Reason: {{refund_reason}}

Do not send a final customer commitment until review is completed.`,
      "refund cần manual review"
    ),
    receiver_profile_missing: createTemplate(
      "receiver_profile_missing",
      meta.billingSender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Receiver profile missing`,
        vi: `${meta.brandName} | Thiếu receiver profile`
      },
      {
        en: "The payment domain packet is missing receiver assignment.",
        vi: "Domain packet thanh toán đang thiếu receiver assignment."
      },
      `Cảnh báo nội bộ

${meta.brandName} không thể tiếp tục vì thiếu receiver profile.

- Domain: {{surface_domain}}
- Receiver profile: {{receiver_profile_id}}

Khóa outbound cho đến khi packet domain được bổ sung đầy đủ.

---

Internal alert

${meta.brandName} cannot continue because the receiver profile is missing.

- Domain: {{surface_domain}}
- Receiver profile: {{receiver_profile_id}}

Keep outbound locked until the domain packet is completed.`,
      "thiếu receiver profile hoặc assignment"
    ),
    mailbox_sender_binding_missing: createTemplate(
      "mailbox_sender_binding_missing",
      meta.billingSender,
      meta.replyTo,
      {
        en: `${meta.brandName} | Sender binding missing`,
        vi: `${meta.brandName} | Thiếu sender binding`
      },
      {
        en: "The sender mailbox is not bound for this payment surface.",
        vi: "Hộp thư sender chưa được bind cho payment surface này."
      },
      `Cảnh báo nội bộ

Payment surface chưa có sender binding hợp lệ.

- Domain: {{surface_domain}}
- Sender dự kiến: ${meta.paySender}
- Reply-to: ${meta.replyTo}

Không được claim live cho đến khi sender binding và inbox proof đã đủ.

---

Internal alert

The payment surface does not yet have a valid sender binding.

- Domain: {{surface_domain}}
- Expected sender: ${meta.paySender}
- Reply-to: ${meta.replyTo}

Do not claim live until sender binding and inbox proof are complete.`,
      "thiếu sender binding hoặc mailbox binding"
    )
  };

  const recommendedMapping: PaymentEmailTemplateRegistry["recommendedMapping"] = [
      {
        flow: "provider_webhook_failed",
        sender: meta.billingSender,
        templateId: "provider_webhook_failed"
      },
      {
        flow: "settlement_mismatch_alert",
        sender: meta.billingSender,
        templateId: "settlement_mismatch_alert"
      },
      {
        flow: "payment_email_delivery_failed",
        sender: meta.billingSender,
        templateId: "payment_email_delivery_failed"
      },
      {
        flow: "refund_manual_review_required",
        sender: meta.billingSender,
        templateId: "refund_manual_review_required"
      },
      {
        flow: "receiver_profile_missing",
        sender: meta.billingSender,
        templateId: "receiver_profile_missing"
      },
      {
        flow: "mailbox_sender_binding_missing",
        sender: meta.billingSender,
        templateId: "mailbox_sender_binding_missing"
      }
    ];

  return {
    recommendedMapping,
    templates
  };
}

const tranhatamPaymentEmailTemplates: PaymentEmailTemplateRegistry = {
  allowedLocales: ["vi", "en"],
  commonVariables: createCoreCommonVariables(),
  customerFacingPaymentEmailAllowed: true,
  defaultLocale: "vi",
  domain: "tranhatam.com",
  footer: createFooter("Tranhatam.com", "tranhatam.com", "support@tranhatam.com"),
  paymentPack: "TRANHATAM_CUSTOM",
  policy: {
    billingFailedRefundSender: "billing@tranhatam.com",
    noreplyAllowedForPaymentMail: false,
    paymentReceiptSender: "pay@tranhatam.com",
    replyTo: "support@tranhatam.com"
  },
  recommendedMapping: [
    {
      flow: "payment_receipt",
      sender: "pay@tranhatam.com",
      templateId: "payment_receipt"
    },
    {
      flow: "checkout_status_update",
      sender: "billing@tranhatam.com",
      templateId: "checkout_status_update"
    },
    {
      flow: "payment_failed_notice",
      sender: "billing@tranhatam.com",
      templateId: "payment_failed_notice"
    },
    {
      flow: "refund_notice",
      sender: "billing@tranhatam.com",
      templateId: "refund_notice"
    },
    {
      flow: "checkout_pending",
      sender: "billing@tranhatam.com",
      templateId: "checkout_pending"
    },
    {
      flow: "manual_payment_instruction",
      sender: "pay@tranhatam.com",
      templateId: "manual_payment_instruction"
    },
    {
      flow: "payment_failed",
      sender: "billing@tranhatam.com",
      templateId: "payment_failed"
    },
    {
      flow: "payment_expired",
      sender: "billing@tranhatam.com",
      templateId: "payment_expired"
    },
    {
      flow: "adjustment_notice",
      sender: "billing@tranhatam.com",
      templateId: "adjustment_notice"
    },
    {
      flow: "invoice_available",
      sender: "billing@tranhatam.com",
      templateId: "invoice_available"
    },
    {
      flow: "contact_request_received",
      sender: "support@tranhatam.com",
      templateId: "contact_request_received"
    },
    {
      flow: "support_request_received",
      sender: "support@tranhatam.com",
      templateId: "support_request_received"
    },
    {
      flow: "join_request_received",
      sender: "support@tranhatam.com",
      templateId: "join_request_received"
    },
    {
      flow: "docs_access_guidance",
      sender: "support@tranhatam.com",
      templateId: "docs_access_guidance"
    }
  ],
  status: "LOCKED_READY_FOR_RUNTIME_BINDING",
  surfaceClass: "SITE_SPECIFIC",
  surfaceRole: "Founder site / primary one-time VND launch surface",
  templateCount: 14,
  templateScope: "TEAM_D_CORE_PAYMENT_SET",
  templates: {
    payment_receipt: createTemplate(
      "payment_receipt",
      "pay@tranhatam.com",
      "support@tranhatam.com",
      {
        en: "Tranhatam.com | Payment receipt #{{order_id}}",
        vi: "Tranhatam.com | Biên nhận thanh toán #{{order_id}}"
      },
      {
        en: "Your payment for {{product_name}} has been confirmed.",
        vi: "Chúng tôi đã xác nhận thanh toán của bạn cho {{product_name}}."
      },
      `Xin chào {{customer_name}},

Chúng tôi đã xác nhận thành công khoản thanh toán của bạn trên Tranhatam.com.

Thông tin thanh toán
- Mã đơn hàng: {{order_id}}
- Sản phẩm / dịch vụ: {{product_name}}
- Số tiền: {{amount}} {{currency}}
- Thời gian xác nhận: {{paid_at}}

Nếu hệ thống có kèm biên nhận hoặc chi tiết đơn hàng, bạn có thể xem tại đây:
{{invoice_url}}

Nếu bạn không thực hiện giao dịch này hoặc cần hỗ trợ thêm, vui lòng trả lời email này hoặc liên hệ:
{{support_email}}

Trân trọng,
Tranhatam.com

---

Hello {{customer_name}},

Your payment has been successfully confirmed on Tranhatam.com.

Payment details
- Order ID: {{order_id}}
- Product / service: {{product_name}}
- Amount: {{amount}} {{currency}}
- Confirmed at: {{paid_at}}

If an invoice or order summary is available, you can review it here:
{{invoice_url}}

If you did not make this payment or need support, please reply to this email or contact:
{{support_email}}

Best regards,
Tranhatam.com`,
      "thanh toán thành công và đã được xác nhận từ provider/webhook"
    ),
    checkout_status_update: createTemplate(
      "checkout_status_update",
      "billing@tranhatam.com",
      "support@tranhatam.com",
      {
        en: "Tranhatam.com | Your payment is pending confirmation",
        vi: "Tranhatam.com | Thanh toán của bạn đang chờ xác nhận"
      },
      {
        en: "We have recorded your checkout and are waiting for provider confirmation.",
        vi: "Chúng tôi đã ghi nhận checkout của bạn và đang chờ xác nhận từ cổng thanh toán."
      },
      `Xin chào {{customer_name}},

Chúng tôi đã ghi nhận yêu cầu thanh toán của bạn trên Tranhatam.com, nhưng giao dịch hiện vẫn đang ở trạng thái chờ xác nhận.

Thông tin checkout
- Mã đơn hàng: {{order_id}}
- Sản phẩm / dịch vụ: {{product_name}}
- Số tiền: {{amount}} {{currency}}

Bạn có thể tiếp tục hoặc kiểm tra lại trạng thái thanh toán tại đây:
{{checkout_url}}

Nếu bạn đã thanh toán nhưng chưa thấy cập nhật, vui lòng đợi thêm trong ít phút. Nếu trạng thái vẫn chưa thay đổi, hãy liên hệ:
{{support_email}}

Trân trọng,
Tranhatam.com

---

Hello {{customer_name}},

We have received your checkout request on Tranhatam.com, but the transaction is still pending confirmation.

Checkout details
- Order ID: {{order_id}}
- Product / service: {{product_name}}
- Amount: {{amount}} {{currency}}

You can continue or review your payment status here:
{{checkout_url}}

If you have already paid but do not see an update yet, please allow a few more minutes. If the status still does not change, contact:
{{support_email}}

Best regards,
Tranhatam.com`,
      "checkout đã tạo nhưng chưa hoàn tất, hoặc provider đang chờ xác nhận"
    ),
    payment_failed_notice: createTemplate(
      "payment_failed_notice",
      "billing@tranhatam.com",
      "support@tranhatam.com",
      {
        en: "Tranhatam.com | Payment was not completed for order #{{order_id}}",
        vi: "Tranhatam.com | Thanh toán chưa thành công cho đơn #{{order_id}}"
      },
      {
        en: "Your transaction was not completed. You can try again using the link below.",
        vi: "Giao dịch của bạn chưa hoàn tất. Bạn có thể thử lại bằng liên kết bên dưới."
      },
      `Xin chào {{customer_name}},

Rất tiếc, giao dịch của bạn trên Tranhatam.com chưa được hoàn tất.

Thông tin giao dịch
- Mã đơn hàng: {{order_id}}
- Sản phẩm / dịch vụ: {{product_name}}
- Số tiền: {{amount}} {{currency}}

Nguyên nhân có thể bao gồm:
- phiên thanh toán đã hết hạn
- giao dịch bị hủy
- xác nhận từ cổng thanh toán không thành công
- phương thức thanh toán không khả dụng tại thời điểm xử lý

Bạn có thể thử lại tại đây:
{{checkout_url}}

Nếu bạn tin rằng đã bị trừ tiền nhưng hệ thống vẫn báo thất bại, vui lòng liên hệ ngay:
{{support_email}}

Trân trọng,
Tranhatam.com

---

Hello {{customer_name}},

We’re sorry, but your transaction on Tranhatam.com was not completed.

Transaction details
- Order ID: {{order_id}}
- Product / service: {{product_name}}
- Amount: {{amount}} {{currency}}

Possible reasons include:
- the payment session expired
- the transaction was cancelled
- confirmation from the payment provider failed
- the payment method was unavailable at processing time

You can try again here:
{{checkout_url}}

If you believe you were charged but the system still shows a failed status, please contact us immediately:
{{support_email}}

Best regards,
Tranhatam.com`,
      "provider trả fail, checkout hết hạn, hoặc thanh toán bị từ chối"
    ),
    refund_notice: createTemplate(
      "refund_notice",
      "billing@tranhatam.com",
      "support@tranhatam.com",
      {
        en: "Tranhatam.com | Refund / adjustment update for order #{{order_id}}",
        vi: "Tranhatam.com | Cập nhật hoàn tiền / điều chỉnh cho đơn #{{order_id}}"
      },
      {
        en: "We have processed a refund or adjustment update for your transaction.",
        vi: "Chúng tôi đã xử lý cập nhật hoàn tiền hoặc điều chỉnh cho giao dịch của bạn."
      },
      `Xin chào {{customer_name}},

Chúng tôi đã xử lý một cập nhật liên quan đến giao dịch của bạn trên Tranhatam.com.

Thông tin cập nhật
- Mã đơn hàng: {{order_id}}
- Sản phẩm / dịch vụ: {{product_name}}
- Số tiền điều chỉnh / hoàn tiền: {{refund_amount}} {{currency}}
- Lý do: {{refund_reason}}

Lưu ý:
- thời gian tiền về tài khoản có thể phụ thuộc vào ngân hàng hoặc cổng thanh toán
- nếu đây là hoàn tiền một phần, phần còn lại của đơn hàng vẫn giữ nguyên hiệu lực nếu có thông báo khác

Nếu bạn cần xác nhận thêm về trạng thái hoàn tiền hoặc điều chỉnh này, vui lòng liên hệ:
{{support_email}}

Trân trọng,
Tranhatam.com

---

Hello {{customer_name}},

We have processed an update related to your transaction on Tranhatam.com.

Update details
- Order ID: {{order_id}}
- Product / service: {{product_name}}
- Refunded / adjusted amount: {{refund_amount}} {{currency}}
- Reason: {{refund_reason}}

Please note:
- the time for funds to appear in your account may depend on your bank or payment provider
- if this is a partial refund, the remaining part of the order stays valid unless otherwise stated

If you need further confirmation about this refund or adjustment, please contact:
{{support_email}}

Best regards,
Tranhatam.com`,
      "refund thành công, hoàn tiền một phần, hoặc điều chỉnh thanh toán"
    ),
    checkout_pending: createTemplate(
      "checkout_pending",
      "billing@tranhatam.com",
      "support@tranhatam.com",
      {
        en: "Tranhatam.com | Checkout is waiting for confirmation",
        vi: "Tranhatam.com | Checkout đang chờ xác nhận"
      },
      {
        en: "We recorded your checkout and are waiting for provider confirmation.",
        vi: "Chúng tôi đã ghi nhận checkout của bạn và đang chờ xác nhận từ cổng thanh toán."
      },
      `Xin chào {{customer_name}},

Checkout của bạn trên Tranhatam.com đang chờ xác nhận.

Thông tin
- Mã đơn hàng: {{order_id}}
- Sản phẩm / dịch vụ: {{product_name}}
- Số tiền: {{amount}} {{currency}}
- Cổng thanh toán: {{provider_name}}
- Hết hạn: {{expires_at}}

Kiểm tra hoặc tiếp tục checkout:
{{checkout_url}}

Tài liệu hướng dẫn:
{{docs_url}}

Hỗ trợ:
{{support_email}}

Trân trọng,
Tranhatam.com

---

Hello {{customer_name}},

Your checkout on Tranhatam.com is waiting for confirmation.

Details
- Order ID: {{order_id}}
- Product / service: {{product_name}}
- Amount: {{amount}} {{currency}}
- Provider: {{provider_name}}
- Expires at: {{expires_at}}

Review or continue checkout:
{{checkout_url}}

Documentation:
{{docs_url}}

Support:
{{support_email}}

Best regards,
Tranhatam.com`,
      "checkout Tranhatam.com đang chờ provider xác nhận"
    ),
    manual_payment_instruction: createTemplate(
      "manual_payment_instruction",
      "pay@tranhatam.com",
      "support@tranhatam.com",
      {
        en: "Tranhatam.com | Official payment instructions #{{order_id}}",
        vi: "Tranhatam.com | Hướng dẫn thanh toán chính thức #{{order_id}}"
      },
      {
        en: "Use only the official payment link or instruction in this email.",
        vi: "Vui lòng chỉ dùng liên kết hoặc hướng dẫn thanh toán chính thức trong email này."
      },
      `Xin chào {{customer_name}},

Tranhatam.com đã tạo hướng dẫn thanh toán chính thức cho yêu cầu của bạn.

Thông tin thanh toán
- Mã đơn hàng: {{order_id}}
- Sản phẩm / dịch vụ: {{product_name}}
- Số tiền: {{amount}} {{currency}}
- Mã phiên thanh toán: {{payment_intent_id}}

Đường dẫn thanh toán:
{{checkout_url}}

Tài liệu hướng dẫn:
{{docs_url}}

Nếu cần hỗ trợ, vui lòng trả lời email này:
{{support_email}}

Trân trọng,
Tranhatam.com

---

Hello {{customer_name}},

Tranhatam.com created the official payment instructions for your request.

Payment details
- Order ID: {{order_id}}
- Product / service: {{product_name}}
- Amount: {{amount}} {{currency}}
- Payment intent ID: {{payment_intent_id}}

Payment link:
{{checkout_url}}

Documentation:
{{docs_url}}

If you need support, reply to this email:
{{support_email}}

Best regards,
Tranhatam.com`,
      "hướng dẫn thanh toán chính thức được tạo"
    ),
    payment_failed: createTemplate(
      "payment_failed",
      "billing@tranhatam.com",
      "support@tranhatam.com",
      {
        en: "Tranhatam.com | Payment was not completed #{{order_id}}",
        vi: "Tranhatam.com | Thanh toán chưa hoàn tất #{{order_id}}"
      },
      {
        en: "Your payment was not completed. You can retry safely.",
        vi: "Thanh toán của bạn chưa hoàn tất. Bạn có thể thử lại an toàn."
      },
      `Xin chào {{customer_name}},

Thanh toán trên Tranhatam.com chưa hoàn tất.

Thông tin
- Mã đơn hàng: {{order_id}}
- Sản phẩm / dịch vụ: {{product_name}}
- Số tiền: {{amount}} {{currency}}
- Cổng thanh toán: {{provider_name}}
- Mã tham chiếu provider: {{provider_ref}}

Thử lại:
{{checkout_url}}

Nếu bạn đã bị trừ tiền, vui lòng gửi biên nhận cho:
{{support_email}}

Tài liệu hỗ trợ:
{{docs_url}}

Trân trọng,
Tranhatam.com

---

Hello {{customer_name}},

Your Tranhatam.com payment was not completed.

Details
- Order ID: {{order_id}}
- Product / service: {{product_name}}
- Amount: {{amount}} {{currency}}
- Provider: {{provider_name}}
- Provider reference: {{provider_ref}}

Retry:
{{checkout_url}}

If your account was charged, send proof to:
{{support_email}}

Support docs:
{{docs_url}}

Best regards,
Tranhatam.com`,
      "thanh toán thất bại hoặc provider từ chối"
    ),
    payment_expired: createTemplate(
      "payment_expired",
      "billing@tranhatam.com",
      "support@tranhatam.com",
      {
        en: "Tranhatam.com | Payment link expired #{{order_id}}",
        vi: "Tranhatam.com | Link thanh toán đã hết hạn #{{order_id}}"
      },
      {
        en: "The payment link expired. Create a new checkout if you still want to continue.",
        vi: "Link thanh toán đã hết hạn. Bạn có thể tạo checkout mới nếu vẫn muốn tiếp tục."
      },
      `Xin chào {{customer_name}},

Link thanh toán cho đơn này đã hết hạn.

Thông tin
- Mã đơn hàng: {{order_id}}
- Sản phẩm / dịch vụ: {{product_name}}
- Hết hạn lúc: {{expires_at}}

Tạo lại checkout:
{{checkout_url}}

Tài liệu:
{{docs_url}}

Hỗ trợ:
{{support_email}}

Trân trọng,
Tranhatam.com

---

Hello {{customer_name}},

The payment link for this order has expired.

Details
- Order ID: {{order_id}}
- Product / service: {{product_name}}
- Expired at: {{expires_at}}

Reopen checkout:
{{checkout_url}}

Documentation:
{{docs_url}}

Support:
{{support_email}}

Best regards,
Tranhatam.com`,
      "link thanh toán hết hạn"
    ),
    adjustment_notice: createTemplate(
      "adjustment_notice",
      "billing@tranhatam.com",
      "support@tranhatam.com",
      {
        en: "Tranhatam.com | Payment adjustment update #{{order_id}}",
        vi: "Tranhatam.com | Cập nhật điều chỉnh thanh toán #{{order_id}}"
      },
      {
        en: "A payment adjustment was recorded for your order.",
        vi: "Một điều chỉnh thanh toán đã được ghi nhận cho đơn của bạn."
      },
      `Xin chào {{customer_name}},

Tranhatam.com đã ghi nhận một điều chỉnh thanh toán.

Thông tin
- Mã đơn hàng: {{order_id}}
- Sản phẩm / dịch vụ: {{product_name}}
- Số tiền điều chỉnh: {{refund_amount}} {{currency}}
- Lý do: {{refund_reason}}

Chi tiết:
{{billing_url}}

Tài liệu:
{{docs_url}}

Hỗ trợ:
{{support_email}}

Trân trọng,
Tranhatam.com

---

Hello {{customer_name}},

Tranhatam.com recorded a payment adjustment.

Details
- Order ID: {{order_id}}
- Product / service: {{product_name}}
- Adjusted amount: {{refund_amount}} {{currency}}
- Reason: {{refund_reason}}

Details:
{{billing_url}}

Documentation:
{{docs_url}}

Support:
{{support_email}}

Best regards,
Tranhatam.com`,
      "điều chỉnh thanh toán được ghi nhận"
    ),
    invoice_available: createTemplate(
      "invoice_available",
      "billing@tranhatam.com",
      "support@tranhatam.com",
      {
        en: "Tranhatam.com | Invoice is available #{{invoice_id}}",
        vi: "Tranhatam.com | Hóa đơn đã sẵn sàng #{{invoice_id}}"
      },
      {
        en: "Your invoice or payment record is ready to review.",
        vi: "Hóa đơn hoặc bản ghi thanh toán của bạn đã sẵn sàng để xem."
      },
      `Xin chào {{customer_name}},

Hóa đơn hoặc bản ghi thanh toán trên Tranhatam.com đã sẵn sàng.

Thông tin
- Mã hóa đơn: {{invoice_id}}
- Mã đơn hàng: {{order_id}}
- Sản phẩm / dịch vụ: {{product_name}}
- Số tiền: {{amount}} {{currency}}

Xem hóa đơn:
{{invoice_url}}

Tài liệu:
{{docs_url}}

Hỗ trợ:
{{support_email}}

Trân trọng,
Tranhatam.com

---

Hello {{customer_name}},

Your Tranhatam.com invoice or payment record is ready.

Details
- Invoice ID: {{invoice_id}}
- Order ID: {{order_id}}
- Product / service: {{product_name}}
- Amount: {{amount}} {{currency}}

View invoice:
{{invoice_url}}

Documentation:
{{docs_url}}

Support:
{{support_email}}

Best regards,
Tranhatam.com`,
      "hóa đơn hoặc bản ghi thanh toán đã sẵn sàng"
    ),
    contact_request_received: createTemplate(
      "contact_request_received",
      "support@tranhatam.com",
      "support@tranhatam.com",
      {
        en: "Tranhatam.com | We received your message",
        vi: "Tranhatam.com | Chúng tôi đã nhận được tin nhắn của bạn"
      },
      {
        en: "We received your message and will reply from the support mailbox.",
        vi: "Chúng tôi đã nhận được tin nhắn của bạn và sẽ phản hồi từ hộp thư hỗ trợ."
      },
      `Xin chào {{customer_name}},

Chúng tôi đã nhận được tin nhắn của bạn gửi tới Tranhatam.com.

Thông tin
- Mã yêu cầu: {{request_id}}
- Chủ đề / nhu cầu: {{product_name}}

Tài liệu liên quan:
{{docs_url}}

Nếu cần bổ sung thông tin, vui lòng trả lời trực tiếp email này.

Trân trọng,
Tranhatam.com

---

Hello {{customer_name}},

We received your message to Tranhatam.com.

Details
- Request ID: {{request_id}}
- Topic / need: {{product_name}}

Related documentation:
{{docs_url}}

If you need to add context, reply directly to this email.

Best regards,
Tranhatam.com`,
      "form liên hệ Tranhatam.com được gửi từ web"
    ),
    support_request_received: createTemplate(
      "support_request_received",
      "support@tranhatam.com",
      "support@tranhatam.com",
      {
        en: "Tranhatam.com | Support request received #{{request_id}}",
        vi: "Tranhatam.com | Đã nhận yêu cầu hỗ trợ #{{request_id}}"
      },
      {
        en: "We received your support request and opened a support thread.",
        vi: "Chúng tôi đã nhận yêu cầu hỗ trợ của bạn và mở một luồng hỗ trợ."
      },
      `Xin chào {{customer_name}},

Yêu cầu hỗ trợ của bạn đã được ghi nhận.

Thông tin
- Mã yêu cầu: {{request_id}}
- Chủ đề: {{product_name}}
- Workspace / bối cảnh: {{workspace_name}}

Tài liệu tự xử lý nhanh:
{{docs_url}}

Kênh hỗ trợ:
{{support_email}}

Trân trọng,
Tranhatam.com

---

Hello {{customer_name}},

Your support request has been recorded.

Details
- Request ID: {{request_id}}
- Topic: {{product_name}}
- Workspace / context: {{workspace_name}}

Self-service documentation:
{{docs_url}}

Support channel:
{{support_email}}

Best regards,
Tranhatam.com`,
      "yêu cầu hỗ trợ Tranhatam.com được tạo"
    ),
    join_request_received: createTemplate(
      "join_request_received",
      "support@tranhatam.com",
      "support@tranhatam.com",
      {
        en: "Tranhatam.com | Join request received",
        vi: "Tranhatam.com | Đã nhận yêu cầu tham gia"
      },
      {
        en: "We received your request and will guide the next step.",
        vi: "Chúng tôi đã nhận yêu cầu của bạn và sẽ hướng dẫn bước tiếp theo."
      },
      `Xin chào {{customer_name}},

Tranhatam.com đã nhận yêu cầu tham gia / đăng ký của bạn.

Thông tin
- Gói / nhu cầu: {{product_name}}
- Mã yêu cầu: {{request_id}}

Nếu yêu cầu cần thanh toán hoặc xác minh thêm, hệ thống sẽ gửi email tiếp theo từ pay@tranhatam.com hoặc billing@tranhatam.com.

Tài liệu bắt đầu:
{{docs_url}}

Hỗ trợ:
{{support_email}}

Trân trọng,
Tranhatam.com

---

Hello {{customer_name}},

Tranhatam.com received your join / registration request.

Details
- Package / need: {{product_name}}
- Request ID: {{request_id}}

If payment or additional verification is required, the system will send the next email from pay@tranhatam.com or billing@tranhatam.com.

Start here:
{{docs_url}}

Support:
{{support_email}}

Best regards,
Tranhatam.com`,
      "yêu cầu tham gia hoặc đăng ký được gửi từ web"
    ),
    docs_access_guidance: createTemplate(
      "docs_access_guidance",
      "support@tranhatam.com",
      "support@tranhatam.com",
      {
        en: "Tranhatam.com | Documentation and next steps",
        vi: "Tranhatam.com | Tài liệu hướng dẫn và bước tiếp theo"
      },
      {
        en: "Use this email to continue with documentation and support.",
        vi: "Dùng email này để tiếp tục với tài liệu và hỗ trợ."
      },
      `Xin chào {{customer_name}},

Đây là bộ hướng dẫn chính thức để bạn tiếp tục với Tranhatam.com.

Tài liệu:
{{docs_url}}

Trang hỗ trợ:
{{support_url}}

Nếu email này liên quan đến thanh toán, vui lòng giữ lại:
- Mã đơn hàng: {{order_id}}
- Mã phiên thanh toán: {{payment_intent_id}}
- Mã tham chiếu provider: {{provider_ref}}

Trân trọng,
Tranhatam.com

---

Hello {{customer_name}},

This is the official guidance packet for continuing with Tranhatam.com.

Documentation:
{{docs_url}}

Support page:
{{support_url}}

If this email relates to a payment, keep these references:
- Order ID: {{order_id}}
- Payment intent ID: {{payment_intent_id}}
- Provider reference: {{provider_ref}}

Best regards,
Tranhatam.com`,
      "gửi hướng dẫn docs hoặc next-step cho người dùng"
    )
  },
  toneMode: "WARM_HUMAN",
  version: "2026-04-22"
};

const generatedSurfaceTemplateCache = new Map<string, PaymentEmailTemplateRegistry | null>();

export function getPaymentEmailTemplateRegistry(
  domain: string
): PaymentEmailTemplateRegistry | null {
  const normalizedDomain = domain.trim().toLowerCase();

  if (normalizedDomain === "tranhatam.com") {
    return tranhatamPaymentEmailTemplates;
  }

  if (!generatedSurfaceTemplateCache.has(normalizedDomain)) {
    const teamDProfile = getTeamDPaymentEmailProfile(normalizedDomain);

    if (teamDProfile) {
      generatedSurfaceTemplateCache.set(
        normalizedDomain,
        buildTeamDSiteCoreRegistry(teamDProfile)
      );
    } else {
      const surface = getPaymentSurfaceRegistryEntry(normalizedDomain);
      generatedSurfaceTemplateCache.set(
        normalizedDomain,
        surface ? buildSurfaceTemplateRegistry(surface) : null
      );
    }
  }

  return generatedSurfaceTemplateCache.get(normalizedDomain) ?? null;
}
