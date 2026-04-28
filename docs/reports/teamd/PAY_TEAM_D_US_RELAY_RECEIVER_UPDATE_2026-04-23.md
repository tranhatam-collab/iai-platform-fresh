# PAY_TEAM_D_US_RELAY_RECEIVER_UPDATE_2026-04-23

- Team: Team D Payments Activation + Treasury Ops
- Date: 2026-04-23
- Scope: United States USD receiver update for Angel Edu Tam Foundation Inc
- Receiver standard: `docs/PAY_IAI_ONE_US_RELAY_RECEIVER_STANDARD_2026.md`
- Registry source: `docs/PAY_IAI_ONE_RECEIVER_ACCOUNTS_MASTER_REGISTRY_2026.md`
- Runtime source: `apps/pay/src/payment-routing.ts`

## 1. Update summary

Angel Edu Tam Foundation Inc now has a locked United States USD receiver standard in the pay.iai.one receiver system.

New receiver:

- `recv_usd_angeledutam_foundation_relay_thread`

Current state:

- `ACTIVE_CONFIRMED`
- `HOLD_NOT_ASSIGNED`
- `INTERNAL_ONLY_UNTIL_FOUNDER_ASSIGNMENT`

This receiver is not attached to any website yet.

## 2. Receiver details

The full account details are stored in the internal receiver registry and runtime source.

Operational receiver identity:

- Payee: `Angel Edu Tam Foundation Inc`
- Provider: `Relay Financial`
- Partner bank: `Thread Bank`
- Currency: `USD`
- Country: `US`

Security note:

- Public registry snapshot redacts account/routing values while the receiver is `HOLD_NOT_ASSIGNED`.
- Full payment target may only render after Founder maps a domain to this receiver.

## 3. Supported rails

Allowed after Founder assignment:

- US ACH
- US domestic wire

Pending:

- international wire via SWIFT

Reason:

- Relay international wire details must be copied from the Relay International Wires dashboard for the selected currency.
- ACH routing details must not be reused as SWIFT details.

## 4. Source check

Checked against Relay documentation:

- account/routing sharing instructions
- ACH receiving instructions
- domestic wire receiving instructions
- international wire receiving instructions
- Thread Bank address guidance

Operational interpretation:

- payer should use the business name exactly as it appears in Relay
- bank name is Thread Bank if required
- bank address is Thread Bank partner-bank address if required
- international wire details remain separate and pending

## 5. Team D instruction

Team D must not assign this receiver to any website until Founder gives:

1. domain
2. currency
3. receiver_id
4. allowed rail
5. payment reference rule
6. support/contact owner

Do not mark any site as `READY_FOR_LIVE` using this receiver until:

- domain assignment exists
- payment block render is verified
- support inbox path exists
- payment reference rule exists
- payment event evidence exists
- pay gate allows live activation

## 6. Team B instruction

Team B must keep the receiver in centralized runtime registry but must not render it publicly until assigned.

Runtime rule now required:

- `HOLD_NOT_ASSIGNED` receiver details must be redacted from public registry snapshot
- full target may render only through resolved domain payment routing after Founder assignment

## 7. Team 1 instruction

This is a receiver registry update only.

It does not unlock:

- pay production gate
- synchronized live
- Team D live activation
- payment email live proof

## 8. Final status

The US Relay / Thread Bank receiver for Angel Edu Tam Foundation Inc is ready for future domain assignment planning.

It is not live for any website yet.
