/**
 * API クライアント — Vercel上のバックエンドAPIと通信
 *
 * エンドポイント:
 *   POST /api/parse    — Gemini 2.5 Flash でテキスト解析
 *   POST /api/calendar — Google Calendar にイベント登録
 *   GET  /api/stats    — 睡眠統計データを取得
 */

// 環境変数からAPI URLを取得（デフォルトはデプロイ済みのVercel URL）
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "https://sleep-tracker-app-three.vercel.app";

// ── 型定義 ──────────────────────────────────────────────

export interface SleepEvent {
  type: "就寝" | "起床" | "昼寝";
  datetime: string;
  duration_min: number | null;
  colorId: string;
  hex: string;
}

export interface ParseResponse {
  events: SleepEvent[];
}

export interface CreatedEvent {
  id: string;
  type: string;
  start: string;
  end: string;
  duration_min: number;
  summary: string;
  htmlLink: string;
}

export interface CalendarResponse {
  created: CreatedEvent[];
}

export interface SleepSessionDetail {
  date: string;
  bedtime: string;
  waketime: string | null;
  hours: number;
  weekday: string;
}

export interface StatsResponse {
  period_days: number;
  total_records: number;
  sleep_sessions: number;
  avg_sleep_hours: number | null;
  avg_bedtime: string | null;
  avg_waketime: string | null;
  nap_count: number;
  nap_total_min: number;
  events_breakdown: Record<string, number>;
  sleep_sessions_detail: SleepSessionDetail[];
  daily_sleep_hours: number[];
}

// ── API 関数 ────────────────────────────────────────────

/**
 * テキストをGemini 2.5 Flashで解析し、睡眠イベントを抽出する
 */
export async function parseText(text: string): Promise<ParseResponse> {
  const res = await fetch(`${API_BASE_URL}/api/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "解析エラーが発生しました");
  return data as ParseResponse;
}

/**
 * 解析されたイベントをGoogle Calendarに登録する
 */
export async function registerToCalendar(events: SleepEvent[]): Promise<CalendarResponse> {
  const res = await fetch(`${API_BASE_URL}/api/calendar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "カレンダー登録エラーが発生しました");
  return data as CalendarResponse;
}

/**
 * 過去N日間の睡眠統計を取得する
 */
export async function getStats(days: number = 7): Promise<StatsResponse> {
  const res = await fetch(`${API_BASE_URL}/api/stats?days=${days}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "統計取得エラーが発生しました");
  return data as StatsResponse;
}

/**
 * API接続テスト（設定画面用）
 */
export async function checkApiConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/stats?days=1`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      return { ok: true, message: "API接続: 正常" };
    }
    return { ok: false, message: `API接続: エラー (HTTP ${res.status})` };
  } catch (err) {
    return {
      ok: false,
      message: `API接続: 失敗 (${err instanceof Error ? err.message : "不明なエラー"})`,
    };
  }
}

export { API_BASE_URL };
