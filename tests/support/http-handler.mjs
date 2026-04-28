function normalizeHeaders(headers = {}) {
  const normalized = {};

  for (const [key, value] of Object.entries(headers)) {
    normalized[key.toLowerCase()] = value;
  }

  return normalized;
}

function normalizeBody(body) {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (body instanceof URLSearchParams) {
    return body.toString();
  }

  if (typeof body === "string") {
    return body;
  }

  if (body instanceof Uint8Array) {
    return Buffer.from(body);
  }

  return String(body);
}

export async function dispatchToHandler(
  handler,
  {
    body,
    headers,
    method = "GET",
    url = "/"
  } = {}
) {
  const requestBody = normalizeBody(body);
  const request = {
    headers: normalizeHeaders(headers),
    method,
    url,
    async *[Symbol.asyncIterator]() {
      if (requestBody === undefined) {
        return;
      }

      if (Buffer.isBuffer(requestBody)) {
        yield requestBody;
        return;
      }

      yield Buffer.from(requestBody);
    }
  };

  return new Promise((resolve, reject) => {
    const responseHeaders = new Headers();
    const chunks = [];
    const response = {
      statusCode: 200,
      setHeader(name, value) {
        responseHeaders.set(name, Array.isArray(value) ? value.join(", ") : String(value));
      },
      end(chunk) {
        if (chunk !== undefined) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
        }

        resolve(
          new Response(Buffer.concat(chunks), {
            headers: responseHeaders,
            status: response.statusCode
          })
        );
      }
    };

    Promise.resolve(handler(request, response)).catch(reject);
  });
}
