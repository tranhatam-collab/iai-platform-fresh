PAY_IAI_ONE_RECEIVERS_JSON_AND_DOMAIN_MAP_STARTER_2026.md

Version 1.0

Status: Starter Build Reference

Scope: Starter JSON structure for centralized receiver storage, domain assignment mapping, and QR asset naming

Depends on:

* PAY_IAI_ONE_RECEIVER_ACCOUNTS_MASTER_REGISTRY_2026.md
* PAY_IAI_ONE_SITE_ACTIVATION_PREP_REGISTRY_2026.md
* PAY_IAI_ONE_RECEIVER_ROUTING_AND_RENDER_RULES_2026.md

Purpose:

* give team dev one starter JSON pack they can implement immediately
* lock `tranhatam.com` assignment now
* keep all other domains present with payment assignment deferred until founder instruction
* standardize QR asset naming so routing and rendering never guess

⸻

0. Core rule

This file is a starter implementation reference.

It does not replace:

* receiver registry as account truth
* routing and render rules as logic truth

It gives the team a repo-ready JSON starter shape so everyone builds from the same structure.

⸻

1. Recommended starter file set

```text
/payments/
  receivers.json
  domain-payment-map.json
  render-rules.json
  qr-assets/
```

⸻

2. receivers.json

```json
{
  "meta": {
    "version": "2026-04-22",
    "generated_from": "PAY_IAI_ONE_RECEIVER_ACCOUNTS_MASTER_REGISTRY_2026.md",
    "status": "working_master_registry_sync"
  },
  "receivers": [
    {
      "receiver_id": "recv_vnd_personal_tranhatam_acb",
      "status": "ACTIVE_CONFIRMED",
      "currency": "VND",
      "channel_type": "bank_qr",
      "entity_type": "personal",
      "display_name": "Trần Hà Tâm",
      "legal_name": "TRAN HA TAM",
      "bank_name": "ACB",
      "account_number": "27588277",
      "branch": null,
      "swift_code": null,
      "country": "VN",
      "qr_asset": "qr-assets/recv_vnd_personal_tranhatam_acb.png"
    },
    {
      "receiver_id": "recv_vnd_personal_tranhatam_vcb",
      "status": "ACTIVE_CONFIRMED",
      "currency": "VND",
      "channel_type": "bank_qr",
      "entity_type": "personal",
      "display_name": "Trần Hà Tâm",
      "legal_name": "TRAN HA TAM",
      "bank_name": "Vietcombank",
      "account_number": "0231000091212",
      "branch": "Trụ sở CN Đắk Lắk",
      "swift_code": null,
      "country": "VN",
      "qr_asset": "qr-assets/recv_vnd_personal_tranhatam_vcb.png"
    },
    {
      "receiver_id": "recv_usd_personal_tranhatam_paypal",
      "status": "ACTIVE_CONFIRMED",
      "currency": "USD",
      "channel_type": "paypal_email",
      "entity_type": "personal",
      "display_name": "Trần Hà Tâm",
      "paypal_email": "tranhatam@gmail.com",
      "country": "US",
      "qr_asset": null
    },
    {
      "receiver_id": "recv_vnd_vietuc_toancau_acb",
      "status": "ACTIVE_CONFIRMED",
      "currency": "VND",
      "channel_type": "bank_qr",
      "entity_type": "company",
      "display_name": "Công ty Cổ phần Đầu tư Việt Úc Toàn Cầu",
      "legal_name_visible": "CTY CO PHAN DAU TU VIET UC TOAN CAU",
      "bank_name": "Ngân hàng TMCP Á Châu (ACB)",
      "account_number": "20153108",
      "branch": "ACB - PGD Kỳ Đồng",
      "swift_code": "ASCBVNVX",
      "country": "VN",
      "qr_asset": "qr-assets/recv_vnd_vietuc_toancau_acb.png"
    },
    {
      "receiver_id": "recv_vnd_tamvesey_uk_acb",
      "status": "ACTIVE_CONFIRMED",
      "currency": "VND",
      "channel_type": "bank_qr",
      "entity_type": "company",
      "display_name": "Công ty TNHH Tam Vesey Associates UK",
      "legal_name_visible": "CTY TNHH TAM VESEY ASSOCIATES UK",
      "bank_name": "Ngân hàng TMCP Á Châu (ACB)",
      "account_number": "12381288",
      "branch": "ACB - PGD Kỳ Đồng",
      "swift_code": "ASCBVNVX",
      "country": "VN",
      "qr_asset": "qr-assets/recv_vnd_tamvesey_uk_acb.png"
    },
    {
      "receiver_id": "recv_vnd_hanhtrinh_company_acb",
      "status": "NEEDS_LEGAL_NAME_CONFIRMATION",
      "currency": "VND",
      "channel_type": "bank_qr",
      "entity_type": "company",
      "display_name_visible": "Công ty CP ĐT Giáo Dục và Du Lịch Hành Trình Ka...",
      "legal_name_visible": "CTY CP DT GIAO DUC VA DU LICH HANH TRINH KA...",
      "bank_name": "Ngân hàng TMCP Á Châu (ACB)",
      "account_number": "30051378",
      "branch": "ACB - PGD Cống Quỳnh",
      "swift_code": "ASCBVNVX",
      "country": "VN",
      "qr_asset": "qr-assets/recv_vnd_hanhtrinh_company_acb.png"
    },
    {
      "receiver_id": "recv_usd_thanhtamphat_acb",
      "status": "ACTIVE_CONFIRMED",
      "currency": "USD",
      "channel_type": "bank_qr",
      "entity_type": "company",
      "display_name": "Công ty TNHH ĐTTM Thanh Tam Phat",
      "legal_name_visible": "CTY TNHH DTTM THANH TAM PHAT",
      "bank_name": "Ngân hàng TMCP Á Châu (ACB)",
      "account_number": "3699636",
      "branch": "ACB - CN TP. Hồ Chí Minh",
      "swift_code": "ASCBVNVX",
      "country": "VN",
      "qr_asset": "qr-assets/recv_usd_thanhtamphat_acb.png"
    },
    {
      "receiver_id": "recv_vnd_thanhtamphat_acb",
      "status": "ACTIVE_CONFIRMED",
      "currency": "VND",
      "channel_type": "bank_qr",
      "entity_type": "company",
      "display_name": "Công ty TNHH ĐTTM Thanh Tam Phat",
      "legal_name_visible": "CTY TNHH DTTM THANH TAM PHAT",
      "bank_name": "Ngân hàng TMCP Á Châu (ACB)",
      "account_number": "369999996",
      "branch": "ACB - CN TP. Hồ Chí Minh",
      "swift_code": "ASCBVNVX",
      "country": "VN",
      "qr_asset": "qr-assets/recv_vnd_thanhtamphat_acb.png"
    },
    {
      "receiver_id": "recv_vnd_thailam_acb",
      "status": "ACTIVE_CONFIRMED",
      "currency": "VND",
      "channel_type": "bank_qr",
      "entity_type": "company",
      "display_name": "Công ty TNHH SX - TM - DV Thai Lam",
      "legal_name_visible": "CONG TY TNHH SX - TM - DV THAI LAM",
      "bank_name": "Ngân hàng TMCP Á Châu (ACB)",
      "account_number": "43545878",
      "branch": "ACB - CN Lâm Đồng",
      "swift_code": "ASCBVNVX",
      "country": "VN",
      "qr_asset": "qr-assets/recv_vnd_thailam_acb.png"
    },
    {
      "receiver_id": "recv_vnd_vietcan_acb",
      "status": "ACTIVE_CONFIRMED",
      "currency": "VND",
      "channel_type": "bank_qr",
      "entity_type": "company",
      "display_name": "Công ty Cổ phần Giải Trí Ngôi Sao Việt Can",
      "legal_name_visible": "CTY CO PHAN GIAI TRI NGOI SAO VIET CAN",
      "bank_name": "Ngân hàng TMCP Á Châu (ACB)",
      "account_number": "12381278",
      "branch": "ACB - PGD Cống Quỳnh",
      "swift_code": "ASCBVNVX",
      "country": "VN",
      "qr_asset": "qr-assets/recv_vnd_vietcan_acb.png"
    },
    {
      "receiver_id": "recv_paypal_angeledutam_foundation",
      "status": "NEEDS_QR_SCAN_CONFIRMATION",
      "currency": "USD",
      "channel_type": "paypal_managed_qr",
      "entity_type": "organization",
      "display_name": "Angel Edu Tam Foundation Inc",
      "paypal_username": "@AngelEduTamFoundationInc",
      "paypal_me_base": "https://paypal.me/AngelEduTamFoundationInc",
      "paypal_qr_resolved_url": "https://www.paypal.com/qrcodes/managed/58701733-ae17-418e-bcf9-a31418519f3a?utm_source=old_merchant_lp",
      "country": "US",
      "qr_asset": "qr-assets/recv_paypal_angeledutam_foundation.png"
    },
    {
      "receiver_id": "recv_usd_angeledutam_foundation_relay_thread",
      "status": "ACTIVE_CONFIRMED",
      "assignment_status": "HOLD_NOT_ASSIGNED",
      "currency": "USD",
      "channel_type": "us_bank_account",
      "entity_type": "organization",
      "display_name": "Angel Edu Tam Foundation Inc",
      "legal_name": "Angel Edu Tam Foundation Inc",
      "bank_provider": "Relay Financial",
      "bank_name": "Thread Bank",
      "account_number": "200001161269",
      "routing_number": "064209588",
      "bank_address": "210 E Main St, Rogersville, TN 37857",
      "country": "US",
      "supported_receiving_rails": [
        "US_ACH",
        "US_DOMESTIC_WIRE",
        "INTERNATIONAL_WIRE_REQUIRES_RELAY_SWIFT_DETAILS"
      ],
      "public_render_status": "INTERNAL_ONLY_UNTIL_FOUNDER_ASSIGNMENT",
      "qr_asset": null
    }
  ]
}
```

⸻

3. domain-payment-map.json

```json
{
  "meta": {
    "version": "2026-04-22",
    "allow_cross_currency_fallback": false,
    "unassigned_rule": "DEFERRED_UNTIL_FOUNDER_INSTRUCTION"
  },
  "domains": {
    "tranhatam.com": {
      "assignment_status": "ACTIVE",
      "allow_cross_currency_fallback": false,
      "VND": {
        "primary": "recv_vnd_personal_tranhatam_acb",
        "fallback": "recv_vnd_personal_tranhatam_vcb",
        "secondary_admin_only": null
      },
      "USD": {
        "primary": "recv_usd_personal_tranhatam_paypal",
        "fallback": null,
        "secondary_admin_only": null
      }
    },
    "_future_us_relay_assignment_template": {
      "assignment_status": "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
      "note": "Use only after Founder maps a real domain to the Relay / Thread Bank USD organization receiver.",
      "USD": {
        "primary": "recv_usd_angeledutam_foundation_relay_thread",
        "allowed_rails": ["US_ACH", "US_DOMESTIC_WIRE"],
        "international_wire": "PENDING_RELAY_SWIFT_DETAILS"
      }
    },
    "nguyenlananh.com": {
      "assignment_status": "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
      "allow_cross_currency_fallback": false,
      "VND": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      },
      "USD": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      }
    },
    "omdala.com": {
      "assignment_status": "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
      "allow_cross_currency_fallback": false,
      "VND": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      },
      "USD": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      }
    },
    "app.omdala.com": {
      "assignment_status": "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
      "allow_cross_currency_fallback": false,
      "VND": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      },
      "USD": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      }
    },
    "omdalat.com": {
      "assignment_status": "ACTIVE_NOW",
      "allow_cross_currency_fallback": false,
      "VND": {
        "primary": "recv_vnd_thailam_acb",
        "fallback": null,
        "secondary_admin_only": null
      },
      "USD": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      }
    },
    "app.omdalat.com": {
      "assignment_status": "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
      "allow_cross_currency_fallback": false,
      "VND": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      },
      "USD": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      }
    },
    "flow.iai.one": {
      "assignment_status": "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
      "allow_cross_currency_fallback": false,
      "VND": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      },
      "USD": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      }
    },
    "life.iai.one": {
      "assignment_status": "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
      "allow_cross_currency_fallback": false,
      "VND": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      },
      "USD": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      }
    },
    "vc.vetuonglai.com": {
      "assignment_status": "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
      "allow_cross_currency_fallback": false,
      "VND": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      },
      "USD": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      }
    },
    "invest.vetuonglai.com": {
      "assignment_status": "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
      "allow_cross_currency_fallback": false,
      "VND": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      },
      "USD": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      }
    },
    "life.vetuonglai.com": {
      "assignment_status": "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
      "allow_cross_currency_fallback": false,
      "VND": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      },
      "USD": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      }
    },
    "aiaccountingloop.com": {
      "assignment_status": "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
      "allow_cross_currency_fallback": false,
      "VND": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      },
      "USD": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      }
    },
    "tramsaigon.com": {
      "assignment_status": "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
      "allow_cross_currency_fallback": false,
      "VND": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      },
      "USD": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      }
    },
    "app.iai.one": {
      "assignment_status": "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
      "allow_cross_currency_fallback": false,
      "VND": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      },
      "USD": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      }
    },
    "noos.iai.one": {
      "assignment_status": "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
      "allow_cross_currency_fallback": false,
      "VND": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      },
      "USD": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      }
    },
    "cios.iai.one": {
      "assignment_status": "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
      "allow_cross_currency_fallback": false,
      "VND": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      },
      "USD": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      }
    },
    "lamviec.muonnoi.org": {
      "assignment_status": "DEFERRED_UNTIL_FOUNDER_INSTRUCTION",
      "allow_cross_currency_fallback": false,
      "VND": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      },
      "USD": {
        "primary": null,
        "fallback": null,
        "secondary_admin_only": null
      }
    }
  }
}
```

⸻

4. render-rules.json

```json
{
  "render_rules": {
    "public_allowed_statuses": ["ACTIVE_CONFIRMED"],
    "internal_preview_statuses": [
      "NEEDS_QR_SCAN_CONFIRMATION",
      "NEEDS_LEGAL_NAME_CONFIRMATION"
    ],
    "hidden_statuses": [
      "HOLD_NOT_ASSIGNED",
      "DISABLED",
      "ARCHIVED"
    ],
    "allow_cross_currency_fallback": false,
    "max_public_receivers_per_currency": 2
  }
}
```

⸻

5. QR asset naming rules

Every QR asset must follow the receiver id exactly.

Rule:

`qr-assets/<receiver_id>.png`

Examples:

* `qr-assets/recv_vnd_personal_tranhatam_acb.png`
* `qr-assets/recv_vnd_personal_tranhatam_vcb.png`
* `qr-assets/recv_vnd_vietuc_toancau_acb.png`
* `qr-assets/recv_paypal_angeledutam_foundation.png`

Hard rules:

* do not invent asset names unrelated to receiver id
* do not reuse one QR asset for multiple receiver ids
* do not publish QR assets for non-public-eligible receivers
* if the receiver status is not `ACTIVE_CONFIRMED`, keep the asset internal-only

⸻

6. Placeholder rule for unassigned domains

Every domain that does not yet have founder assignment must remain present in the map as:

* `assignment_status = NOT_ASSIGNED_YET`
* all receiver slots set to `null`

This prevents:

* silent local overrides
* ad hoc hard-coding
* missing-domain ambiguity

⸻

7. Current implement-now rule

Implement now:

1. build `receivers.json`
2. build `domain-payment-map.json`
3. build `render-rules.json`
4. place QR assets using the locked naming rule
5. wire `tranhatam.com` only
6. keep every other domain unassigned until founder instruction

⸻

8. Final direction

This starter file exists so the team can move from documentation truth to implementation truth without changing the locked logic.

Registry decides what accounts exist.
Routing rules decide how they are selected and rendered.
This file gives the exact starter JSON the team should build from.
