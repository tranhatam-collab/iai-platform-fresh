import { createNoosWebServer } from "./http-server.js";

const port = Number(process.env.NOOS_WEB_PORT ?? 4320);
const server = createNoosWebServer({ port });

server.listen(port, "127.0.0.1", () => {
  console.log(`NOOS web listening on http://127.0.0.1:${port}`);
});
