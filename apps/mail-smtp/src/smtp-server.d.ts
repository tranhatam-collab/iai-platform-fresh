declare module "smtp-server" {
  import type { Readable } from "node:stream";

  export interface SMTPServerAddress {
    address: string;
    args?: Record<string, string | number | boolean>;
  }

  export interface SMTPServerAuthentication {
    method: string;
    username: string;
    password: string;
  }

  export interface SMTPServerSession {
    id?: string;
    clientHostname?: string;
    envelope: {
      mailFrom?: SMTPServerAddress;
      rcptTo: SMTPServerAddress[];
    };
    remoteAddress?: string;
    secure: boolean;
  }

  export interface SMTPServerOptions {
    authMethods?: string[];
    authOptional?: boolean;
    banner?: string;
    ca?: Buffer[];
    cert?: Buffer;
    hideSTARTTLS?: boolean;
    key?: Buffer;
    logger?: boolean;
    minVersion?: string;
    onAuth?(
      auth: SMTPServerAuthentication,
      session: SMTPServerSession,
      callback: (error: Error | null, response?: { user?: unknown } | null) => void
    ): void;
    onClose?(session: SMTPServerSession): void;
    onConnect?(
      session: SMTPServerSession,
      callback: (error: Error | null) => void
    ): void;
    onData?(
      stream: Readable,
      session: SMTPServerSession,
      callback: (error: Error | null, response?: string) => void
    ): void;
    onMailFrom?(
      address: SMTPServerAddress,
      session: SMTPServerSession,
      callback: (error: Error | null) => void
    ): void;
    onRcptTo?(
      address: SMTPServerAddress,
      session: SMTPServerSession,
      callback: (error: Error | null) => void
    ): void;
    secure?: boolean;
    size?: number;
  }

  export class SMTPServer {
    constructor(options: SMTPServerOptions);
    close(callback?: (error?: Error) => void): void;
    listen(port: number, host?: string, callback?: () => void): void;
    on(event: "error", listener: (error: Error) => void): this;
  }
}
