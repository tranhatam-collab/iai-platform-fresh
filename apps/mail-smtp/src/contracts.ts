export type MailStream = "transactional" | "system" | "marketing" | "alerts";

export interface AuthRequest {
  username: string;
  password: string;
  method: string;
  remoteAddress?: string;
  clientHostname?: string;
  secure: boolean;
}

export interface AuthResult {
  credentialId: string;
  workspaceId: string;
  principal: string;
  defaultStream: MailStream;
  allowedStreams: MailStream[];
  senderIdentityId?: string;
}

export type SmtpDecision =
  | {
      ok: true;
      reason?: string;
      smtpCode?: number;
    }
  | {
      ok: false;
      reason: string;
      smtpCode: number;
    };

export interface MailFromContext {
  auth: AuthResult;
  address: string;
  secure: boolean;
  clientHostname?: string;
}

export type MailFromDecision =
  | {
      ok: true;
      reason?: string;
      smtpCode?: number;
      stream?: MailStream;
      senderIdentityId?: string;
    }
  | {
      ok: false;
      reason: string;
      smtpCode: number;
    };

export interface RecipientContext {
  auth: AuthResult;
  stream: MailStream;
  envelopeFrom: string;
  recipient: string;
  recipientCount: number;
}

export interface NormalizationContext {
  auth: AuthResult;
  submittedAt?: string;
  smtpSessionId?: string;
  stream: MailStream;
  traceId?: string;
  envelopeFrom: string;
  recipients: string[];
  rawMime: Buffer;
}

export interface MessageHeaders {
  [headerName: string]: string;
}

export interface MailAddress {
  email: string;
  name?: string;
}

export interface NormalizedAttachment {
  contentDisposition?: string;
  contentId?: string;
  contentTransferEncoding?: string;
  contentType: string;
  filename?: string;
  inline: boolean;
  partId: string;
  sizeBytes: number;
}

export interface NormalizedMessage {
  attachments: NormalizedAttachment[];
  bcc: MailAddress[];
  cc: MailAddress[];
  workspaceId: string;
  credentialId: string;
  from?: MailAddress;
  headerMessageId?: string;
  html?: string;
  messageId: string;
  messageIdempotencyKey: string;
  replyTo?: MailAddress;
  senderIdentityId?: string;
  smtpSessionId: string;
  source: "smtp";
  stream: MailStream;
  submittedAt: string;
  text?: string;
  to: MailAddress[];
  traceId: string;
  envelopeFrom: string;
  headerFrom?: string;
  headers: MessageHeaders;
  recipients: string[];
  rawMime: Buffer;
  subject?: string;
}

export interface QueuePublishResult {
  messageEventId?: string;
  messageId: string;
  providerRoute?: string;
  queuedAt: string;
  smtpSessionId?: string;
  traceId?: string;
}

export interface AuditEvent {
  actorIdentifier: string;
  actorType: "smtp-credential" | "system";
  action: string;
  targetType: string;
  targetId?: string;
  workspaceId?: string;
  metadata?: Record<string, unknown>;
}

export interface DependencyCheck {
  detail?: string;
  name: string;
  ok: boolean;
}

export interface DependencyHealthResult {
  checks: DependencyCheck[];
  mode: string;
  ok: boolean;
}

export interface MailSmtpDependencies {
  authenticate(input: AuthRequest): Promise<AuthResult>;
  authorizeMailFrom(input: MailFromContext): Promise<MailFromDecision>;
  authorizeRecipient(input: RecipientContext): Promise<SmtpDecision>;
  healthcheck(): Promise<DependencyHealthResult>;
  normalizeMessage(input: NormalizationContext): Promise<NormalizedMessage>;
  publishToQueue(input: NormalizedMessage): Promise<QueuePublishResult>;
  recordAudit(event: AuditEvent): Promise<void>;
}

export interface RuntimeSessionState {
  auth?: AuthResult;
  smtpSessionId: string;
  submittedAt?: string;
  stream?: MailStream;
  senderIdentityId?: string;
  traceId?: string;
  envelopeFrom?: string;
  recipients: string[];
}
