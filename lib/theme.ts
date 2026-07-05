/**
 * テーマ・カラー定数
 *
 * Google Calendar colorIdとの対応は廃止。
 * アプリ内で独自のカラーマッピングを管理。
 */

export const Colors = {
  primary: "#0a7ea4",
  primaryLight: "#e6f4fa",
  primaryDark: "#096a8a",
  background: "#f5f5f5",
  surface: "#ffffff",
  text: "#1a1a1a",
  textMuted: "#6b7280",
  border: "#e5e7eb",
  success: "#22c55e",
  successBg: "#f0fdf4",
  error: "#ef4444",
  errorBg: "#fef2f2",
  info: "#3b82f6",
  infoBg: "#eff6ff",
  // イベントカラー（アプリ内独自定義）
  sleep: "#1e3a8a", // 紺色
  wake: "#f97316", // オレンジ×黄
  nap: "#3b82f6",  // 青色
};

export const EventColors: Record<string, string> = {
  就寝: Colors.sleep,
  起床: Colors.wake,
  昼寝: Colors.nap,
};

export const EventColorsLight: Record<string, string> = {
  就寝: "#dbeafe",
  起床: "#fed7aa",
  昼寝: "#bfdbfe",
};

export const EventLabels: Record<string, string> = {
  就寝: "就寝",
  起床: "起床",
  昼寝: "昼寝",
};
