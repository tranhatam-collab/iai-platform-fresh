export async function onRequestGet(context) {
  const data = {
    api_url: context.env?.DEVELOPER_API_URL ?? "https://api.iai.one",
    app_url: context.env?.DEVELOPER_APP_URL ?? "https://app.iai.one",
    dash_url: context.env?.DEVELOPER_DASH_URL ?? "https://dash.iai.one",
    docs_url: context.env?.DEVELOPER_DOCS_URL ?? "https://docs.iai.one",
    flow_api_url: context.env?.DEVELOPER_FLOW_API_URL ?? "https://api.flow.iai.one",
    flow_url: context.env?.DEVELOPER_FLOW_URL ?? "https://flow.iai.one",
    home_url: context.env?.DEVELOPER_HOME_URL ?? "https://home.iai.one",
    root_url: context.env?.DEVELOPER_ROOT_URL ?? "https://iai.one",
    service: "iai-developer",
    status: "ok"
  };

  return new Response(JSON.stringify({ ok: true, data }), {
    headers: {
      "cache-control": "no-store",
      "content-language": "vi",
      "content-type": "application/json; charset=utf-8"
    },
    status: 200
  });
}
