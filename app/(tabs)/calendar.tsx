import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, EventColors } from "@/lib/theme";
import { getMonthRecords, deleteRecord, type SleepRecord } from "@/lib/storage";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const MONTHS = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月",
];

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [records, setRecords] = useState<SleepRecord[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMonthRecords(year, month);
      setRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // ── 月移動 ──────────────────────────────────────────
  const prevMonth = () => {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
    setSelectedDay(null);
  };

  // ── 個別削除 ──────────────────────────────────────────
  const handleDelete = (record: SleepRecord) => {
    Alert.alert(
      "記録を削除",
      `${record.type} — ${formatTime(new Date(record.datetime))} の記録を削除しますか？`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: async () => {
            await deleteRecord(record.id);
            await loadRecords();
          },
        },
      ]
    );
  };

  // ── カレンダーグリッドの構築 ────────────────────────
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 日付ごとのレコードをグループ化
  const recordsByDay: Record<number, SleepRecord[]> = {};
  for (const r of records) {
    const dt = new Date(r.datetime);
    if (dt.getFullYear() === year && dt.getMonth() === month) {
      const day = dt.getDate();
      if (!recordsByDay[day]) recordsByDay[day] = [];
      recordsByDay[day].push(r);
    }
  }

  // カレンダーセル（前月の空白を含む）
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // 選択日のレコード
  const selectedRecords = selectedDay ? (recordsByDay[selectedDay] || []) : [];

  // 日付のイベントドットを取得
  const getDots = (day: number): string[] => {
    const dayRecords = recordsByDay[day] || [];
    const types = new Set<string>();
    for (const r of dayRecords) {
      types.add(r.type);
    }
    return Array.from(types).map((t) => EventColors[t] || Colors.primary);
  };

  // 今日かどうか
  const isToday = (day: number) => {
    const t = new Date();
    return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16 },
      ]}
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>カレンダー</Text>
      </View>

      {/* 月ナビゲーション */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={prevMonth} style={styles.navButton}>
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {year}年 {MONTHS[month]}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <>
          {/* カレンダーグリッド */}
          <View style={styles.calendarCard}>
            {/* 曜日ヘッダー */}
            <View style={styles.weekdayRow}>
              {WEEKDAYS.map((wd, i) => (
                <Text
                  key={wd}
                  style={[
                    styles.weekdayText,
                    i === 0 && { color: Colors.error },
                    i === 6 && { color: Colors.info },
                  ]}
                >
                  {wd}
                </Text>
              ))}
            </View>

            {/* 日付セル */}
            <View style={styles.daysGrid}>
              {cells.map((day, idx) => {
                if (day === null) {
                  return <View key={`empty-${idx}`} style={styles.dayCell} />;
                }
                const dots = getDots(day);
                const today = isToday(day);
                const selected = selectedDay === day;
                return (
                  <TouchableOpacity
                    key={`day-${day}`}
                    onPress={() => setSelectedDay(day)}
                    style={[
                      styles.dayCell,
                      today && styles.todayCell,
                      selected && styles.selectedCell,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        today && styles.todayText,
                        selected && styles.selectedText,
                      ]}
                    >
                      {day}
                    </Text>
                    {dots.length > 0 && (
                      <View style={styles.dotsRow}>
                        {dots.slice(0, 3).map((color, di) => (
                          <View
                            key={di}
                            style={[styles.dayDot, { backgroundColor: color }]}
                          />
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 選択日の詳細 */}
          {selectedDay && (
            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>
                {year}年{month + 1}月{selectedDay}日の記録
              </Text>
              {selectedRecords.length > 0 ? (
                selectedRecords
                  .sort((a, b) => a.datetime.localeCompare(b.datetime))
                  .map((r, i) => {
                    const dt = new Date(r.datetime);
                    const time = formatTime(dt);
                    return (
                      <View key={r.id || i} style={styles.detailRow}>
                        <View
                          style={[styles.detailDot, { backgroundColor: EventColors[r.type] || Colors.primary }]}
                        />
                        <Text style={styles.detailType}>{r.type}</Text>
                        <Text style={styles.detailTime}>{time}</Text>
                        {r.duration_min ? (
                          <Text style={styles.detailDuration}>({r.duration_min}分)</Text>
                        ) : null}
                        <TouchableOpacity
                          onPress={() => handleDelete(r)}
                          style={styles.deleteButton}
                        >
                          <Text style={styles.deleteButtonText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })
              ) : (
                <Text style={styles.emptyDetail}>この日の記録はありません</Text>
              )}
            </View>
          )}

          {/* 凡例 */}
          <View style={styles.legendCard}>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: Colors.sleep }]} />
              <Text style={styles.legendText}>就寝</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: Colors.wake }]} />
              <Text style={styles.legendText}>起床</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: Colors.nap }]} />
              <Text style={styles.legendText}>昼寝</Text>
            </View>
          </View>

          {/* 記録件数 */}
          <Text style={styles.recordCount}>
            {MONTHS[month]}の記録: {records.length}件
          </Text>
        </>
      )}
    </ScrollView>
  );
}

// ── ユーティリティ ──────────────────────────────────────

function formatTime(dt: Date): string {
  return `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
}

// ── スタイル ────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text,
  },
  monthNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonText: {
    fontSize: 24,
    color: Colors.primary,
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  calendarCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.2857%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  todayCell: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
  },
  selectedCell: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 15,
    color: Colors.text,
  },
  todayText: {
    fontWeight: "bold",
    color: Colors.primary,
  },
  selectedText: {
    fontWeight: "bold",
    color: "#fff",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 3,
    marginTop: 4,
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  detailCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 16,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  detailType: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.text,
    minWidth: 40,
  },
  detailTime: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: "600",
  },
  detailDuration: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  deleteButton: {
    marginLeft: "auto",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.errorBg,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: "700",
  },
  emptyDetail: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    paddingVertical: 16,
  },
  legendCard: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 16,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500",
  },
  recordCount: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 16,
  },
});
