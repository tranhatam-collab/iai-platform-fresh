#!/usr/bin/env node
/**
 * One-shot backfill of the pay surface i18n keys missing from
 * content/en.json + content/vi.json. The keys are referenced by
 * apps/pay/src/render.ts via t(locale, key); without entries the
 * server returns the literal key, which makes pay-surface tests
 * (and end-user pages) ship raw "pay.ops.area.payments_detail"
 * strings.
 *
 * This script is idempotent — re-running it leaves existing
 * (already-translated) keys untouched and only adds missing ones.
 *
 * Translation tone: terse, professional, evidence-first — matches
 * the existing pay.hero.*, pay.boundary.*, pay.phase.* entries.
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const enPath = path.join(root, "content", "en.json");
const viPath = path.join(root, "content", "vi.json");

/** key -> { en, vi } */
const ENTRIES = {
  // pay.block.*
  "pay.block.fallback_channels.title": {
    en: "Fallback channels",
    vi: "Kênh dự phòng"
  },
  "pay.block.meta.account_holder": { en: "Account holder", vi: "Chủ tài khoản" },
  "pay.block.meta.account_target": { en: "Account number", vi: "Số tài khoản" },
  "pay.block.meta.bank_provider": { en: "Bank / provider", vi: "Ngân hàng / nhà cung cấp" },
  "pay.block.meta.notification_emails": { en: "Notification emails", vi: "Email thông báo" },
  "pay.block.meta.render_instruction": {
    en: "Render instruction",
    vi: "Hướng dẫn hiển thị"
  },
  "pay.block.qr_alt": { en: "Bank transfer QR code", vi: "Mã QR chuyển khoản ngân hàng" },
  "pay.block.receiver_deferred.title": {
    en: "Receiver assignment deferred",
    vi: "Tạm hoãn gán đơn vị nhận"
  },
  "pay.block.receiver_unassigned.title": {
    en: "Receiver not assigned yet",
    vi: "Chưa gán đơn vị nhận"
  },
  "pay.block.routing_notes_title": { en: "Routing notes", vi: "Ghi chú định tuyến" },

  // pay.checkout.cancelled.*
  "pay.checkout.cancelled.eyebrow": { en: "Checkout cancelled", vi: "Thanh toán đã huỷ" },
  "pay.checkout.cancelled.lede": {
    en: "This checkout session was cancelled by the payer or by policy.",
    vi: "Phiên thanh toán này đã bị huỷ bởi người trả hoặc theo chính sách."
  },
  "pay.checkout.cancelled.note": {
    en: "No charge has been captured. Cancelled state is preserved as historical truth.",
    vi: "Không có khoản nào bị thu. Trạng thái đã huỷ được giữ làm sự thật lịch sử."
  },
  "pay.checkout.cancelled.page_title": { en: "Checkout cancelled", vi: "Đã huỷ thanh toán" },
  "pay.checkout.cancelled.payer_needs_title": {
    en: "If the payer still needs to pay",
    vi: "Nếu người trả vẫn cần thanh toán"
  },

  // pay.checkout.confirmed.*
  "pay.checkout.confirmed.boundary.historical_truth": {
    en: "Confirmed state is preserved as historical truth and cannot be silently overwritten.",
    vi: "Trạng thái đã xác nhận được giữ làm sự thật lịch sử, không thể ghi đè ngầm."
  },
  "pay.checkout.confirmed.eyebrow": { en: "Checkout confirmed", vi: "Thanh toán đã xác nhận" },
  "pay.checkout.confirmed.lede": {
    en: "This checkout session has been confirmed against ledger evidence.",
    vi: "Phiên thanh toán này đã được xác nhận dựa trên bằng chứng sổ cái."
  },
  "pay.checkout.confirmed.next_steps_title": { en: "Next steps", vi: "Bước tiếp theo" },
  "pay.checkout.confirmed.note": {
    en: "Receipt is available below. Settlement and reconciliation continue downstream.",
    vi: "Biên nhận có sẵn bên dưới. Thanh toán và đối soát tiếp tục ở bước sau."
  },
  "pay.checkout.confirmed.page_title": { en: "Checkout confirmed", vi: "Đã xác nhận thanh toán" },

  // pay.checkout.expired.*
  "pay.checkout.expired.allowed_next_actions_title": {
    en: "Allowed next actions",
    vi: "Hành động kế tiếp được phép"
  },
  "pay.checkout.expired.eyebrow": { en: "Checkout expired", vi: "Phiên thanh toán đã hết hạn" },
  "pay.checkout.expired.lede": {
    en: "The checkout window for this session has expired.",
    vi: "Thời gian thanh toán cho phiên này đã hết."
  },
  "pay.checkout.expired.note": {
    en: "A new checkout session must be created. The previous attempt is preserved as evidence.",
    vi: "Cần tạo phiên thanh toán mới. Lần thử trước được giữ làm bằng chứng."
  },
  "pay.checkout.expired.page_title": { en: "Checkout expired", vi: "Đã hết hạn thanh toán" },
  "pay.checkout.eyebrow_awaiting": {
    en: "Awaiting payer confirmation",
    vi: "Đang chờ người trả xác nhận"
  },
  "pay.checkout.eyebrow_failed": { en: "Checkout failed", vi: "Thanh toán thất bại" },

  // pay.checkout.failed.*
  "pay.checkout.failed.allowed_step.retry": {
    en: "Retry the checkout from the payment block.",
    vi: "Thử thanh toán lại từ trang thông tin chuyển khoản."
  },
  "pay.checkout.failed.allowed_steps_title": { en: "Allowed steps", vi: "Bước được phép" },
  "pay.checkout.failed.lede": {
    en: "This checkout attempt did not complete.",
    vi: "Lần thanh toán này chưa hoàn tất."
  },
  "pay.checkout.failed.note": {
    en: "No funds have been captured for the failed attempt.",
    vi: "Không có khoản nào bị thu cho lần thử thất bại."
  },

  // pay.checkout.missing.*
  "pay.checkout.missing.boundary.no_skip_reconciliation": {
    en: "Missing checkout sessions cannot skip the reconciliation lane.",
    vi: "Phiên thanh toán không tồn tại không được bỏ qua khâu đối soát."
  },
  "pay.checkout.missing.eyebrow": { en: "Checkout not found", vi: "Không tìm thấy phiên thanh toán" },
  "pay.checkout.missing.lede": {
    en: "No checkout session matches the requested identifier.",
    vi: "Không có phiên thanh toán nào khớp với mã yêu cầu."
  },
  "pay.checkout.missing.note": {
    en: "Verify the link is correct or open a new checkout from the payment block.",
    vi: "Kiểm tra lại đường dẫn hoặc mở phiên thanh toán mới từ trang chuyển khoản."
  },
  "pay.checkout.missing.page_title": {
    en: "Checkout not found",
    vi: "Không tìm thấy phiên thanh toán"
  },
  "pay.checkout.page_title_failed": { en: "Checkout failed", vi: "Thanh toán thất bại" },
  "pay.checkout.route_may_say_title": {
    en: "Route may report",
    vi: "Tuyến có thể báo"
  },

  // pay.checkout.shell.*
  "pay.checkout.shell.boundary.help_attached": {
    en: "Inline help is attached so payers and operators stay aligned.",
    vi: "Trợ giúp được gắn ngay để người trả và điều hành cùng nhịp."
  },
  "pay.checkout.shell.eyebrow": { en: "Checkout shell", vi: "Khung thanh toán" },
  "pay.checkout.shell.lede": {
    en: "The checkout shell holds the active session state.",
    vi: "Khung thanh toán giữ trạng thái phiên đang hoạt động."
  },
  "pay.checkout.shell.note": {
    en: "Powerful actions remain gated by approval and audit evidence.",
    vi: "Các thao tác mạnh vẫn được kiểm soát qua phê duyệt và bằng chứng kiểm toán."
  },
  "pay.checkout.shell.page_title": { en: "Checkout", vi: "Thanh toán" },
  "pay.checkout.shell.section.verify_next_title": {
    en: "Verify next",
    vi: "Xác minh kế tiếp"
  },

  // pay.checkout.snapshot_*
  "pay.checkout.snapshot_awaiting": {
    en: "Awaiting checkout snapshot",
    vi: "Bản chụp phiên đang chờ"
  },
  "pay.checkout.snapshot_cancelled": {
    en: "Cancelled checkout snapshot",
    vi: "Bản chụp phiên đã huỷ"
  },
  "pay.checkout.snapshot_confirmed": {
    en: "Confirmed checkout snapshot",
    vi: "Bản chụp phiên đã xác nhận"
  },
  "pay.checkout.snapshot_demo": { en: "One session, one truth", vi: "Một phiên, một sự thật" },
  "pay.checkout.snapshot_expired": {
    en: "Expired checkout snapshot",
    vi: "Bản chụp phiên đã hết hạn"
  },
  "pay.checkout.snapshot_failed": {
    en: "Failed checkout snapshot",
    vi: "Bản chụp phiên thất bại"
  },
  "pay.checkout.snapshot_missing": {
    en: "Missing checkout snapshot",
    vi: "Bản chụp phiên không có"
  },

  // pay.checkout.status.*
  "pay.checkout.status.lede": {
    en: "Live status of the checkout session.",
    vi: "Trạng thái trực tiếp của phiên thanh toán."
  },
  "pay.checkout.status.note": {
    en: "Status reflects the most recent ledger event accepted for this session.",
    vi: "Đây là trạng thái quan trọng nhất của trải nghiệm thanh toán; chỉ tin tín hiệu nội bộ, không tin nhãn từ nhà cung cấp."
  },
  "pay.checkout.status.page_title": { en: "Checkout status", vi: "Trạng thái thanh toán" },

  // pay.help.*
  "pay.help.action.read_support_docs": {
    en: "Read the support documentation.",
    vi: "Đọc tài liệu hỗ trợ."
  },
  "pay.help.eyebrow": { en: "Checkout help", vi: "Trợ giúp thanh toán" },
  "pay.help.lede": {
    en: "Inline help for this checkout session.",
    vi: "Trợ giúp gắn liền với phiên thanh toán này."
  },
  "pay.help.note": {
    en: "Help links never bypass approval or audit boundaries.",
    vi: "Liên kết trợ giúp không vượt qua ranh giới phê duyệt hay kiểm toán."
  },
  "pay.help.page_title": { en: "Checkout help", vi: "Trợ giúp thanh toán" },
  "pay.help.snapshot": { en: "Help snapshot", vi: "Bản chụp trợ giúp" },

  // pay.label.*
  "pay.label.approval_chain": { en: "Approval chain", vi: "Chuỗi phê duyệt" },
  "pay.label.approval_chains_open": { en: "Approval chains open", vi: "Chuỗi phê duyệt đang mở" },
  "pay.label.awaiting_confirmation": {
    en: "Awaiting confirmation",
    vi: "Đang chờ xác nhận"
  },
  "pay.label.policy_window": { en: "Policy window", vi: "Khung chính sách" },
  "pay.label.provider_label": { en: "Provider", vi: "Nhà cung cấp" },
  "pay.label.watchers": { en: "Watchers", vi: "Người theo dõi" },

  // pay.ops.area.*
  "pay.ops.area.payments_detail": { en: "Payments detail", vi: "Chi tiết thanh toán" },
  "pay.ops.area.reconciliation_detail": {
    en: "Reconciliation detail",
    vi: "Chi tiết đối soát"
  },
  "pay.ops.area.review_detail": { en: "Review detail", vi: "Chi tiết duyệt lại" },

  // pay.ops.audit.*
  "pay.ops.audit.boundary.view_only": {
    en: "Audit explorer is view-only and cannot trigger payouts.",
    vi: "Trình khám phá kiểm toán chỉ xem, không thể kích hoạt chi trả."
  },
  "pay.ops.audit.eyebrow": { en: "Audit explorer", vi: "Khám phá kiểm toán" },
  "pay.ops.audit.lede": {
    en: "Read-only window into payment audit events.",
    vi: "Cửa sổ chỉ đọc cho các sự kiện kiểm toán thanh toán."
  },
  "pay.ops.audit.metrics_snapshot": { en: "Audit metrics snapshot", vi: "Bản chụp số liệu kiểm toán" },
  "pay.ops.audit.note": {
    en: "Use audit evidence to ground every status claim.",
    vi: "Dùng bằng chứng kiểm toán để bảo chứng mọi tuyên bố trạng thái."
  },
  "pay.ops.audit.page_title": { en: "Audit explorer", vi: "Khám phá kiểm toán" },

  // pay.ops.detail.*
  "pay.ops.detail.context_title": { en: "Context", vi: "Bối cảnh" },
  "pay.ops.detail.eyebrow": { en: "Operations detail", vi: "Chi tiết tác vụ điều hành" },
  "pay.ops.detail.lede": {
    en: "Item detail for the requested operations area.",
    vi: "Chi tiết mục cho khu vực điều hành được yêu cầu."
  },
  "pay.ops.detail.note": {
    en: "Detail views surface evidence; powerful actions remain gated.",
    vi: "Trang chi tiết hiển thị bằng chứng; các thao tác mạnh vẫn được kiểm soát."
  },

  // pay.ops.detail_missing.*
  "pay.ops.detail_missing.boundary.no_powerful_actions": {
    en: "Missing detail records do not unlock powerful actions.",
    vi: "Mục chi tiết không tồn tại không mở khoá các thao tác mạnh."
  },
  "pay.ops.detail_missing.eyebrow": {
    en: "Detail not found",
    vi: "Không tìm thấy chi tiết"
  },
  "pay.ops.detail_missing.lede": {
    en: "No detail record matches the requested identifier.",
    vi: "Không có mục chi tiết nào khớp với mã yêu cầu."
  },
  "pay.ops.detail_missing.note": {
    en: "Verify the route or return to the operations queue.",
    vi: "Kiểm tra lại đường dẫn hoặc quay về hàng đợi điều hành."
  },
  "pay.ops.detail_missing.page_title": {
    en: "Detail not found",
    vi: "Không tìm thấy chi tiết"
  },

  // pay.ops.payments.*
  "pay.ops.payments.allowed_actions_title": { en: "Allowed actions", vi: "Hành động được phép" },
  "pay.ops.payments.eyebrow": { en: "Payments queue", vi: "Hàng đợi thanh toán" },
  "pay.ops.payments.lede": {
    en: "Active checkout sessions and inflight payment events.",
    vi: "Các phiên thanh toán đang chạy và sự kiện thanh toán đang xử lý."
  },
  "pay.ops.payments.metrics_snapshot": {
    en: "Payments metrics snapshot",
    vi: "Bản chụp số liệu thanh toán"
  },
  "pay.ops.payments.note": {
    en: "Watch callbacks and keep status shells calm.",
    vi: "Theo dõi callback và giữ vỏ trạng thái ổn định."
  },
  "pay.ops.payments.page_title": { en: "Payments queue", vi: "Hàng đợi thanh toán" },
  "pay.ops.payments.route_body": {
    en: "Open the payments queue to inspect inflight checkouts.",
    vi: "Mở hàng đợi thanh toán để kiểm tra các phiên đang chạy."
  },
  "pay.ops.payments.title": { en: "Payments monitor", vi: "Giám sát thanh toán" },

  // pay.ops.payouts.*
  "pay.ops.payouts.eyebrow": { en: "Payouts queue", vi: "Hàng đợi chi trả" },
  "pay.ops.payouts.lede": {
    en: "Pending payout intents and approval chains.",
    vi: "Các yêu cầu chi trả chờ duyệt và chuỗi phê duyệt."
  },
  "pay.ops.payouts.metrics_snapshot": {
    en: "Payouts metrics snapshot",
    vi: "Bản chụp số liệu chi trả"
  },
  "pay.ops.payouts.note": {
    en: "Auto payout remains forbidden until governance and ledger truth are proven.",
    vi: "Chi trả tự động bị cấm cho tới khi kiểm soát và sổ cái được chứng minh."
  },
  "pay.ops.payouts.page_title": { en: "Payouts queue", vi: "Hàng đợi chi trả" },
  "pay.ops.payouts.route_body": {
    en: "Open the payouts queue to review pending intents.",
    vi: "Mở hàng đợi chi trả để xem các yêu cầu chờ."
  },
  "pay.ops.payouts.title": { en: "Payout queue", vi: "Hàng đợi chi trả" },

  // pay.ops.reconciliation.*
  "pay.ops.reconciliation.eyebrow": { en: "Reconciliation", vi: "Đối soát" },
  "pay.ops.reconciliation.lede": {
    en: "Open reconciliation items between provider and ledger truth.",
    vi: "Các mục đối soát đang mở giữa nhà cung cấp và sổ cái."
  },
  "pay.ops.reconciliation.metrics_snapshot": {
    en: "Reconciliation metrics snapshot",
    vi: "Bản chụp số liệu đối soát"
  },
  "pay.ops.reconciliation.note": {
    en: "Reconciliation cannot be skipped, even for missing sessions.",
    vi: "Đối soát không thể bỏ qua, kể cả với phiên không tồn tại."
  },
  "pay.ops.reconciliation.page_title": { en: "Reconciliation", vi: "Đối soát" },
  "pay.ops.reconciliation.route_body": {
    en: "Open reconciliation to inspect provider-vs-ledger drift.",
    vi: "Mở đối soát để xem chênh lệch giữa nhà cung cấp và sổ cái."
  },
  "pay.ops.reconciliation.title": { en: "Reconciliation queue", vi: "Đối soát" },

  // pay.ops.review.*
  "pay.ops.review.eyebrow": { en: "Review queue", vi: "Hàng đợi duyệt" },
  "pay.ops.review.lede": {
    en: "Items waiting for human review or governance approval.",
    vi: "Các mục chờ duyệt thủ công hoặc phê duyệt quản trị."
  },
  "pay.ops.review.metrics_snapshot": {
    en: "Review metrics snapshot",
    vi: "Bản chụp số liệu duyệt"
  },
  "pay.ops.review.note": {
    en: "Review verdicts are recorded as evidence, not silent state.",
    vi: "Phán quyết duyệt được ghi làm bằng chứng, không phải trạng thái ngầm."
  },
  "pay.ops.review.page_title": { en: "Review queue", vi: "Hàng đợi duyệt" },
  "pay.ops.review.title": { en: "Review queue", vi: "Hàng đợi duyệt" },

  // pay.ops.snapshot_*
  "pay.ops.snapshot_missing_item": { en: "Missing item snapshot", vi: "Bản chụp mục không có" },
  "pay.ops.snapshot_work_item": { en: "Work item snapshot", vi: "Bản chụp mục công việc" },

  // pay.receipt.*
  "pay.receipt.boundary.refund_preserve_truth": {
    en: "Refunds preserve historical truth and never silently rewrite the receipt.",
    vi: "Hoàn tiền giữ sự thật lịch sử và không bao giờ viết đè biên nhận."
  },
  "pay.receipt.lede": {
    en: "Receipt for the confirmed payment session.",
    vi: "Biên nhận cho phiên thanh toán đã xác nhận."
  },
  "pay.receipt.missing.eyebrow": { en: "Receipt not found", vi: "Không tìm thấy biên nhận" },
  "pay.receipt.missing.lede": {
    en: "No receipt matches the requested identifier.",
    vi: "Không có biên nhận nào khớp với mã yêu cầu."
  },
  "pay.receipt.missing.note": {
    en: "Verify the link is correct or contact support.",
    vi: "Kiểm tra lại đường dẫn hoặc liên hệ hỗ trợ."
  },
  "pay.receipt.missing.page_title": { en: "Receipt not found", vi: "Không tìm thấy biên nhận" },
  "pay.receipt.missing.route_may_say.item.missing": {
    en: "Route may report: receipt missing.",
    vi: "Tuyến có thể báo: thiếu biên nhận."
  },
  "pay.receipt.next_step.ready_without_overclaim": {
    en: "Mark next steps ready without overclaim.",
    vi: "Đánh dấu bước kế tiếp đã sẵn sàng mà không tuyên bố quá."
  },
  "pay.receipt.next_steps_title": { en: "Next steps", vi: "Bước tiếp theo" },
  "pay.receipt.note": {
    en: "The receipt opens only after internal confirmation completes.",
    vi: "Biên nhận chỉ mở sau khi xác nhận nội bộ hoàn tất."
  },
  "pay.receipt.shell_title": { en: "Receipt shell", vi: "Khung biên nhận" },
  "pay.receipt.snapshot_confirmed": {
    en: "Confirmed receipt snapshot",
    vi: "Bản chụp biên nhận đã xác nhận"
  },
  "pay.receipt.snapshot_missing": {
    en: "Missing receipt snapshot",
    vi: "Bản chụp biên nhận không có"
  },

  // pay.routes.*
  "pay.routes.body": {
    en: "Pay exposes a small set of evidence-first routes.",
    vi: "Pay cung cấp một bộ tuyến nhỏ, ưu tiên bằng chứng."
  },
  "pay.routes.eyebrow": { en: "Routes", vi: "Tuyến" },
  "pay.routes.title": { en: "Pay route map", vi: "Bản đồ tuyến của Pay" },

  // pay.state.* / pay.value.*
  "pay.state.confirmed": { en: "Confirmed", vi: "Đã xác nhận" },
  "pay.value.confirmed": { en: "Confirmed", vi: "Đã xác nhận" },

  // pay.work_item_summary.*
  "pay.work_item_summary.awaiting_confirmation_for": {
    en: "Awaiting confirmation for",
    vi: "Đang chờ xác nhận cho"
  }
};

function loadJson(p) {
  return JSON.parse(readFileSync(p, "utf8"));
}

function writeJson(p, value) {
  writeFileSync(p, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function main() {
  const en = loadJson(enPath);
  const vi = loadJson(viPath);

  let addedEn = 0;
  let addedVi = 0;
  for (const [key, { en: enValue, vi: viValue }] of Object.entries(ENTRIES)) {
    if (en[key] === undefined) {
      en[key] = enValue;
      addedEn += 1;
    }
    if (vi[key] === undefined) {
      vi[key] = viValue;
      addedVi += 1;
    }
  }

  writeJson(enPath, en);
  writeJson(viPath, vi);

  console.log(`pay i18n backfill: en=${addedEn} added, vi=${addedVi} added`);
}

main();
