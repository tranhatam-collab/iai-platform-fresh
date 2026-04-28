import { readBoolean, readCsv, readEnum, readNumber, readString } from "./env.js";

export const smtpAuthMethods = ["PLAIN", "LOGIN"] as const;
export const mailStreams = [
  "transactional",
  "system",
  "marketing",
  "alerts"
] as const;
export const queueDrivers = ["redis", "sqs", "pubsub"] as const;
export const credentialStores = ["database", "api_keys"] as const;
export const backendModes = ["stub", "remote"] as const;
export const nodeEnvironments = ["development", "test", "production"] as const;
export const logLevels = ["debug", "info", "warn", "error"] as const;

export interface MailSmtpConfig {
  runtime: {
    appName: "mail-smtp";
    logLevel: (typeof logLevels)[number];
    nodeEnv: (typeof nodeEnvironments)[number];
  };
  server: {
    banner: string;
    bindAddress: string;
    hostname: string;
    port: number;
    securePort?: number;
  };
  tls: {
    caPath?: string;
    certPath?: string;
    keyPath?: string;
    minVersion: string;
    rejectUnauthorized: boolean;
    startTlsRequired: boolean;
  };
  backend: {
    mode: (typeof backendModes)[number];
    remote: {
      authPath: string;
      auditPath: string;
      baseUrl: string;
      mailFromPath: string;
      normalizePath: string;
      queuePath: string;
      recipientPath: string;
      timeoutMs: number;
      token?: string;
    };
  };
  auth: {
    credentialStore: (typeof credentialStores)[number];
    methods: (typeof smtpAuthMethods)[number][];
    requireTlsBeforeAuth: boolean;
  };
  development: {
    authPassword?: string;
    authUser?: string;
    allowedSenders: string[];
    allowedStreams: (typeof mailStreams)[number][];
    credentialId: string;
    suppressedRecipients: string[];
    verifiedDomains: string[];
    workspaceId: string;
  };
  policy: {
    allowHeaderStreamOverride: boolean;
    defaultStream: (typeof mailStreams)[number];
    enforceVerifiedDomains: boolean;
    maxMessageSizeBytes: number;
    maxRecipients: number;
    rejectSuppressedRecipients: boolean;
  };
  queue: {
    driver: (typeof queueDrivers)[number];
    name: string;
    url: string;
  };
  storage: {
    databaseUrl: string;
    dependenciesHealthUrl: string;
    healthUrl: string;
  };
  routing: {
    backupRoute: string;
    primaryRoute: string;
    providerDefault?: string;
  };
  observability: {
    bindAddress: string;
    healthPort: number;
    metricsEnabled: boolean;
    metricsPort: number;
  };
}

export function loadMailSmtpConfig(
  env: NodeJS.ProcessEnv = process.env
): MailSmtpConfig {
  const methods = readCsv(env, "MAIL_SMTP_AUTH_METHODS", "PLAIN,LOGIN").map(
    normalizeAuthMethod
  );

  return {
    backend: {
      mode: readEnum(env, "MAIL_SMTP_BACKEND_MODE", backendModes, {
        defaultValue:
          env.NODE_ENV === "production"
            ? "remote"
            : "stub"
      }),
      remote: {
        authPath: readString(env, "MAIL_SMTP_REMOTE_AUTH_PATH", {
          defaultValue: "auth"
        }) as string,
        auditPath: readString(env, "MAIL_SMTP_REMOTE_AUDIT_PATH", {
          defaultValue: "audit"
        }) as string,
        baseUrl: readString(env, "MAIL_SMTP_REMOTE_BASE_URL", {
          defaultValue: "http://localhost:8787/v1/internal/smtp/"
        }) as string,
        mailFromPath: readString(env, "MAIL_SMTP_REMOTE_MAIL_FROM_PATH", {
          defaultValue: "mail-from"
        }) as string,
        normalizePath: readString(env, "MAIL_SMTP_REMOTE_NORMALIZE_PATH", {
          defaultValue: "normalize"
        }) as string,
        queuePath: readString(env, "MAIL_SMTP_REMOTE_QUEUE_PATH", {
          defaultValue: "queue"
        }) as string,
        recipientPath: readString(env, "MAIL_SMTP_REMOTE_RECIPIENT_PATH", {
          defaultValue: "recipient"
        }) as string,
        timeoutMs: readNumber(env, "MAIL_SMTP_REMOTE_TIMEOUT_MS", {
          defaultValue: 5000,
          min: 1
        }) as number,
        token: readString(env, "MAIL_SMTP_REMOTE_TOKEN", {
          required: false
        })
      }
    },
    auth: {
      credentialStore: readEnum(
        env,
        "MAIL_SMTP_CREDENTIAL_STORE",
        credentialStores,
        {
          defaultValue: "database"
        }
      ),
      methods,
      requireTlsBeforeAuth: readBoolean(
        env,
        "MAIL_SMTP_REQUIRE_TLS_BEFORE_AUTH",
        true
      )
    },
    development: {
      authPassword: readString(env, "MAIL_SMTP_DEV_AUTH_PASS", {
        required: false
      }),
      authUser: readString(env, "MAIL_SMTP_DEV_AUTH_USER", {
        required: false
      }),
      allowedSenders: readCsv(
        env,
        "MAIL_SMTP_DEV_ALLOWED_SENDERS",
        "no-reply@tx.iai.one"
      ),
      allowedStreams: readCsv(
        env,
        "MAIL_SMTP_DEV_ALLOWED_STREAMS",
        "transactional"
      ).map(normalizeStream),
      credentialId: readString(env, "MAIL_SMTP_DEV_CREDENTIAL_ID", {
        defaultValue: "smtpcred_dev"
      }) as string,
      suppressedRecipients: readCsv(
        env,
        "MAIL_SMTP_DEV_SUPPRESSED_RECIPIENTS",
        "blocked@example.com"
      ),
      verifiedDomains: readCsv(
        env,
        "MAIL_SMTP_DEV_VERIFIED_DOMAINS",
        "tx.iai.one"
      ),
      workspaceId: readString(env, "MAIL_SMTP_DEV_WORKSPACE_ID", {
        defaultValue: "ws_dev"
      }) as string
    },
    observability: {
      bindAddress: readString(env, "MAIL_SMTP_HEALTH_BIND_ADDRESS", {
        defaultValue: "127.0.0.1"
      }) as string,
      healthPort: readNumber(env, "MAIL_SMTP_HEALTH_PORT", {
        defaultValue: 9091,
        min: 1
      }) as number,
      metricsEnabled: readBoolean(env, "MAIL_SMTP_METRICS_ENABLED", true),
      metricsPort: readNumber(env, "MAIL_SMTP_METRICS_PORT", {
        defaultValue: 9090,
        min: 1
      }) as number
    },
    policy: {
      allowHeaderStreamOverride: readBoolean(
        env,
        "MAIL_SMTP_ALLOW_HEADER_STREAM_OVERRIDE",
        true
      ),
      defaultStream: readEnum(env, "MAIL_SMTP_DEFAULT_STREAM", mailStreams, {
        defaultValue: "transactional"
      }),
      enforceVerifiedDomains: readBoolean(
        env,
        "MAIL_SMTP_ENFORCE_VERIFIED_DOMAINS",
        true
      ),
      maxMessageSizeBytes: readNumber(
        env,
        "MAIL_SMTP_MAX_MESSAGE_SIZE_BYTES",
        {
          defaultValue: 20 * 1024 * 1024,
          min: 1
        }
      ) as number,
      maxRecipients: readNumber(env, "MAIL_SMTP_MAX_RECIPIENTS", {
        defaultValue: 100,
        min: 1
      }) as number,
      rejectSuppressedRecipients: readBoolean(
        env,
        "MAIL_SMTP_REJECT_SUPPRESSED_RECIPIENTS",
        true
      )
    },
    queue: {
      driver: readEnum(env, "MAIL_SMTP_QUEUE_DRIVER", queueDrivers, {
        defaultValue: "redis"
      }),
      name: readString(env, "MAIL_SMTP_QUEUE_NAME", {
        defaultValue: "mail-smtp-submit"
      }) as string,
      url: readString(env, "MAIL_SMTP_QUEUE_URL", {
        defaultValue:
          readString(env, "MAIL_REDIS_URL", {
            defaultValue: "redis://localhost:6379/0"
          }) ?? "redis://localhost:6379/0"
      }) as string
    },
    routing: {
      backupRoute: readString(env, "MAIL_SMTP_BACKUP_ROUTE", {
        defaultValue: "transactional_backup"
      }) as string,
      primaryRoute: readString(env, "MAIL_SMTP_PRIMARY_ROUTE", {
        defaultValue: "transactional_primary"
      }) as string,
      providerDefault: readString(env, "MAIL_PROVIDER_DEFAULT", {
        required: false
      })
    },
    runtime: {
      appName: "mail-smtp",
      logLevel: readEnum(env, "LOG_LEVEL", logLevels, {
        defaultValue: "info"
      }),
      nodeEnv: readEnum(env, "NODE_ENV", nodeEnvironments, {
        defaultValue: "development"
      })
    },
    server: {
      banner: readString(env, "MAIL_SMTP_BANNER", {
        defaultValue: "IAI Mail SMTP Submission"
      }) as string,
      bindAddress: readString(env, "MAIL_SMTP_BIND_ADDRESS", {
        defaultValue: "0.0.0.0"
      }) as string,
      hostname: readString(env, "MAIL_SMTP_HOSTNAME", {
        defaultValue: "smtp.mail.iai.one"
      }) as string,
      port: readNumber(env, "MAIL_SMTP_PORT", {
        defaultValue: 587,
        min: 1
      }) as number,
      securePort: readNumber(env, "MAIL_SMTP_SECURE_PORT", {
        required: false,
        min: 1
      })
    },
    storage: {
      databaseUrl: readString(env, "MAIL_DB_URL") as string,
      dependenciesHealthUrl: readString(
        env,
        "MAIL_API_DEPENDENCIES_HEALTH_URL",
        {
          defaultValue: "http://localhost:8787/v1/health/dependencies"
        }
      ) as string,
      healthUrl: readString(env, "MAIL_API_HEALTH_URL", {
        defaultValue: "http://localhost:8787/v1/health"
      }) as string
    },
    tls: {
      caPath: readString(env, "MAIL_SMTP_TLS_CA_PATH", {
        required: false
      }),
      certPath: readString(env, "MAIL_SMTP_TLS_CERT_PATH", {
        required: false
      }),
      keyPath: readString(env, "MAIL_SMTP_TLS_KEY_PATH", {
        required: false
      }),
      minVersion: readString(env, "MAIL_SMTP_TLS_MIN_VERSION", {
        defaultValue: "TLSv1.2"
      }) as string,
      rejectUnauthorized: readBoolean(
        env,
        "MAIL_SMTP_TLS_REJECT_UNAUTHORIZED",
        true
      ),
      startTlsRequired: readBoolean(env, "MAIL_SMTP_STARTTLS_REQUIRED", true)
    }
  };
}

function normalizeAuthMethod(method: string) {
  const upperMethod = method.toUpperCase();
  if (smtpAuthMethods.includes(upperMethod as (typeof smtpAuthMethods)[number])) {
    return upperMethod as (typeof smtpAuthMethods)[number];
  }

  throw new Error(
    `MAIL_SMTP_AUTH_METHODS contains unsupported value: ${method}`
  );
}

function normalizeStream(stream: string) {
  const normalizedStream = stream.toLowerCase();
  if (mailStreams.includes(normalizedStream as (typeof mailStreams)[number])) {
    return normalizedStream as (typeof mailStreams)[number];
  }

  throw new Error(`MAIL_SMTP stream is unsupported: ${stream}`);
}
