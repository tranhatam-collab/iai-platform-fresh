import type { BuilderSection } from "./render.js";

export type AiAgentMode = "free-demo" | "byok";

export interface AiAgentConfig {
  apiBase: string;
  mode: AiAgentMode;
  apiKey?: string;
  fetchImpl?: typeof globalThis.fetch;
}

export interface SiteBuildRequest {
  businessName: string;
  goal: string;
  intent: "information" | "leads" | "commerce";
  role: "starter" | "builder" | "operator";
  locale: "vi" | "en";
}

export type AiBuildErrorCode =
  | "AI_QUOTA_EXCEEDED"
  | "AI_UNAUTHORIZED"
  | "AI_UNAVAILABLE"
  | "AI_BAD_RESPONSE";

export interface SiteBuildResult {
  ok: boolean;
  siteId?: string;
  sections?: BuilderSection[];
  previewHtml?: string;
  error?: AiBuildErrorCode;
}

interface AiAgentSuccessPayload {
  site_id?: string;
  sections?: Array<{ heading?: string; body?: string }>;
  preview_html?: string;
}

export interface AiAgentClient {
  generateSite(request: SiteBuildRequest): Promise<SiteBuildResult>;
}

export function createAiAgentClient(config: AiAgentConfig): AiAgentClient {
  const fetchImpl = config.fetchImpl ?? globalThis.fetch;

  return {
    async generateSite(request: SiteBuildRequest): Promise<SiteBuildResult> {
      const headers: Record<string, string> = {
        "content-type": "application/json",
        "x-aiagent-mode": config.mode
      };

      if (config.mode === "byok") {
        if (!config.apiKey) {
          return { ok: false, error: "AI_UNAUTHORIZED" };
        }
        headers.authorization = `Bearer ${config.apiKey}`;
      }

      let response: Response;
      try {
        response = await fetchImpl(new URL("/v1/site/generate", config.apiBase).toString(), {
          method: "POST",
          headers,
          body: JSON.stringify({
            business_name: request.businessName,
            goal: request.goal,
            intent: request.intent,
            role: request.role,
            locale: request.locale
          })
        });
      } catch {
        return { ok: false, error: "AI_UNAVAILABLE" };
      }

      if (response.status === 429) {
        return { ok: false, error: "AI_QUOTA_EXCEEDED" };
      }

      if (response.status === 401 || response.status === 403) {
        return { ok: false, error: "AI_UNAUTHORIZED" };
      }

      if (!response.ok) {
        return { ok: false, error: "AI_UNAVAILABLE" };
      }

      let payload: AiAgentSuccessPayload;
      try {
        payload = (await response.json()) as AiAgentSuccessPayload;
      } catch {
        return { ok: false, error: "AI_BAD_RESPONSE" };
      }

      const sections = (payload.sections ?? [])
        .map((section) => ({
          heading: (section.heading ?? "").trim(),
          body: (section.body ?? "").trim()
        }))
        .filter((section) => section.heading.length > 0);

      if (sections.length === 0) {
        return { ok: false, error: "AI_BAD_RESPONSE" };
      }

      return {
        ok: true,
        siteId: payload.site_id,
        sections,
        previewHtml: payload.preview_html
      };
    }
  };
}
