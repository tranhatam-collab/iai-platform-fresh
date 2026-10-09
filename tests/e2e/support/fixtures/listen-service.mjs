// A minimal service for harness tests: listens on PORT and answers /health.
// FIXTURE_EXIT_CODE exits immediately with that code (an early failure that is not a taken port);
// FIXTURE_NO_LISTEN stays alive without ever listening (a readiness timeout, not an early exit).
import http from "node:http";

process.on("SIGTERM", () => process.exit(0));

if (process.env.FIXTURE_EXIT_CODE) {
  process.stderr.write("fixture: exiting early on request\n");
  process.exit(Number(process.env.FIXTURE_EXIT_CODE));
}

if (process.env.FIXTURE_NO_LISTEN) {
  setInterval(() => {}, 1000);
} else {
  const server = http.createServer((_request, response) => {
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ ok: true }));
  });

  // No error handler on purpose: a taken port is an uncaught EADDRINUSE and the process exits.
  server.listen(Number(process.env.PORT), process.env.FIXTURE_HOST ?? "127.0.0.1");
}
