/**
 * ローカルストレージ — AsyncStorageで睡眠記録をアプリ内に保存
 *
 * Google Calendar APIを使わず、アプリ内で完結するデータ管理。
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@sleep_tracker_records";

// ── 型定義 ──────────────────────────────────────────────

export interface SleepRecord {
  id: string;
  type: "就寝" | "起床" | "昼寝";
  datetime: string;       // ISO 8601 (JST)
  duration_min: number | null;  // 昼寝の場合の分数
  created_at: string;     // ISO 8601 (レコード作成日時)
}

// ── CRUD関数 ────────────────────────────────────────────

/**
 * すべての睡眠記録を取得（日付昇順）
 */
export async function getAllRecords(): Promise<SleepRecord[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const records: SleepRecord[] = raw ? JSON.parse(raw) : [];
  return records.sort((a, b) => a.datetime.localeCompare(b.datetime));
}

/**
 * 指定日数分の記録を取得
 */
export async function getRecentRecords(days: number): Promise<SleepRecord[]> {
  const all = await getAllRecords();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return all.filter((r) => new Date(r.datetime) >= cutoff);
}

/**
 * 指定月の記録を取得
 */
export async function getMonthRecords(year: number, month: number): Promise<SleepRecord[]> {
  const all = await getAllRecords();
  return all.filter((r) => {
    const dt = new Date(r.datetime);
    return dt.getFullYear() === year && dt.getMonth() === month;
  });
}

/**
 * 複数の睡眠イベントを一括保存
 */
export async function saveRecords(events: Omit<SleepRecord, "id" | "created_at">[]): Promise<SleepRecord[]> {
  const existing = await getAllRecords();
  const now = new Date().toISOString();
  const newRecords: SleepRecord[] = events.map((ev, idx) => ({
    ...ev,
    id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 8)}`,
    created_at: now,
  }));
  const updated = [...existing, ...newRecords];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newRecords;
}

/**
 * 指定IDの記録を削除
 */
export async function deleteRecord(id: string): Promise<void> {
  const all = await getAllRecords();
  const filtered = all.filter((r) => r.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * すべての記録を削除
 */
export async function clearAllRecords(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/**
 * 記録数を取得
 */
export async function getRecordCount(): Promise<number> {
  const all = await getAllRecords();
  return all.length;
}
