PAY_IAI_ONE_INTERNATIONAL_BANK_ACCOUNT_AND_SITE_ONBOARDING_FORM_2026.md

Version 1.0

Status: International Banking Onboarding Form Lock

Scope

Standard onboarding form for international legal owners, websites, collection accounts, payout accounts, settlement rails, and compliance verification data used by pay.iai.one

Owners

Product / Payments / Backend / Finance Ops / Treasury / Security / Support

Priority

Highest

⸻

0. Core statement

International payment onboarding becomes unstable very quickly if the team collects “almost the same” data differently across countries, providers, or bank rails.

For pay.iai.one, every international site must have a clean, reviewable, and verifiable mapping between:

* website
* legal owner
* collection account or collection rail
* payout account
* settlement country and currency
* operational contacts
* evidence of control
* compliance and verification state

This form exists so the team can collect that data once, collect it correctly, and avoid later confusion in checkout, settlement, reconciliation, payout review, tax handling, and treasury operations.

⸻

1. Purpose

This file defines the standard intake form for international bank-account and site onboarding inside pay.iai.one.

The goals are:

* standardize information gathering across non-Vietnam sites
* separate collection rails from payout rails clearly
* preserve legal-owner and jurisdiction truth
* record settlement and currency behavior explicitly
* keep evidence attached to operational setup
* prepare clean input for future system import, provider onboarding, or treasury registry tables

⸻

2. Applies to

Use this form when onboarding any non-Vietnam site, legal owner, or bank account into pay.iai.one, including:

* new international websites
* existing websites being moved into pay.iai.one
* companies collecting customer payments outside Vietnam
* individual operators receiving payouts outside Vietnam if allowed by policy
* businesses using one account for both collection and payout
* businesses using separate collection and payout accounts
* sites using provider-managed balance or settlement rails instead of direct bank receipt

If a site is Vietnam-first, use the Vietnam onboarding form instead.
Do not mix the two forms into one record.

⸻

3. Form usage rules

3.1 One owner record per legal owner

Create one owner record for each legal entity or individual.
Do not merge multiple legal owners into one record.

3.2 One site record per website or product surface

Each domain or distinct operating site should have its own site record.

3.3 Separate collection and payout records even if the destination is the same

If one account or provider balance is used for both collection and payout, still complete both blocks and link them clearly.

3.4 Names must match bank or provider truth

Always collect:

* exact account holder or beneficiary name as stored by the bank or provider
* exact legal entity name if settlement is tied to business verification
* operational display name only as a secondary field

3.5 Jurisdiction truth is mandatory

Every international owner and account record must state:

* country
* operating jurisdiction if different
* settlement currency
* tax or registration context

3.6 Proof is mandatory

Every account or provider-settlement record must include proof of control or verification evidence.

3.7 Do not collect banking secrets

Never collect:

* password
* OTP
* PIN
* card CVV
* raw API secret unless it belongs in an approved secure secret-management path rather than this intake form

⸻

4. Required onboarding bundle

The full international onboarding bundle consists of:

* one legal owner form
* one site form
* one collection account or collection rail form
* one payout account form if payouts are enabled
* one site-payment mapping form
* one activation-routing and sender-package form
* evidence attachments
* verification checklist outcome
* compliance review outcome

⸻

5. Form A — Legal owner form

Use this form for the legal owner behind the site.

```md
# PAY_IAI_ONE_INTERNATIONAL_LEGAL_OWNER_FORM

## A. Owner Type
- owner_type: company / individual

## B. Basic Identity
- owner_code:
- legal_name:
- display_name:
- country_of_registration_or_residence:
- operating_country_if_different:
- primary_currency:

## C. Company Only
- company_registration_name:
- incorporation_country:
- company_registration_number:
- tax_id_or_vat_id:
- legal_representative_name:
- registered_address:
- business_type:

## D. Individual Only
- full_name:
- id_type: passport / national_id / other
- id_number:
- issuing_country:
- date_of_birth:
- residential_address:

## E. Contacts
- finance_contact_name:
- finance_contact_phone:
- finance_contact_email:
- treasury_contact_name:
- treasury_contact_phone:
- treasury_contact_email:
- ops_contact_name:
- ops_contact_phone:
- ops_contact_email:

## F. Compliance
- source_of_funds_notes:
- source_of_business_notes:
- restricted_business_flag: yes / no
- restricted_business_notes:
- sanctions_screening_status: pending / passed / blocked
- kyb_or_kyc_status: pending / verified / rejected
- beneficial_owner_review_required: yes / no
- beneficial_owner_review_status: pending / passed / blocked

## G. Evidence
- registration_document_file:
- tax_document_file:
- identity_document_file:
- authorization_file:
- provider_verification_file:
- other_notes:
```

⸻

6. Form B — Site form

Use this form for each website or payment surface.

```md
# PAY_IAI_ONE_INTERNATIONAL_SITE_FORM

## A. Site Identity
- site_code:
- site_name:
- site_display_name:
- domain:
- environment: staging / production
- primary_country:
- allowed_customer_countries:
- primary_currency:
- additional_supported_currencies:

## B. Ownership Mapping
- owner_code:
- owner_type: company / individual
- legal_name:
- registration_or_tax_reference:

## C. Payment Role
- accepts_customer_payments: yes / no
- pays_out_beneficiaries: yes / no
- refunds_enabled: yes / no
- reserve_hold_enabled: yes / no

## D. Business Context
- business_model:
- product_or_service_type:
- expected_monthly_volume:
- expected_average_ticket:
- expected_peak_daily_volume:
- high_risk_market_flag: yes / no

## E. Operational Controls
- finance_owner:
- treasury_owner:
- support_owner:
- callback_endpoint:
- reconciliation_owner:
- dispute_owner:
- notes:
```

⸻

7. Form C — Collection account or collection rail form

Use this form for each destination or rail that will receive customer money.

```md
# PAY_IAI_ONE_INTERNATIONAL_COLLECTION_ACCOUNT_FORM

## A. Account Identity
- collection_account_code:
- site_code:
- owner_code:
- account_role: collection

## B. Rail Type
- rail_type: bank_account / provider_balance / virtual_account / hosted_checkout_provider / manual_wire
- provider_name:
- provider_account_reference:
- settlement_country:
- settlement_currency:

## C. Bank or Settlement Details
- bank_name:
- bank_country:
- branch_name:
- beneficiary_name_exact:
- account_number_or_iban:
- account_identifier_type: iban / aba_routing / swift_bic / sort_code / bsb / ifsc / clabe / local_bank_code / provider_reference / other
- account_identifier_value:
- account_type: personal / business / provider_balance

## D. Collection Capability
- supports_cards: yes / no
- supports_bank_transfer: yes / no
- supports_wallets: yes / no
- supports_manual_review: yes / no
- settlement_t_plus_policy:
- settlement_reference_format:
- duplicate_detection_rule:

## E. FX and Settlement
- customer_charge_currency:
- settlement_currency:
- fx_conversion_handling: provider_fx / treasury_fx / none
- settlement_schedule:
- reserve_or_hold_policy:

## F. Verification
- account_verified: yes / no
- verification_method: provider_dashboard / bank_letter / statement / micro_transfer / treasury_review / other
- verification_date:
- verified_by:
- proof_file:

## G. Controls
- active_status: active / inactive / blocked
- first_live_date:
- last_review_date:
- notes:
```

⸻

8. Form D — Payout account form

Use this form for each bank account or provider destination that will receive payouts from pay.iai.one.

```md
# PAY_IAI_ONE_INTERNATIONAL_PAYOUT_ACCOUNT_FORM

## A. Account Identity
- payout_account_code:
- site_code:
- owner_code:
- account_role: payout
- same_as_collection_account: yes / no
- linked_collection_account_code:

## B. Rail Type
- payout_method: bank_transfer / provider_transfer / manual_wire / other
- payout_country:
- payout_currency:
- provider_name:
- provider_destination_reference:

## C. Bank or Beneficiary Details
- bank_name:
- bank_country:
- branch_name:
- beneficiary_name_exact:
- account_number_or_iban:
- account_identifier_type: iban / aba_routing / swift_bic / sort_code / bsb / ifsc / clabe / local_bank_code / provider_reference / other
- account_identifier_value:
- account_type: personal / business / provider_balance

## D. Treasury Controls
- payout_enabled: yes / no
- requires_manual_approval: yes / no
- approval_threshold_amount:
- daily_limit_amount:
- per_payout_limit_amount:
- reserve_hold_policy:
- refund_priority_policy:

## E. Execution Safety
- beneficiary_name_match_required: yes / no
- supporting_evidence_required: yes / no
- execution_reference_required: yes / no
- sanctions_recheck_required_before_high_value_payout: yes / no
- payout_failure_recovery_notes:
- ambiguity_escalation_owner:

## F. Verification
- account_verified: yes / no
- verification_method:
- verification_date:
- verified_by:
- proof_file:

## G. Controls
- active_status: active / inactive / blocked
- first_live_date:
- last_review_date:
- notes:
```

⸻

9. Form E — Site-payment mapping form

Use this form as the final cross-check that the site, owner, collection rail, and payout destination have been linked correctly.

```md
# PAY_IAI_ONE_INTERNATIONAL_SITE_PAYMENT_MAPPING_FORM

- site_code:
- domain:
- owner_code:
- legal_name:
- owner_type:
- primary_country:
- primary_currency:
- collection_account_code:
- collection_provider_or_bank_name:
- collection_settlement_country:
- collection_settlement_currency:
- payout_account_code:
- payout_provider_or_bank_name:
- payout_country:
- payout_currency:
- callback_enabled: yes / no
- reconciliation_mode:
- payout_mode:
- fx_handling_mode:
- current_status: draft / pending_verification / ready_for_staging / ready_for_live / blocked
- blocker_notes:
```

⸻

9.1 Form F — Activation routing and sender package form

Use this form for the final activation-routing packet required before staging or live handoff.
Only store references to keys or secret paths here, never raw secret values.

```md
# PAY_IAI_ONE_INTERNATIONAL_ACTIVATION_ROUTING_AND_SENDER_PACKAGE_FORM

## A. Site and Provider Mapping
- site_code:
- domain:
- provider_name:
- provider_merchant_or_account_reference:
- payment_flow_scope: one_time_only / one_time_plus_manual_review / other

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
* country_of_registration_or_residence
* registration_or_tax_reference or id_number
* rail_type
* settlement_country
* settlement_currency
* beneficiary_name_exact
* account_number_or_iban or provider_account_reference
* account_identifier_type
* account_identifier_value if the rail requires it
* finance_contact_email
* treasury_contact_email
* proof_file
* checkout_return_url
* checkout_cancel_url
* callback_endpoint
* x_site_key_reference
* EMAIL_FROM_PAY
* EMAIL_REPLY_TO_SUPPORT

⸻

11. Additional required fields for live usage

Before live usage, the team should also have:

* account_verified marked yes
* verification_method
* verification_date
* verified_by
* sanctions screening status not blocked
* provider_merchant_or_account_reference
* payout approval rule if payouts are enabled
* settlement schedule
* reconciliation reference format
* callback endpoint if fulfillment callbacks exist
* x_idempotency_key_strategy
* EMAIL_FROM_BILLING
* pay_inbox_address
* support_inbox_address
* current_status set to ready_for_live

If FX conversion is involved, the team should also record who owns FX handling and what rate source or settlement policy applies.

⸻

12. Prohibited data

The following must not be requested or stored through this onboarding form:

* online banking password
* OTP code
* PIN
* debit or credit card CVV
* full card track data
* secret API key in raw form
* security token value unrelated to approved operational setup

If any operator supplies this information, it must be treated as an operational security issue and removed from the onboarding packet.

⸻

13. Recommended evidence types

Acceptable evidence for international account verification may include:

* provider dashboard screenshot showing verified payout or settlement destination
* masked bank statement excerpt with relevant beneficiary and account data
* bank confirmation letter
* micro-transfer verification record
* KYB or KYC approval confirmation from provider
* treasury review note with supporting attachment

The evidence should be sufficient to prove account control without collecting unnecessary secrets.

⸻

14. Verification checklist

Before marking a site ready, confirm:

* legal owner form is complete
* site form is complete
* collection account or collection rail form is complete
* payout account form is complete if applicable
* country and currency fields are consistent
* beneficiary name is internally consistent
* account identifier type is correct for the country or rail
* proof file exists
* account has been verified
* payout controls are defined if payouts are enabled
* compliance blockers are recorded explicitly
* pending blockers are recorded explicitly

⸻

15. Suggested storage model

For operational clarity, the team should maintain separate registries or tables for:

* legal owners
* sites
* collection accounts or collection rails
* payout accounts
* site-payment mappings
* compliance review outcomes

This keeps ownership truth separate from settlement truth and makes later reconciliation, tax handling, or provider migration work much safer.

⸻

16. Final direction

This onboarding form should be treated as the standard intake layer for international payment operations inside pay.iai.one.

It exists so the team can onboard new sites and payout destinations with enough structure for:

* operational review
* treasury review
* payout safety
* reconciliation readiness
* jurisdiction clarity
* future system import

That is the correct onboarding form standard for pay.iai.one for international rollout.

⸻
