import { readBoolean, readCsv, readEnum, readNumber, readString } from "./env.js";
export const smtpAuthMethods = ["PLAIN", "LOGIN"];
export const mailStreams = [
    "transactional",
    "system",
    "marketing",
    "alerts"
];
export const queueDrivers = ["redis", "sqs", "pubsub"];
export const credentialStores = ["database", "api_keys"];
export const backendModes = ["stub", "remote"];
export const nodeEnvironments = ["development", "test", "production"];
export const logLevels = ["debug", "info", "warn", "error"];
export function loadMailSmtpConfig(env = process.env) {
    const methods = readCsv(env, "MAIL_SMTP_AUTH_METHODS", "PLAIN,LOGIN").map(normalizeAuthMethod);
    return {
        backend: {
            mode: readEnum(env, "MAIL_SMTP_BACKEND_MODE", backendModes, {
                defaultValue: env.NODE_ENV === "production"
                    ? "remote"
                    : "stub"
            }),
            remote: {
                authPath: readString(env, "MAIL_SMTP_REMOTE_AUTH_PATH", {
                    defaultValue: "auth"
                }),
                auditPath: readString(env, "MAIL_SMTP_REMOTE_AUDIT_PATH", {
                    defaultValue: "audit"
                }),
                baseUrl: readString(env, "MAIL_SMTP_REMOTE_BASE_URL", {
                    defaultValue: "http://localhost:8787/v1/internal/smtp/"
                }),
                mailFromPath: readString(env, "MAIL_SMTP_REMOTE_MAIL_FROM_PATH", {
                    defaultValue: "mail-from"
                }),
                normalizePath: readString(env, "MAIL_SMTP_REMOTE_NORMALIZE_PATH", {
                    defaultValue: "normalize"
                }),
                queuePath: readString(env, "MAIL_SMTP_REMOTE_QUEUE_PATH", {
                    defaultValue: "queue"
                }),
                recipientPath: readString(env, "MAIL_SMTP_REMOTE_RECIPIENT_PATH", {
                    defaultValue: "recipient"
                }),
                timeoutMs: readNumber(env, "MAIL_SMTP_REMOTE_TIMEOUT_MS", {
                    defaultValue: 5000,
                    min: 1
                }),
                token: readString(env, "MAIL_SMTP_REMOTE_TOKEN", {
                    required: false
                })
            }
        },
        auth: {
            credentialStore: readEnum(env, "MAIL_SMTP_CREDENTIAL_STORE", credentialStores, {
                defaultValue: "database"
            }),
            methods,
            requireTlsBeforeAuth: readBoolean(env, "MAIL_SMTP_REQUIRE_TLS_BEFORE_AUTH", true)
        },
        development: {
            authPassword: readString(env, "MAIL_SMTP_DEV_AUTH_PASS", {
                required: false
            }),
            authUser: readString(env, "MAIL_SMTP_DEV_AUTH_USER", {
                required: false
            }),
            allowedSenders: readCsv(env, "MAIL_SMTP_DEV_ALLOWED_SENDERS", "no-reply@tx.iai.one"),
            allowedStreams: readCsv(env, "MAIL_SMTP_DEV_ALLOWED_STREAMS", "transactional").map(normalizeStream),
            credentialId: readString(env, "MAIL_SMTP_DEV_CREDENTIAL_ID", {
                defaultValue: "smtpcred_dev"
            }),
            suppressedRecipients: readCsv(env, "MAIL_SMTP_DEV_SUPPRESSED_RECIPIENTS", "blocked@example.com"),
            verifiedDomains: readCsv(env, "MAIL_SMTP_DEV_VERIFIED_DOMAINS", "tx.iai.one"),
            workspaceId: readString(env, "MAIL_SMTP_DEV_WORKSPACE_ID", {
                defaultValue: "ws_dev"
            })
        },
        observability: {
            bindAddress: readString(env, "MAIL_SMTP_HEALTH_BIND_ADDRESS", {
                defaultValue: "127.0.0.1"
            }),
            healthPort: readNumber(env, "MAIL_SMTP_HEALTH_PORT", {
                defaultValue: 9091,
                min: 1
            }),
            metricsEnabled: readBoolean(env, "MAIL_SMTP_METRICS_ENABLED", true),
            metricsPort: readNumber(env, "MAIL_SMTP_METRICS_PORT", {
                defaultValue: 9090,
                min: 1
            })
        },
        policy: {
            allowHeaderStreamOverride: readBoolean(env, "MAIL_SMTP_ALLOW_HEADER_STREAM_OVERRIDE", true),
            defaultStream: readEnum(env, "MAIL_SMTP_DEFAULT_STREAM", mailStreams, {
                defaultValue: "transactional"
            }),
            enforceVerifiedDomains: readBoolean(env, "MAIL_SMTP_ENFORCE_VERIFIED_DOMAINS", true),
            maxMessageSizeBytes: readNumber(env, "MAIL_SMTP_MAX_MESSAGE_SIZE_BYTES", {
                defaultValue: 20 * 1024 * 1024,
                min: 1
            }),
            maxRecipients: readNumber(env, "MAIL_SMTP_MAX_RECIPIENTS", {
                defaultValue: 100,
                min: 1
            }),
            rejectSuppressedRecipients: readBoolean(env, "MAIL_SMTP_REJECT_SUPPRESSED_RECIPIENTS", true)
        },
        queue: {
            driver: readEnum(env, "MAIL_SMTP_QUEUE_DRIVER", queueDrivers, {
                defaultValue: "redis"
            }),
            name: readString(env, "MAIL_SMTP_QUEUE_NAME", {
                defaultValue: "mail-smtp-submit"
            }),
            url: readString(env, "MAIL_SMTP_QUEUE_URL", {
                defaultValue: readString(env, "MAIL_REDIS_URL", {
                    defaultValue: "redis://localhost:6379/0"
                }) ?? "redis://localhost:6379/0"
            })
        },
        routing: {
            backupRoute: readString(env, "MAIL_SMTP_BACKUP_ROUTE", {
                defaultValue: "transactional_backup"
            }),
            primaryRoute: readString(env, "MAIL_SMTP_PRIMARY_ROUTE", {
                defaultValue: "transactional_primary"
            }),
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
            }),
            bindAddress: readString(env, "MAIL_SMTP_BIND_ADDRESS", {
                defaultValue: "0.0.0.0"
            }),
            hostname: readString(env, "MAIL_SMTP_HOSTNAME", {
                defaultValue: "smtp.mail.iai.one"
            }),
            port: readNumber(env, "MAIL_SMTP_PORT", {
                defaultValue: 587,
                min: 1
            }),
            securePort: readNumber(env, "MAIL_SMTP_SECURE_PORT", {
                required: false,
                min: 1
            })
        },
        storage: {
            databaseUrl: readString(env, "MAIL_DB_URL"),
            dependenciesHealthUrl: readString(env, "MAIL_API_DEPENDENCIES_HEALTH_URL", {
                defaultValue: "http://localhost:8787/v1/health/dependencies"
            }),
            healthUrl: readString(env, "MAIL_API_HEALTH_URL", {
                defaultValue: "http://localhost:8787/v1/health"
            })
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
            }),
            rejectUnauthorized: readBoolean(env, "MAIL_SMTP_TLS_REJECT_UNAUTHORIZED", true),
            startTlsRequired: readBoolean(env, "MAIL_SMTP_STARTTLS_REQUIRED", true)
        }
    };
}
function normalizeAuthMethod(method) {
    const upperMethod = method.toUpperCase();
    if (smtpAuthMethods.includes(upperMethod)) {
        return upperMethod;
    }
    throw new Error(`MAIL_SMTP_AUTH_METHODS contains unsupported value: ${method}`);
}
function normalizeStream(stream) {
    const normalizedStream = stream.toLowerCase();
    if (mailStreams.includes(normalizedStream)) {
        return normalizedStream;
    }
    throw new Error(`MAIL_SMTP stream is unsupported: ${stream}`);
}
//# sourceMappingURL=mail-smtp.js.map