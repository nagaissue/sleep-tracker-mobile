import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/lib/theme";
import { getStats, type StatsResponse } from "@/lib/api";
import { SleepChart } from "@/components/SleepChart";

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    setError(null);
    try {
      const data = await getStats(7);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "統計の取得に失敗しました");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16 },
      ]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>睡眠統計</Text>
        <Text style={styles.subtitle}>過去7日間のデータ</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>統計を読み込み中...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠ {error}</Text>
          <TouchableOpacity onPress={loadStats} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>再試行</Text>
          </TouchableOpacity>
        </View>
      ) : stats ? (
        <>
          {/* サマリーカード */}
          <View style={styles.summarySection}>
            {/* 平均睡眠時間 */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>平均睡眠時間</Text>
              <Text style={styles.cardValueBig}>
                {stats.avg_sleep_hours != null
                  ? stats.avg_sleep_hours.toFixed(1)
                  : "--"}
                <Text style={styles.cardUnit}> 時間</Text>
              </Text>
            </View>

            {/* 昼寝回数 */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>昼寝の回数</Text>
              <Text style={styles.cardValueBig}>{stats.nap_count}</Text>
              {stats.nap_total_min > 0 && (
                <Text style={styles.cardSubText}>
                  合計 {stats.nap_total_min}分
                </Text>
              )}
            </View>

            {/* 就寝・起床時刻 */}
            <View style={styles.rowCards}>
              <View style={[styles.card, { flex: 1 }]}>
                <Text style={styles.cardLabel}>平均就寝時刻</Text>
                <Text style={styles.cardValue}>
                  {stats.avg_bedtime || "--:--"}
                </Text>
              </View>
              <View style={[styles.card, { flex: 1 }]}>
                <Text style={styles.cardLabel}>平均起床時刻</Text>
                <Text style={styles.cardValue}>
                  {stats.avg_waketime || "--:--"}
                </Text>
              </View>
            </View>

            {/* セッション数 */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>記録セッション数</Text>
              <Text style={styles.cardValue}>
                {stats.sleep_sessions} セッション / {stats.total_records}件
              </Text>
            </View>
          </View>

          {/* 日別睡眠時間チャート */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>日別睡眠時間</Text>
            <SleepChart sessions={stats.sleep_sessions_detail || []} />
          </View>

          {/* イベント内訳 */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>イベント内訳</Text>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownItem}>
                <View
                  style={[styles.breakdownDot, { backgroundColor: Colors.sleep }]}
                />
                <Text style={styles.breakdownText}>
                  就寝 {stats.events_breakdown?.["就寝"] ?? 0}件
                </Text>
              </View>
              <View style={styles.breakdownItem}>
                <View
                  style={[styles.breakdownDot, { backgroundColor: Colors.wake }]}
                />
                <Text style={styles.breakdownText}>
                  起床 {stats.events_breakdown?.["起床"] ?? 0}件
                </Text>
              </View>
              <View style={styles.breakdownItem}>
                <View
                  style={[styles.breakdownDot, { backgroundColor: Colors.nap }]}
                />
                <Text style={styles.breakdownText}>
                  昼寝 {stats.events_breakdown?.["昼寝"] ?? 0}件
                </Text>
              </View>
            </View>
          </View>

          {/* ヒント */}
          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>💡 ヒント</Text>
            <Text style={styles.tipText}>
              健康的な睡眠時間は1日7～9時間です。毎日の睡眠パターンを記録することで、より良い睡眠習慣を形成できます。
            </Text>
          </View>

          {/* 更来ボタン */}
          <TouchableOpacity
            onPress={loadStats}
            style={styles.refreshButton}
          >
            <Text style={styles.refreshButtonText}>データを更新</Text>
          </TouchableOpacity>
        </>
      ) : null}
    </ScrollView>
  );
}

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
    gap: 4,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textMuted,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    color: Colors.error,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  summarySection: {
    gap: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  cardValueBig: {
    fontSize: 30,
    fontWeight: "bold",
    color: Colors.text,
  },
  cardUnit: {
    fontSize: 16,
    fontWeight: "normal",
    color: Colors.textMuted,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.text,
  },
  cardSubText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  rowCards: {
    flexDirection: "row",
    gap: 12,
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  breakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  breakdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  breakdownText: {
    fontSize: 14,
    color: Colors.text,
  },
  tipBox: {
    backgroundColor: Colors.infoBg,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.info,
    marginTop: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e40af",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: "#1e40af",
    lineHeight: 22,
  },
  refreshButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  refreshButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});
