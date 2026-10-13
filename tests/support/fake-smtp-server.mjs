// A small SMTP server for tests. It listens on 127.0.0.1 only, never relays anything and keeps a record of what a
// client sent, so tests can say what reached the "relay" and what did not.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import tls from "node:tls";

/** A throw-away self-signed certificate for 127.0.0.1 and localhost (needs the openssl command). */
export function createTestCertificate() {
  const dir = mkdtempSync(path.join(tmpdir(), "iai-fake-smtp-cert-"));
  try {
    execFileSync(
      "openssl",
      [
        "req", "-x509", "-newkey", "ec", "-pkeyopt", "ec_paramgen_curve:prime256v1", "-nodes",
        "-keyout", path.join(dir, "key.pem"), "-out", path.join(dir, "cert.pem"), "-days", "1",
        "-subj", "/CN=localhost", "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1"
      ],
      { stdio: "ignore" }
    );
    return { cert: readFileSync(path.join(dir, "cert.pem"), "utf8"), key: readFileSync(path.join(dir, "key.pem"), "utf8") };
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
}

/**
 * options:
 *   tls            "none" (default), "starttls" (offered after EHLO) or "implicit" (TLS from the first byte)
 *   certificate    { cert, key } for the two TLS modes
 *   offerStarttls  with tls "none": whether STARTTLS is advertised anyway (default false)
 *   auth           true to advertise AUTH PLAIN
 *   authLine      the AUTH extension line to advertise (default "AUTH PLAIN LOGIN")
 *   authReply      reply to AUTH (default "235 2.7.0 ok")
 *   extraAfterStarttls  text written in the same write as the 220 reply to STARTTLS (a relay that injects a line)
 *   greeting       first line (default "220 fake.test ready")
 *   silent         true: accept connections and never answer
 *   rcpt           (address) => reply line; default "250 ok"
 *   mailFrom       reply line to MAIL FROM (default "250 ok")
 *   data           reply to DATA (default "354 go ahead")
 *   final          reply after the end of DATA (default "250 2.0.0 queued as fake-1"); null: close the connection instead
 */
export async function startFakeSmtp(options = {}) {
  const mode = options.tls ?? "none";
  const sessions = [];
  const sockets = new Set();

  const handle = (rawSocket) => {
    const session = { auth: undefined, bytesBeforeTls: 0, commands: [], data: undefined, secure: mode === "implicit", tlsUpgraded: false };
    sessions.push(session);
    let socket = rawSocket;
    sockets.add(rawSocket);
    rawSocket.on("close", () => sockets.delete(rawSocket));
    rawSocket.on("error", () => undefined);
    if (options.silent) {
      return;
    }

    let buffer = Buffer.alloc(0);
    let inData = false;
    const send = (line) => socket.write(`${line}\r\n`);
    send(options.greeting ?? "220 fake.test ready");

    const onData = (chunk) => {
      if (!session.secure) {
        session.bytesBeforeTls += chunk.length;
      }
      buffer = Buffer.concat([buffer, chunk]);
      for (;;) {
        if (inData) {
          const end = buffer.indexOf("\r\n.\r\n");
          if (end < 0) {
            return;
          }
          session.data = buffer.subarray(0, end + 2);
          buffer = buffer.subarray(end + 5);
          inData = false;
          if (options.final === null) {
            socket.destroy();
            return;
          }
          send(options.final ?? "250 2.0.0 queued as fake-1");
          continue;
        }

        const newline = buffer.indexOf("\r\n");
        if (newline < 0) {
          return;
        }
        const line = buffer.subarray(0, newline).toString("latin1");
        buffer = buffer.subarray(newline + 2);
        session.commands.push(line.toUpperCase().startsWith("AUTH ") ? "AUTH PLAIN <redacted>" : line);
        const verb = line.split(" ")[0].toUpperCase();

        if (verb === "EHLO") {
          const extensions = [];
          if (mode === "starttls" && !session.secure) {
            extensions.push("STARTTLS");
          } else if (mode === "none" && options.offerStarttls) {
            extensions.push("STARTTLS");
          }
          if (options.auth && (session.secure || mode === "none")) {
            extensions.push(options.authLine ?? "AUTH PLAIN LOGIN");
          }
          extensions.push("8BITMIME");
          socket.write(`${["250-fake.test", ...extensions.map((entry) => `250-${entry}`)].join("\r\n").replace(/250-([^\r\n]*)$/u, "250 $1")}\r\n`);
        } else if (verb === "STARTTLS") {
          socket.write(`220 2.0.0 go ahead\r\n${options.extraAfterStarttls ?? ""}`);
          socket.removeListener("data", onData);
          const secure = new tls.TLSSocket(socket, { cert: options.certificate.cert, isServer: true, key: options.certificate.key });
          secure.on("error", () => undefined);
          secure.on("data", onData);
          socket = secure;
          buffer = Buffer.alloc(0);
          session.secure = true;
          session.tlsUpgraded = true;
        } else if (verb === "AUTH") {
          const token = line.split(" ")[2] ?? "";
          session.auth = Buffer.from(token, "base64").toString("utf8");
          send(options.authReply ?? "235 2.7.0 ok");
        } else if (verb === "MAIL") {
          send(options.mailFrom ?? "250 ok");
        } else if (verb === "RCPT") {
          const address = /<([^>]*)>/u.exec(line)?.[1] ?? "";
          send(options.rcpt ? options.rcpt(address) : "250 ok");
        } else if (verb === "DATA") {
          const reply = options.data ?? "354 go ahead";
          send(reply);
          inData = reply.startsWith("354");
        } else if (verb === "QUIT") {
          send("221 bye");
          socket.end();
        } else if (verb === "RSET") {
          send("250 ok");
        } else {
          send("502 not implemented");
        }
      }
    };
    socket.on("data", onData);
  };

  const server =
    mode === "implicit"
      ? tls.createServer({ cert: options.certificate.cert, key: options.certificate.key }, handle)
      : net.createServer(handle);
  server.on("tlsClientError", () => undefined);
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  return {
    close: async () => {
      for (const socket of sockets) {
        socket.destroy();
      }
      await new Promise((resolve) => server.close(resolve));
    },
    port: server.address().port,
    sessions
  };
}

/** A port nothing listens on. */
export async function closedPort() {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}
