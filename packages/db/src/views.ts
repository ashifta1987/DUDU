import type { Enums, Tables } from "./types.gen";

/** Shape returned by public.v_family_dashboard(child_id). */
export interface FamilyDashboard {
  child: Tables<"children">;
  device: Pick<
    Tables<"devices">,
    | "id"
    | "serial"
    | "model"
    | "status"
    | "battery_pct"
    | "wifi_rssi"
    | "volume_pct"
    | "mode"
    | "mode_until"
    | "last_seen_at"
    | "firmware"
    | "firmware_channel"
  > | null;
  today: string;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  schedule: Tables<"schedules">[];
  reminders: Tables<"reminders">[];
  stats: Tables<"child_stats"> | null;
  latest_homework: Pick<
    Tables<"homework_items">,
    "id" | "subject" | "title" | "result" | "score" | "created_at"
  >[];
  today_focus_minutes: number;
  today_presence: { t: string; at_desk: boolean }[];
}

/** Shape returned by public.v_admin_overview(from, to). */
export interface AdminOverview {
  range: { from: string; to: string };
  kpis: {
    active_devices: number;
    total_devices: number;
    paired_devices: number;
    dau: number;
    paid_subs: number;
    ai_cost_inr: number;
    ai_cost_per_device_inr: number;
  };
  conversations_per_day: { date: string; study: number; fun: number }[];
  cost_by_service: { service: Enums<"ai_service">; cost_inr: number }[];
  needs_attention: {
    offline_devices: { id: string; serial: string; last_seen_at: string | null }[];
    open_safety_reviews: number;
    open_high_severity: number;
    trials_ending_3d: number;
  };
  top_requests: { topic: string; count: number }[];
}

export interface PairingCode {
  code6: string;
  qr_token: string;
  expires_at: string;
}
