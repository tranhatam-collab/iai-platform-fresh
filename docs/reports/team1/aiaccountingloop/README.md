# aiaccountingloop.com VietQR static rail — 2026-05-06

- Path chosen: **Hybrid (Path 3)** — static VietQR live now, payOS Thanh Tam Phat
  merchant KYB opens in parallel.
- Owner: founder-locked routing.
- Pay rail (current): **manual reconciliation** by matching bank statement against
  amount + memo + time.

## Receiver (confirmed against payment-routing.ts)

| Field | Value |
|---|---|
| Legal name | CTY TNHH ĐTTM THANH TAM PHAT |
| Display name | Công ty TNHH ĐTTM Thanh Tam Phat |
| Bank | Ngân hàng TMCP Á Châu (ACB) |
| Branch | ACB - CN TP. Hồ Chí Minh |
| Account number (VND) | **369999996** |
| Bank BIN (NAPAS) | 970416 |
| SWIFT | ASCBVNVX |
| vietQrBankId | ACB |
| Receiver ID (registry) | recv_vnd_thanhtamphat_acb |
| Status | ACTIVE_CONFIRMED |

## VietQR static — open amount

This QR encodes ONLY: bank routing + account. No fixed amount, no embedded memo.
Customer enters both at the time of payment in their banking app.

### EMV TLV string (raw payload encoded into QR)

```
00020101021138530010A0000007270123000697041601093699999960208QRIBFTTA53037045802VN63049432
```

Length: 90 characters. CRC: `9432` (CRC-16/CCITT-FALSE).

### EMV TLV breakdown

| Tag | Len | Value | Meaning |
|---|---|---|---|
| 00 | 02 | 01 | Payload Format Indicator |
| 01 | 02 | 11 | Point of Initiation Method = static (open amount) |
| 38 | 53 | nested | Merchant account info |
| ↳ 00 | 10 | A000000727 | NAPAS application id (Vietnam unified QR) |
| ↳ 01 | 23 | nested | Beneficiary info |
| ↳↳ 00 | 06 | 970416 | Bank BIN = ACB |
| ↳↳ 01 | 09 | 369999996 | Account number |
| ↳ 02 | 08 | QRIBFTTA | Service code = inter-bank transfer to account |
| 53 | 03 | 704 | Currency = VND (ISO 4217) |
| 58 | 02 | VN | Country |
| 63 | 04 | 9432 | CRC-16/CCITT-FALSE over the rest |

### Files

- `AAL_VIETQR_THANHTAMPHAT_ACB_369999996_2026-05-06.png` — high-resolution raster
  (scale 12, border 4)
- `AAL_VIETQR_THANHTAMPHAT_ACB_369999996_2026-05-06.svg` — vector
- `AAL_VIETQR_THANHTAMPHAT_ACB_369999996_2026-05-06.spec.txt` — raw EMV string

## Memo convention (operator-side, not encoded in QR)

When showing the QR to a customer, surround it with text indicating the required
memo template. The customer must type this exact format in the
"Nội dung chuyển khoản" / "Lời nhắn" field of their banking app:

```
AAL|<orderId>|<customerRef>
```

For internal test orders, use:

```
AAL|AALTEST-YYYYMMDD-XXX|<customerRef>
```

Examples:

```
AAL|ORDER-20260506-0001|CUST-100
AAL|AALTEST-20260506-001|smoke
```

The `AAL` prefix anchors all aiaccountingloop.com transfers in the bank
statement search.

## Reconciliation (until payOS Thanh Tam Phat is wired)

A transfer is considered paid only when ALL three match in the bank statement:

1. Amount equals the invoice amount (exact, not partial).
2. Memo contains `AAL|<orderId>|<customerRef>` (case-sensitive).
3. Time is after the invoice issue and before its expiry.

Until the payOS Thanh Tam Phat lane is live:

- Public checkout via `pay.iai.one` is **disabled** for aiaccountingloop
  (merchant_sites.active = 0 enforces this at auth layer).
- Reconciliation is manual against the ACB statement.
- No payment_intent row is auto-marked paid.

## When payOS Thanh Tam Phat goes live

- Switch aiaccountingloop tenant to use the Thanh Tam Phat payOS merchant.
- Flip `merchant_sites.active` to 1 for site_aal_2026_05_06.
- payOS will then issue dynamic QR + auto-callback.
- This static VietQR can remain as a manual fallback or be retired.

## Verification

To verify this QR points to the correct beneficiary BEFORE printing or
broadcasting:

1. Open any modern Vietnamese banking app (MB, Vietcombank, ACB, BIDV, ...).
2. Tap "Quét QR" / "Scan QR".
3. Scan this image.
4. The app must show:
   - Beneficiary bank: ACB
   - Beneficiary account: 369999996
   - Beneficiary name: CTY TNHH DTTM THANH TAM PHAT (or similar normalization)
   - Amount field: blank (customer fills)
   - Memo field: blank (customer fills)
5. Do NOT confirm the transfer. Just verify the read.
