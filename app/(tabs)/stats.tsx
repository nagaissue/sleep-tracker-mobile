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
import { computeStats, type StatsData } from "@/lib/stats";
import { getRecentRecords } from "@/lib/storage";
import { analyzeSleep, type SleepAnalysis } from "@/lib/api";
import { SleepChart } from "@/components/SleepChart";

const ANALYSIS_PERIOD_DAYS = 30;

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ── AI分析の状態 ──────────────────────────────────────
  const [analysis, setAnalysis] = useState<SleepAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setError(null);
    try {
      const data = await computeStats(7);
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

  // ── AI分析実行 ────────────────────────────────────────
  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const records = await getRecentRecords(ANALYSIS_PERIOD_DAYS);
      const result = await analyzeSleep(
        records.map((r) => ({ type: r.type, datetime: r.datetime }))
      );
      setAnalysis(result);
    } catch (err) {
      setAnalysisError(
        err instanceof Error ? err.message : "分析中に不明なエラーが発生しました"
      );
    } finally {
      setIsAnalyzing(false);
    }
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
          <Text style={styles.loadingText}>統計を計算中...</Text>
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

          {/* AI睡眠分析セクション */}
          <View style={styles.aiSection}>
            <View style={styles.aiSectionHeader}>
              <Text style={styles.aiSectionTitle}>🤖 AI睡眠分析</Text>
              <Text style={styles.aiSectionSubtitle}>
                過去{ANALYSIS_PERIOD_DAYS}日間の記録をGeminiが分析します
              </Text>
            </View>

            {!analysis && !isAnalyzing ? (
              <TouchableOpacity onPress={runAnalysis} style={styles.analyzeButton}>
                <Text style={styles.analyzeButtonText}>AIに分析してもらう</Text>
              </TouchableOpacity>
            ) : null}

            {isAnalyzing ? (
              <View style={styles.analyzingBox}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.analyzingText}>Gemini 2.5 Flash が分析中...</Text>
              </View>
            ) : null}

            {analysisError ? (
              <View style={styles.analysisErrorBox}>
                <Text style={styles.analysisErrorText}>⚠ {analysisError}</Text>
                <TouchableOpacity onPress={runAnalysis} style={styles.retryButtonSmall}>
                  <Text style={styles.retryButtonText}>再試行</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {analysis && !isAnalyzing ? (
              <>
                {/* 指標カード */}
                <View style={styles.metricsGrid}>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>生活リズムの規則性</Text>
                    <Text style={styles.metricValue}>
                      {analysis.metrics.sleep_consistency_score != null
                        ? `${analysis.metrics.sleep_consistency_score}`
                        : "--"}
                      <Text style={styles.metricUnit}> / 100</Text>
                    </Text>
                  </View>
                  <View style={styles.metricCard}>
                    <Text style={styles.metricLabel}>推定睡眠負債</Text>
                    <Text style={styles.metricValue}>
                      {analysis.metrics.sleep_debt_hours != null
                        ? analysis.metrics.sleep_debt_hours.toFixed(1)
                        : "--"}
                      <Text style={styles.metricUnit}> 時間</Text>
                    </Text>
                  </View>
                </View>

                {/* 総評 */}
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryBoxText}>{analysis.summary}</Text>
                </View>

                {/* 気づき */}
                {analysis.insights.length > 0 ? (
                  <View style={styles.insightsBox}>
                    <Text style={styles.insightsTitle}>気づいたパターン</Text>
                    {analysis.insights.map((item, i) => (
                      <View key={i} style={styles.bulletRow}>
                        <Text style={styles.bulletDot}>・</Text>
                        <Text style={styles.bulletText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* 改善提案 */}
                {analysis.recommendations.length > 0 ? (
                  <View style={styles.recommendationsBox}>
                    <Text style={styles.recommendationsTitle}>改善提案</Text>
                    {analysis.recommendations.map((item, i) => (
                      <View key={i} style={styles.bulletRow}>
                        <Text style={[styles.bulletDot, { color: Colors.primary }]}>✓</Text>
                        <Text style={styles.bulletText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <TouchableOpacity onPress={runAnalysis} style={styles.reanalyzeButton}>
                  <Text style={styles.reanalyzeButtonText}>もう一度分析する</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>

          {/* ヒント */}
          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>💡 ヒント</Text>
            <Text style={styles.tipText}>
              健康的な睡眠時間は1日7～9時間です。毎日の睡眠パターンを記録することで、より良い睡眠習慣を形成できます。
            </Text>
          </View>

          {/* 更新ボタン */}
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
  retryButtonSmall: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 10,
    alignSelf: "flex-start",
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
  // ── AI分析セクション ──────────────────────────────────
  aiSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 12,
  },
  aiSectionHeader: {
    marginBottom: 14,
  },
  aiSectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },
  aiSectionSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  analyzeButton: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
  },
  analyzeButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  analyzingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 20,
  },
  analyzingText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  analysisErrorBox: {
    paddingVertical: 8,
  },
  analysisErrorText: {
    fontSize: 14,
    color: Colors.error,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 14,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.primaryDark,
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.primaryDark,
  },
  metricUnit: {
    fontSize: 13,
    fontWeight: "normal",
  },
  summaryBox: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  summaryBoxText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
  },
  insightsBox: {
    marginBottom: 14,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  recommendationsBox: {
    marginBottom: 14,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
    paddingRight: 4,
  },
  bulletDot: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  reanalyzeButton: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  reanalyzeButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600",
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
