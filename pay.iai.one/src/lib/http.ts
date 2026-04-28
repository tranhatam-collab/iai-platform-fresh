export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

export function notFound(pathname: string): Response {
  return json(
    {
      ok: false,
      code: "NOT_FOUND",
      message: "Route not found.",
      pathname
    },
    404
  );
}

export function handleOptions(request: Request, allowedOrigins = "*"): Response | null {
  if (request.method !== "OPTIONS") return null;

  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": allowedOrigins,
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization,x-idempotency-key,x-site-key,x-api-key,x-pay-signature,x-pay-timestamp",
      "access-control-max-age": "86400"
    }
  });
}
