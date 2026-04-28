# mail-worker

Queue consumer skeleton for `mail.iai.one` outbound delivery.

Current scope:
- accept the shared `MailQueueSubmitPayload` contract from `@iai/mail-core`
- choose an active provider route by workspace, stream, and priority
- expose a provider adapter interface for `ses`, `sendgrid`, `smtp`, and `selfhosted`
- generate deterministic delivery-attempt and message-timeline artifacts for `provider_accepted`, `deferred`, and `failed`
- ship a stub provider adapter so route selection and retry semantics can be tested before queue infra lands

What is intentionally still a stub:
- real queue consumer wiring
- persistence into `delivery_attempts` and post-queue `message_events`
- provider SDK implementations
- failover across multiple routes in one processing pass
- webhook feedback loops for `delivered`, `bounced`, and `complained`

Next implementation targets:
1. connect the runtime to the real queue transport used by `mail.iai.one`
2. persist attempt and timeline artifacts into `delivery_attempts` and `message_events`
3. implement `ses` and `sendgrid` adapters behind the shipped interface
4. add webhook normalization so downstream events append to the same `traceId` and `messageId`
