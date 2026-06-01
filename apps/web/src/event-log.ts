export type WebEventName =
  | "web_landing_view"
  | "web_onboarding_started"
  | "web_role_selected"
  | "web_auth_handoff_started"
  | "web_paid_intent_started"
  | "web_feedback_submitted"
  | "web_ai_build_started"
  | "web_ai_build_completed"
  | "web_ai_build_failed"
  | "web_api_site_generate";

export interface WebEventRecord {
  eventName: WebEventName;
  eventId: string;
  intent?: string;
  recordedAt: string;
  role?: string;
  route: string;
  sourceCampaign: string;
  variantId: string;
  feedbackCategory?: string;
  feedbackRating?: number;
  messageLength?: number;
  buildOutcome?: string;
}

export interface WebEventRecorder {
  list(limit?: number): WebEventRecord[];
  record(event: Omit<WebEventRecord, "eventId" | "recordedAt">): WebEventRecord;
}

export function createWebEventRecorder(maxItems = 200): WebEventRecorder {
  const items: WebEventRecord[] = [];

  return {
    list(limit = 50) {
      return items.slice(-limit);
    },
    record(event) {
      const record: WebEventRecord = {
        ...event,
        eventId: `evt_${items.length + 1}`,
        recordedAt: new Date().toISOString()
      };

      items.push(record);
      if (items.length > maxItems) {
        items.splice(0, items.length - maxItems);
      }

      return record;
    }
  };
}
