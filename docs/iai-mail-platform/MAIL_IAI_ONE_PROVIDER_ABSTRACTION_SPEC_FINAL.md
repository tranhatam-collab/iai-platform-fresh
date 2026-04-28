# MAIL_IAI_ONE_PROVIDER_ABSTRACTION_SPEC_FINAL

IAI Mail Delivery & Automation Layer

Provider Abstraction Specification v1  
Version: 1.0 - Production Lock

## 1. Muc tieu

Lop provider abstraction ton tai de IAI so huu:
- request format
- route selection
- retry/failover policy
- normalized event model
- provider swap khong doi app contract

## 2. Provider v1

- `selfhosted`
- `smtp`
- `ses`
- `sendgrid`

Co the mo rong:
- `mailgun`
- `brevo`
- `custom`

## 3. Adapter interface bat buoc

Moi provider adapter phai implement toi thieu:
- `validateConfig()`
- `send(message, context)`
- `normalizeWebhook(payload, headers)`
- `healthcheck()`
- `classifyError(response)`
- `supports(feature)`

## 4. Input contract chung

Adapter nhan mot normalized payload gom:
- `message_id`
- `stream`
- `from`
- `reply_to`
- `recipients`
- `subject`
- `html`
- `text`
- `attachments`
- `headers`
- `tags`
- `metadata`
- `tracking_policy`

Adapter khong duoc nhan truc tiep payload goc tu app.

## 5. Output contract chung

Moi lan gui phai tra ve:
- `accepted` boolean
- `provider_message_id`
- `provider_response_code`
- `provider_response_message`
- `retryable`
- `raw_response`

## 6. Normalized event model

Moi provider webhook phai duoc map ve:
- `queued`
- `provider_accepted`
- `delivered`
- `deferred`
- `bounced`
- `complained`
- `opened`
- `clicked`
- `failed`

Moi event bat buoc co:
- `provider`
- `provider_message_id`
- `message_id`
- `recipient`
- `occurred_at`
- `payload`

## 7. Route selection

Provider routing quyet dinh dua tren:
- stream
- workspace
- domain
- country rule
- max volume
- health score
- cost policy
- backup availability

Logic chon route:
1. Loc route active
2. Loc route hop stream
3. Kiem tra conditions
4. Sap xep theo `priority`
5. Chon route health cao nhat trong nhom uu tien
6. Neu loi retryable -> failover

## 8. Failover policy

### Retryable
- timeout
- 429
- 5xx
- transient SMTP errors

### Non-retryable
- sender not allowed
- template render failure
- recipient invalid
- message policy reject

Neu retryable:
- co the retry cung provider
- hoac failover sang route du phong theo stream policy

## 9. Health scoring

Moi route nen co health score dua tren:
- success rate
- latency
- bounce spike
- complaint spike
- webhook freshness
- credential validity

Neu health score duoi nguong:
- route sang `degraded`
- router giam uu tien hoac cat route

## 10. Secret va config

Secrets luu trong `provider_configs`, dang encrypted hoac ref qua secret manager.

Config bat buoc tach:
- public metadata
- encrypted secret
- feature flags
- rate limits
- region

## 11. Feature support matrix

Moi adapter phai khai bao:
- attachment support
- open tracking support
- click tracking support
- template API native support
- suppression sync support
- inbound webhook support

Core runtime khong duoc gia dinh provider nao cung ho tro moi feature.

## 12. Provider-specific note day 1

### SendGrid
- setup nhanh
- phu hop rollout nhanh
- API key auth

### SES
- rat manh cho scale
- phu hop transactional va system
- can setup region va credential ro rang

### Selfhosted
- chi nen la mot route duoc warmup va monitor ky
- khong duoc coi la "default deliverability guarantee"

### SMTP relay generic
- dung cho backup hoac external integration
- can test deliverability rieng

## 13. Test adapter bat buoc

Moi adapter phai co:
- config validation test
- send success test
- timeout/retry test
- webhook normalization test
- bounce/complaint mapping test

## 14. Definition of Done

Provider abstraction dat khi:
- app chi biet mot request model chung
- doi duoc provider ma khong sua app contract
- webhook provider duoc normalize
- failover va retry co quy tac ro
- secrets duoc cach ly khoi core business model
