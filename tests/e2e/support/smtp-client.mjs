/**
 * Minimal line-oriented SMTP client for process-level tests.
 *
 * It talks to a real SMTP listener over a TCP socket, optionally upgrading the
 * connection with STARTTLS (self-signed certificates are accepted because the
 * servers under test generate their own). It deliberately exposes raw replies
 * so tests can assert on exact reply codes.
 */
import net from "node:net";
import tls from "node:tls";

export class SmtpClient {
  constructor(socket) {
    this.socket = socket;
    this.buffer = "";
    this.waiters = [];
    this.error = null;
    this.closed = false;
    this.attach(socket);
  }

  attach(socket) {
    socket.setEncoding("utf8");
    socket.on("data", (chunk) => {
      this.buffer += chunk;
      this.flush();
    });
    socket.on("error", (error) => {
      this.error = error;
      this.flush();
    });
    socket.on("close", () => {
      this.closed = true;
      this.flush();
    });
  }

  static async connect(port, { host = "127.0.0.1", timeoutMs = 5000 } = {}) {
    const socket = await new Promise((resolve, reject) => {
      const candidate = net.connect(port, host);
      const timer = setTimeout(() => {
        candidate.destroy();
        reject(new Error(`smtp connect to ${host}:${port} timed out`));
      }, timeoutMs);
      candidate.once("connect", () => {
        clearTimeout(timer);
        resolve(candidate);
      });
      candidate.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
    const client = new SmtpClient(socket);
    client.greeting = await client.readReply(timeoutMs);
    return client;
  }

  // Resolve waiters whenever new data, an error or a close arrives.
  flush() {
    while (this.waiters.length > 0) {
      const reply = this.takeReply();
      if (reply) {
        this.waiters.shift().resolve(reply);
        continue;
      }
      if (this.error || this.closed) {
        const waiter = this.waiters.shift();
        waiter.reject(this.error ?? new Error(`smtp connection closed before a reply (buffer: ${JSON.stringify(this.buffer)})`));
        continue;
      }
      break;
    }
  }

  // A reply is complete when a line "NNN text" (no dash after the code) arrives.
  takeReply() {
    const lines = this.buffer.split("\r\n");
    // last element is an incomplete line (possibly empty)
    for (let index = 0; index < lines.length - 1; index += 1) {
      const match = /^(\d{3})([ -])/.exec(lines[index]);
      if (match && match[2] === " ") {
        const replyLines = lines.slice(0, index + 1);
        this.buffer = lines.slice(index + 1).join("\r\n");
        return {
          code: Number(match[1]),
          lines: replyLines,
          text: replyLines.map((line) => line.slice(4)).join("\n")
        };
      }
    }
    return null;
  }

  readReply(timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      const waiter = { resolve: undefined, reject: undefined };
      const timer = setTimeout(() => {
        this.waiters = this.waiters.filter((entry) => entry !== waiter);
        reject(new Error(`smtp reply timed out (buffer: ${JSON.stringify(this.buffer)})`));
      }, timeoutMs);
      waiter.resolve = (reply) => {
        clearTimeout(timer);
        resolve(reply);
      };
      waiter.reject = (error) => {
        clearTimeout(timer);
        reject(error);
      };
      this.waiters.push(waiter);
      this.flush();
    });
  }

  async command(line, timeoutMs = 5000) {
    this.socket.write(`${line}\r\n`);
    return await this.readReply(timeoutMs);
  }

  /** EHLO then STARTTLS then EHLO again. Returns the post-TLS EHLO reply. */
  async startTls(clientName = "e2e.local") {
    const ehlo = await this.command(`EHLO ${clientName}`);
    if (!/STARTTLS/i.test(ehlo.text)) {
      throw new Error(`server did not advertise STARTTLS: ${ehlo.text}`);
    }
    const ready = await this.command("STARTTLS");
    if (ready.code !== 220) {
      throw new Error(`STARTTLS refused: ${ready.code} ${ready.text}`);
    }
    this.socket.removeAllListeners("data");
    this.socket.removeAllListeners("error");
    this.socket.removeAllListeners("close");
    this.buffer = "";
    const secure = await new Promise((resolve, reject) => {
      const upgraded = tls.connect({ socket: this.socket, rejectUnauthorized: false, servername: "localhost" });
      upgraded.once("secureConnect", () => resolve(upgraded));
      upgraded.once("error", reject);
    });
    this.socket = secure;
    this.attach(secure);
    return await this.command(`EHLO ${clientName}`);
  }

  /** AUTH PLAIN with an inline initial response. */
  async authPlain(username, password) {
    const token = Buffer.from(`\u0000${username}\u0000${password}`, "utf8").toString("base64");
    return await this.command(`AUTH PLAIN ${token}`);
  }

  /** Send DATA and the message body. Returns { start, final } replies. */
  async sendData(body, timeoutMs = 8000) {
    const start = await this.command("DATA");
    if (start.code !== 354) {
      return { start, final: null };
    }
    const normalized = body.replace(/\r?\n/g, "\r\n");
    // dot-stuff lines that start with "."
    const stuffed = normalized.replace(/^\./gm, "..");
    this.socket.write(`${stuffed}\r\n.\r\n`);
    const final = await this.readReply(timeoutMs);
    return { start, final };
  }

  close() {
    try {
      this.socket.destroy();
    } catch {
      // already closed
    }
  }
}
