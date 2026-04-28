# MAIL_IAI_ONE_DATABASE_SCHEMA_FINAL

IAI Mail Delivery & Automation Layer

Database Schema v1  
Version: 1.0 - Production Lock

## 1. Muc tieu

Schema nay phuc vu:
- outbound send
- inbound receive
- template/version
- automation
- provider routing
- suppression
- bounce/complaint
- deliverability checks
- audit va analytics

## 2. Nguyen tac thiet ke

1. Moi du lieu tenant phai gan `workspace_id`.
2. Tach `messages` khoi `delivery_attempts`.
3. Tach `templates` khoi `template_versions`.
4. Tach `domains` khoi `sender_identities`.
5. Event timeline phai duoc luu rieng.
6. Provider-specific logic khong duoc troi vao bang core.
7. Idempotency phai co ngay tu dau.

## 3. Nhom bang chinh

### Tenant va auth
- `workspaces`
- `users`
- `workspace_members`
- `api_keys`

### Domain va sender
- `domains`
- `domain_dns_checks`
- `dkim_keys`
- `sender_identities`

### Templates
- `templates`
- `template_versions`

### Message va delivery
- `messages`
- `message_recipients`
- `message_attachments`
- `message_headers`
- `delivery_attempts`
- `message_events`

### Provider va routing
- `provider_configs`
- `provider_routes`

### Reputation va suppression
- `suppressions`
- `unsubscribes`
- `bounces`
- `complaints`

### Inbound
- `inbound_messages`
- `inbound_attachments`
- `inbound_routes`

### Automation va events
- `automations`
- `automation_actions`
- `ingested_events`
- `automation_runs`

### Ops va audit
- `webhooks_inbox`
- `audit_logs`
- `service_health_snapshots`

## 4. Enum chuan

### Stream
- `transactional`
- `system`
- `marketing`
- `alerts`

### Message status
- `queued`
- `processing`
- `provider_accepted`
- `delivered`
- `deferred`
- `bounced`
- `complained`
- `suppressed`
- `failed`
- `cancelled`

### Provider type
- `selfhosted`
- `smtp`
- `ses`
- `sendgrid`
- `mailgun`
- `brevo`
- `custom`

### Domain verification
- `pending`
- `verified`
- `failed`
- `suspended`

## 5. Bang cot loi

### `workspaces`
- `id`
- `slug`
- `name`
- `status`
- `plan`
- `default_locale`
- `settings_json`
- `created_at`
- `updated_at`

### `api_keys`
- `id`
- `workspace_id`
- `name`
- `key_prefix`
- `key_hash`
- `status`
- `scopes_json`
- `last_used_at`
- `expires_at`
- `created_at`
- `updated_at`

### `domains`
- `id`
- `workspace_id`
- `domain`
- `type`
- `default_stream`
- `verification_status`
- `is_primary`
- `spf_status`
- `dkim_status`
- `dmarc_status`
- `mx_status`
- `rdns_status`
- `last_verified_at`
- `settings_json`
- `created_at`
- `updated_at`

Unique:
- `(workspace_id, domain)`

### `domain_dns_checks`
- `id`
- `domain_id`
- `spf_status`
- `dkim_status`
- `dmarc_status`
- `mx_status`
- `rdns_status`
- `overall_status`
- `raw_result_json`
- `checked_at`

### `dkim_keys`
- `id`
- `domain_id`
- `selector`
- `public_key`
- `private_key_encrypted`
- `algorithm`
- `key_size`
- `status`
- `rotated_at`
- `created_at`
- `updated_at`

### `sender_identities`
- `id`
- `workspace_id`
- `domain_id`
- `email`
- `name`
- `allowed_streams_json`
- `status`
- `is_default`
- `reply_to_email`
- `reply_to_name`
- `created_at`
- `updated_at`

Unique:
- `(workspace_id, email)`

### `templates`
- `id`
- `workspace_id`
- `template_key`
- `name`
- `description`
- `category`
- `status`
- `active_version`
- `created_by_user_id`
- `created_at`
- `updated_at`

### `template_versions`
- `id`
- `template_id`
- `version`
- `locales_json`
- `streams_json`
- `render_engine`
- `status`
- `published_at`
- `created_by_user_id`
- `created_at`

Unique:
- `(template_id, version)`

### `provider_configs`
- `id`
- `workspace_id`
- `provider_type`
- `name`
- `config_json_encrypted`
- `status`
- `is_shared_system`
- `created_at`
- `updated_at`

### `provider_routes`
- `id`
- `workspace_id`
- `route_name`
- `stream`
- `priority`
- `provider_config_id`
- `status`
- `failover_route_id`
- `conditions_json`
- `created_at`
- `updated_at`

### `messages`
- `id`
- `workspace_id`
- `message_idempotency_key`
- `stream`
- `sender_identity_id`
- `from_email`
- `from_name`
- `reply_to_email`
- `reply_to_name`
- `subject`
- `html_body`
- `text_body`
- `template_id`
- `template_version`
- `locale`
- `status`
- `provider_route_id`
- `metadata_json`
- `tags_json`
- `headers_json`
- `scheduled_at`
- `queued_at`
- `sent_at`
- `last_event_at`
- `created_at`
- `updated_at`

Partial unique:
- `(workspace_id, message_idempotency_key)` khi key khong null

### `message_recipients`
- `id`
- `message_id`
- `recipient_type`
- `email`
- `name`
- `status`
- `suppression_reason`
- `delivery_status`
- `variables_json`
- `created_at`
- `updated_at`

### `message_attachments`
- `id`
- `message_id`
- `filename`
- `content_type`
- `size_bytes`
- `storage_key`
- `content_base64_inline`
- `scan_status`
- `created_at`

### `delivery_attempts`
- `id`
- `message_id`
- `recipient_id`
- `provider_route_id`
- `provider_type`
- `provider_message_id`
- `attempt_number`
- `status`
- `response_code`
- `response_message`
- `started_at`
- `finished_at`
- `next_retry_at`
- `error_class`
- `raw_response_json`
- `created_at`

### `message_events`
- `id`
- `workspace_id`
- `message_id`
- `recipient_id`
- `delivery_attempt_id`
- `event_type`
- `provider_type`
- `provider_message_id`
- `payload_json`
- `occurred_at`
- `created_at`

### `suppressions`
- `id`
- `workspace_id`
- `email`
- `reason`
- `scope`
- `source`
- `notes`
- `created_at`
- `expires_at`
- `removed_at`

### `unsubscribes`
- `id`
- `workspace_id`
- `email`
- `stream`
- `list_key`
- `source`
- `ip_address`
- `user_agent`
- `created_at`

### `bounces`
- `id`
- `workspace_id`
- `message_id`
- `recipient_id`
- `provider_type`
- `provider_message_id`
- `email`
- `bounce_type`
- `bounce_subtype`
- `reason`
- `raw_payload_json`
- `occurred_at`
- `created_at`

### `complaints`
- `id`
- `workspace_id`
- `message_id`
- `recipient_id`
- `provider_type`
- `provider_message_id`
- `email`
- `feedback_type`
- `reason`
- `raw_payload_json`
- `occurred_at`
- `created_at`

### `inbound_messages`
- `id`
- `workspace_id`
- `domain_id`
- `to_email`
- `from_email`
- `from_name`
- `subject`
- `html_body`
- `text_body`
- `raw_storage_key`
- `headers_json`
- `parsed_status`
- `route_status`
- `spam_score`
- `auth_results_json`
- `received_at`
- `created_at`

### `inbound_routes`
- `id`
- `workspace_id`
- `route_key`
- `match_json`
- `action_json`
- `priority`
- `status`
- `created_at`
- `updated_at`

### `automations`
- `id`
- `workspace_id`
- `automation_key`
- `name`
- `description`
- `trigger_type`
- `trigger_config_json`
- `status`
- `created_by_user_id`
- `created_at`
- `updated_at`

### `automation_actions`
- `id`
- `automation_id`
- `step_order`
- `action_type`
- `action_config_json`
- `delay_seconds`
- `created_at`

### `ingested_events`
- `id`
- `workspace_id`
- `event_name`
- `external_event_id`
- `subject_type`
- `subject_id`
- `data_json`
- `metadata_json`
- `occurred_at`
- `created_at`

Unique:
- `(workspace_id, external_event_id)` khi key khong null

### `automation_runs`
- `id`
- `workspace_id`
- `automation_id`
- `ingested_event_id`
- `status`
- `current_step`
- `result_json`
- `error_message`
- `queued_at`
- `started_at`
- `completed_at`
- `created_at`

### `webhooks_inbox`
- `id`
- `provider_type`
- `workspace_id`
- `headers_json`
- `payload_json`
- `signature_valid`
- `processed_status`
- `received_at`
- `processed_at`
- `created_at`

### `audit_logs`
- `id`
- `workspace_id`
- `user_id`
- `actor_type`
- `actor_identifier`
- `action`
- `target_type`
- `target_id`
- `changes_json`
- `ip_address`
- `user_agent`
- `created_at`

## 6. Index bat buoc

- `messages(workspace_id, status, created_at desc)`
- `message_events(message_id, occurred_at)`
- `delivery_attempts(message_id, status, next_retry_at)`
- `suppressions(workspace_id, email)`
- `bounces(email, occurred_at desc)`
- `complaints(email, occurred_at desc)`
- `domains(workspace_id, verification_status)`
- `provider_routes(stream, priority, status)`
- `automation_runs(automation_id, status, queued_at)`

## 7. Business rules bat buoc

1. `from_email` phai thuoc sender identity active.
2. Sender identity phai thuoc domain da verify.
3. `stream` phai nam trong allowlist cua sender.
4. Khong tao delivery attempt cho recipient dang bi suppress.
5. Hard bounce va complaint phai tao suppression.
6. Mot template chi co mot active version logic.
7. Marketing unsubscribe phai block truoc queue.

## 8. Kieu du lieu khuyen nghi

### PostgreSQL production
- `UUID` hoac `TEXT` neu dung ULID/KSUID
- `TIMESTAMPTZ`
- `JSONB`
- partial unique index cho idempotency

### SQLite/D1 MVP
- `TEXT` cho id
- ISO timestamp hoac epoch ms thong nhat
- tranh query JSON qua sau

## 9. Thu tu migration

1. tenant/auth
2. domain/sender
3. template
4. provider
5. messages
6. delivery/events
7. suppression/reputation
8. inbound
9. automation
10. audit/ops

## 10. Definition of Done

Database schema dat khi:
- tao duoc bang cot loi
- co foreign key va unique dung
- index dung cho query chinh
- insert duoc full flow: workspace -> domain -> sender -> template -> message -> recipient -> delivery -> event -> suppression
