/**
 * API クライアント — Vercel上のバックエンドAPIと通信
 *
 * エンドポイント:
 *   POST /api/parse    — Gemini 2.5 Flash でテキスト解析（就寝/昼寝/起床 + 時刻の抽出）
 *   POST /api/analyze  — Gemini 2.5 Flash で睡眠記録全体を分析（指標算出・気づき・提案）
 *
 * ※ Google Calendar API連携は廃止し、アプリ内ローカルストレージで管理
 */

// 環境変数からAPI URLを取得（デフォルトはデプロイ済みのVercel URL）
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "https://sleep-tracker-app-three.vercel.app";

// ── 型定義 ──────────────────────────────────────────────

export interface SleepEvent {
  type: "就寝" | "起床" | "昼寝";
  datetime: string;
  duration_min: number | null;
  colorId?: string;  // バックエンド互換用（アプリ内では未使用）
  hex?: string;      // バックエンド互換用（アプリ内では未使用）
}

export interface ParseResponse {
  events: SleepEvent[];
}

export interface SleepMetrics {
  avg_sleep_hours: number | null;
  avg_bedtime: string | null;
  avg_waketime: string | null;
  sleep_consistency_score: number | null;
  total_nap_count: number;
  sleep_debt_hours: number | null;
}

export interface SleepAnalysis {
  metrics: SleepMetrics;
  summary: string;
  insights: string[];
  recommendations: string[];
}

// ── API 関数 ────────────────────────────────────────────

/**
 * テキストをGemini 2.5 Flashで解析し、睡眠イベントを抽出する
 * 入力フォーマットは「カテゴリー（就寝/昼寝/起床）＋時刻（0:00〜23:59）」で固定。
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
 * 睡眠記録一式をGemini 2.5 Flashに送り、睡眠指標の算出と分析コメントを取得する
 */
export async function analyzeSleep(
  records: { type: string; datetime: string }[]
): Promise<SleepAnalysis> {
  const res = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ records }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "分析エラーが発生しました");
  return data as SleepAnalysis;
}

/**
 * API接続テスト（設定画面用）
 */
export async function checkApiConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "テスト" }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      return { ok: true, message: "Gemini API接続: 正常" };
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
