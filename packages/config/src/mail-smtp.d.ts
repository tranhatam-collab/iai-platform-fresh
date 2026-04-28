export declare const smtpAuthMethods: readonly ["PLAIN", "LOGIN"];
export declare const mailStreams: readonly ["transactional", "system", "marketing", "alerts"];
export declare const queueDrivers: readonly ["redis", "sqs", "pubsub"];
export declare const credentialStores: readonly ["database", "api_keys"];
export declare const backendModes: readonly ["stub", "remote"];
export declare const nodeEnvironments: readonly ["development", "test", "production"];
export declare const logLevels: readonly ["debug", "info", "warn", "error"];
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
export declare function loadMailSmtpConfig(env?: NodeJS.ProcessEnv): MailSmtpConfig;
