PAY_IAI_ONE_VN_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md

Version 1.0

Status: Vietnam Banking Onboarding Form Lock

Scope

Standard onboarding form for Vietnam legal owners, websites, collection accounts, payout accounts, and operational verification data used by pay.iai.one

Owners

Product / Payments / Backend / Finance Ops / Treasury / Security / Support

Priority

Highest

⸻

0. Core statement

If bank-account and owner data are collected inconsistently, the payment lane becomes fragile very quickly.

For pay.iai.one, every Vietnam site must have a clean, reviewable, and verifiable mapping between:

* website
* legal owner
* collection account
* payout account
* operational contacts
* evidence of control

This form exists so the team can collect that data once, collect it correctly, and avoid later confusion in checkout, reconciliation, payout review, and treasury operations.

⸻

1. Purpose

This file defines the standard intake form for Vietnam-first bank-account and site onboarding inside pay.iai.one.

The goals are:

* standardize information gathering across sites
* prevent incomplete bank setup records
* make collection and payout roles explicit
* preserve legal-owner truth
* keep evidence attached to operational setup
* prepare clean input for future system import or registry tables

⸻

2. Applies to

Use this form when onboarding any Vietnam-based site, legal owner, or bank account into pay.iai.one, including:

* new websites
* existing websites being moved into pay.iai.one
* individual operators receiving payouts
* companies receiving collections
* businesses using one bank account for both collection and payout
* businesses using separate collection and payout accounts

⸻

3. Form usage rules

3.1 One owner record per legal owner

Create one owner record for each legal entity or individual.
Do not merge multiple legal owners into one record.

3.2 One site record per website or product surface

Each domain or distinct operating site should have its own site record.

3.3 Separate collection and payout records even if the account is the same

If one bank account is used for both collection and payout, still complete both blocks and link them clearly.

3.4 Names must match bank truth

Always collect:

* exact account holder name as stored by the bank
* ASCII or non-diacritic account holder name for QR or operational systems if needed

3.5 Proof is mandatory

Every bank account record must include proof of control or verification evidence.

3.6 Do not collect banking secrets

Never collect:

* password
* OTP
* PIN
* CVV
* card number unless a separate approved card flow explicitly requires it

⸻

4. Required onboarding bundle

The full Vietnam onboarding bundle consists of:

* one legal owner form
* one site form
* one collection account form
* one payout account form if payouts are enabled
* one site-payment mapping form
* one activation-routing and sender-package form
* evidence attachments
* verification checklist outcome

⸻

5. Form A — Legal owner form

Use this form for the legal owner behind the site.

```md
# PAY_IAI_ONE_VN_LEGAL_OWNER_FORM

## A. Owner Type
- owner_type: company / individual

## B. Basic Identity
- owner_code:
- legal_name:
- legal_name_ascii:
- display_name:
- country: VN

## C. Company Only
- company_registration_name:
- enterprise_id_or_tax_code:
- legal_representative_name:
- registered_address:

## D. Individual Only
- full_name:
- full_name_ascii:
- id_type: CCCD / Passport
- id_number:
- date_of_birth:
- residential_address:

## E. Contact
- finance_contact_name:
- finance_contact_phone:
- finance_contact_email:
- ops_contact_name:
- ops_contact_phone:
- ops_contact_email:

## F. Compliance Notes
- source_of_funds_notes:
- restricted_business_flag: yes / no
- restricted_business_notes:
- sanctions_screening_status: pending / passed / blocked
- kyc_status: pending / verified / rejected

## G. Evidence
- business_license_file:
- tax_certificate_file:
- id_front_file:
- id_back_file:
- authorization_file:
- other_notes:
```

⸻

6. Form B — Site form

Use this form for each website or payment surface.

```md
# PAY_IAI_ONE_VN_SITE_FORM

## A. Site Identity
- site_code:
- site_name:
- site_display_name:
- domain:
- environment: staging / production
- country: VN
- currency: VND

## B. Ownership Mapping
- owner_code:
- owner_type: company / individual
- legal_name:
- tax_code_or_id_number:

## C. Payment Role
- accepts_customer_payments: yes / no
- pays_out_beneficiaries: yes / no
- refunds_enabled: yes / no
- reserve_hold_enabled: yes / no

## D. Business Context
- business_model:
- product_or_service_type:
- expected_monthly_volume_vnd:
- expected_average_ticket_vnd:
- expected_peak_daily_volume_vnd:

## E. Operational Controls
- finance_owner:
- treasury_owner:
- support_owner:
- callback_endpoint:
- reconciliation_owner:
- notes:
```

⸻

7. Form C — Collection account form

Use this form for each bank account that will receive customer money.

```md
# PAY_IAI_ONE_VN_COLLECTION_ACCOUNT_FORM

## A. Account Identity
- collection_account_code:
- site_code:
- owner_code:
- account_role: collection

## B. Bank Details
- bank_name:
- bank_code:
- bank_bin_or_acq_id:
- branch_name:
- account_number:
- account_holder_name_exact:
- account_holder_name_ascii:
- account_type: personal / business

## C. Payment Capability
- vietqr_enabled: yes / no
- qr_type: static / dynamic / semi_dynamic
- transfer_content_prefix:
- default_terminal_code:
- default_service_code:
- supports_manual_deposit_review: yes / no

## D. Reconciliation
- reconciliation_reference_format:
- duplicate_detection_rule:
- statement_source: manual / bank_export / api / provider
- settlement_t_plus_policy:

## E. Verification
- account_verified: yes / no
- verification_method: screenshot / bank_letter / micro_transfer / statement
- verification_date:
- verified_by:
- proof_file:

## F. Controls
- active_status: active / inactive / blocked
- first_live_date:
- last_review_date:
- notes:
```

⸻

8. Form D — Payout account form

Use this form for each bank account that will receive payouts from pay.iai.one.

```md
# PAY_IAI_ONE_VN_PAYOUT_ACCOUNT_FORM

## A. Account Identity
- payout_account_code:
- site_code:
- owner_code:
- account_role: payout
- same_as_collection_account: yes / no
- linked_collection_account_code:

## B. Bank Details
- bank_name:
- bank_code:
- bank_bin_or_acq_id:
- branch_name:
- account_number:
- account_holder_name_exact:
- account_holder_name_ascii:
- account_type: personal / business

## C. Treasury Controls
- payout_enabled: yes / no
- payout_method: bank_transfer / manual_bank_transfer
- requires_manual_approval: yes / no
- approval_threshold_vnd:
- daily_limit_vnd:
- per_payout_limit_vnd:
- reserve_hold_policy:
- refund_priority_policy:

## D. Execution Safety
- beneficiary_name_match_required: yes / no
- supporting_evidence_required: yes / no
- execution_reference_required: yes / no
- payout_failure_recovery_notes:
- ambiguity_escalation_owner:

## E. Verification
- account_verified: yes / no
- verification_method:
- verification_date:
- verified_by:
- proof_file:

## F. Controls
- active_status: active / inactive / blocked
- first_live_date:
- last_review_date:
- notes:
```

⸻

9. Form E — Site-payment mapping form

Use this form as the final cross-check that the site, owner, and bank accounts have been linked correctly.

```md
# PAY_IAI_ONE_VN_SITE_PAYMENT_MAPPING_FORM

- site_code:
- domain:
- owner_code:
- legal_name:
- owner_type:
- collection_account_code:
- collection_bank_name:
- collection_account_number:
- payout_account_code:
- payout_bank_name:
- payout_account_number:
- callback_enabled: yes / no
- reconciliation_mode:
- payout_mode:
- current_status: draft / pending_verification / ready_for_staging / ready_for_live / blocked
- blocker_notes:
```

⸻

9.1 Form F — Activation routing and sender package form

Use this form for the final activation-routing packet required before staging or live handoff.
Only store references to keys or secret paths here, never raw secret values.

```md
# PAY_IAI_ONE_VN_ACTIVATION_ROUTING_AND_SENDER_PACKAGE_FORM

## A. Site and Provider Mapping
- site_code:
- domain:
- provider_name: payOS / other
- provider_merchant_reference:
- payment_flow_scope: one_time_only / other

## B. Checkout Routing
- checkout_return_url:
- checkout_cancel_url:
- callback_endpoint:
- x_site_key_reference:
- x_idempotency_key_strategy:

## C. Sender Package
- EMAIL_FROM_PAY:
- EMAIL_FROM_BILLING:
- EMAIL_REPLY_TO_SUPPORT:
- pay_inbox_address:
- billing_inbox_address:
- support_inbox_address:
- noreply_inbox_address:
- payment_receipt_sender_policy: EMAIL_FROM_PAY
- billing_failed_refund_sender_policy: EMAIL_FROM_BILLING
- payment_reply_to_policy: EMAIL_REPLY_TO_SUPPORT
- payment_sender_noreply_allowed: no

## D. Temporary Sender Handling
- temporary_sender_brand:
- temporary_reply_to:
- inbox_owner:
- notes:
```

⸻

10. Minimum required fields for staging

At minimum, the following fields must be present before a site should enter staging validation:

* site_code
* domain
* owner_type
* legal_name
* tax_code_or_id_number or id_number
* bank_name
* bank_code
* account_number
* account_holder_name_exact
* account_holder_name_ascii
* account_role
* finance_contact_email
* ops_contact_email
* proof_file
* checkout_return_url
* checkout_cancel_url
* callback_endpoint
* x_site_key_reference
* EMAIL_FROM_PAY
* EMAIL_REPLY_TO_SUPPORT
* payment_sender_noreply_allowed = no

⸻

11. Additional required fields for live usage

Before live usage, the team should also have:

* account_verified marked yes
* verification_method
* verification_date
* verified_by
* provider_merchant_reference
* payout approval rule if payouts are enabled
* transfer content prefix if QR or transfer matching is used
* reconciliation reference format
* callback endpoint if fulfillment callbacks exist
* x_idempotency_key_strategy
* EMAIL_FROM_BILLING
* pay_inbox_address
* support_inbox_address
* billing_inbox_address
* noreply_inbox_address
* current_status set to ready_for_live

For the current `tranhatam.com` launch packet, the sender policy is locked as:

* payment receipt -> `pay@tranhatam.com`
* billing, failed-payment, refund -> `billing@tranhatam.com`
* reply-to -> `support@tranhatam.com`
* `noreply@tranhatam.com` must not be used as a payment sender

⸻

12. Prohibited data

The following must not be requested or stored through this onboarding form:

* online banking password
* OTP code
* PIN
* debit or credit card CVV
* full card track data
* security token value unrelated to approved operational setup

If any operator supplies this information, it must be treated as an operational security issue and removed from the onboarding packet.

⸻

13. Recommended evidence types

Acceptable evidence for bank-account verification may include:

* mobile banking screenshot showing account holder and account number
* bank statement excerpt with sensitive irrelevant fields masked
* bank confirmation letter
* micro-transfer verification record
* treasury review note with supporting attachment

The evidence should be sufficient to prove account control without collecting unnecessary secrets.

⸻

14. Verification checklist

Before marking a site ready, confirm:

* legal owner form is complete
* site form is complete
* collection account form is complete
* payout account form is complete if applicable
* names are internally consistent
* bank code is present
* proof file exists
* account has been verified
* payout controls are defined if payouts are enabled
* pending blockers are recorded explicitly

⸻

15. Suggested storage model

For operational clarity, the team should maintain separate registries or tables for:

* legal owners
* sites
* collection accounts
* payout accounts
* site-payment mappings

This keeps ownership truth separate from bank-account truth and makes later reconciliation or migration work much safer.

⸻

16. Final direction

This onboarding form should be treated as the standard intake layer for Vietnam-first payment operations inside pay.iai.one.

It exists so the team can onboard new sites and bank accounts with enough structure for:

* operational review
* treasury review
* payout safety
* reconciliation readiness
* future system import

That is the correct onboarding form standard for pay.iai.one in the Vietnam-first rollout.

⸻
