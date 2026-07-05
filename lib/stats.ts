/**
 * ローカル統計計算 — Google Calendar APIを使わずアプリ内で統計を算出
 *
 * Vercelバックエンドの /api/stats と同等のロジックをクライアント側で実行。
 */

import { getRecentRecords, type SleepRecord } from "./storage";

// ── 型定義 ──────────────────────────────────────────────

export interface SleepSessionDetail {
  date: string;       // MM/DD
  bedtime: string;    // HH:MM
  waketime: string | null;
  hours: number;
  weekday: string;
}

export interface StatsData {
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

// ── 定数 ────────────────────────────────────────────────

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const DEFAULT_SLEEP_DURATION_MIN = 480;  // 就寝のみの場合のデフォルト8時間
const DEFAULT_NAP_DURATION_MIN = 30;     // 昼寝のデフォルト

// ── ヘルパー ────────────────────────────────────────────

/**
 * 就寝と起床をペアリングして睡眠セッションを構築
 */
function buildSleepSessions(records: SleepRecord[]): SleepSessionDetail[] {
  const sleepEvents = records.filter((r) => r.type === "就寝").sort((a, b) => a.datetime.localeCompare(b.datetime));
  const wakeEvents = records.filter((r) => r.type === "起床").sort((a, b) => a.datetime.localeCompare(b.datetime));

  const sessions: SleepSessionDetail[] = [];

  for (const sleep of sleepEvents) {
    const sDt = new Date(sleep.datetime);

    // 対応する起床を探す：就寝より後の直近の起床（2〜14時間以内）
    let matchedWake: Date | null = null;
    for (const wake of wakeEvents) {
      const wDt = new Date(wake.datetime);
      const diffHours = (wDt.getTime() - sDt.getTime()) / 3600000;
      if (diffHours >= 0 && diffHours <= 14) {
        // 最も近い起床を選ぶ
        if (!matchedWake || wDt < matchedWake) {
          matchedWake = wDt;
        }
      }
    }

    let hours: number;
    if (matchedWake) {
      hours = (matchedWake.getTime() - sDt.getTime()) / 3600000;
    } else {
      hours = DEFAULT_SLEEP_DURATION_MIN / 60;
    }

    sessions.push({
      date: `${String(sDt.getMonth() + 1).padStart(2, "0")}/${String(sDt.getDate()).padStart(2, "0")}`,
      bedtime: `${String(sDt.getHours()).padStart(2, "0")}:${String(sDt.getMinutes()).padStart(2, "0")}`,
      waketime: matchedWake
        ? `${String(matchedWake.getHours()).padStart(2, "0")}:${String(matchedWake.getMinutes()).padStart(2, "0")}`
        : null,
      hours: Math.round(hours * 10) / 10,
      weekday: WEEKDAYS[sDt.getDay()],
    });
  }

  return sessions.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 平均時刻を計算（HH:MM形式）
 */
function avgTimeStr(datetimes: string[]): string | null {
  if (datetimes.length === 0) return null;
  const minutes = datetimes.map((dt) => {
    const d = new Date(dt);
    return d.getHours() * 60 + d.getMinutes();
  });
  const avgMin = Math.round(minutes.reduce((a, b) => a + b, 0) / minutes.length);
  return `${String(Math.floor(avgMin / 60)).padStart(2, "0")}:${String(avgMin % 60).padStart(2, "0")}`;
}

// ── メイン関数 ──────────────────────────────────────────

/**
 * 過去N日間の睡眠統計をローカルデータから計算
 */
export async function computeStats(days: number = 7): Promise<StatsData> {
  const records = await getRecentRecords(days);

  const sleepEvents = records.filter((r) => r.type === "就寝");
  const wakeEvents = records.filter((r) => r.type === "起床");
  const napEvents = records.filter((r) => r.type === "昼寝");

  const sessions = buildSleepSessions(records);
  const sleepDurations = sessions.map((s) => s.hours);

  const avgSleepHours = sleepDurations.length > 0
    ? Math.round((sleepDurations.reduce((a, b) => a + b, 0) / sleepDurations.length) * 10) / 10
    : null;

  // 昼寝の合計時間
  let napTotalMin = 0;
  for (const nap of napEvents) {
    if (nap.duration_min) {
      napTotalMin += nap.duration_min;
    } else {
      napTotalMin += DEFAULT_NAP_DURATION_MIN;
    }
  }

  return {
    period_days: days,
    total_records: records.length,
    sleep_sessions: sessions.length,
    avg_sleep_hours: avgSleepHours,
    avg_bedtime: avgTimeStr(sleepEvents.map((e) => e.datetime)),
    avg_waketime: avgTimeStr(wakeEvents.map((e) => e.datetime)),
    nap_count: napEvents.length,
    nap_total_min: napTotalMin,
    events_breakdown: {
      就寝: sleepEvents.length,
      起床: wakeEvents.length,
      昼寝: napEvents.length,
    },
    sleep_sessions_detail: sessions,
    daily_sleep_hours: sleepDurations,
  };
}
