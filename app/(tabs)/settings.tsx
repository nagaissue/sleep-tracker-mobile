import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/lib/theme";
import { checkApiConnection, API_BASE_URL } from "@/lib/api";
import { getRecordCount, clearAllRecords } from "@/lib/storage";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [connectionStatus, setConnectionStatus] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [checking, setChecking] = useState(true);
  const [recordCount, setRecordCount] = useState(0);

  const checkConnection = useCallback(async () => {
    setChecking(true);
    const result = await checkApiConnection();
    setConnectionStatus(result);
    setChecking(false);
  }, []);

  const loadRecordCount = useCallback(async () => {
    const count = await getRecordCount();
    setRecordCount(count);
  }, []);

  useEffect(() => {
    checkConnection();
    loadRecordCount();
  }, [checkConnection, loadRecordCount]);

  const handleClearData = () => {
    Alert.alert(
      "データを全削除",
      "アプリ内のすべての睡眠記録を削除しますか？この操作は取り消せません。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: async () => {
            await clearAllRecords();
            await loadRecordCount();
            Alert.alert("完了", "すべての記録を削除しました。");
          },
        },
      ]
    );
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
        <Text style={styles.title}>設定</Text>
      </View>

      {/* ローカルデータ状態 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>アプリ内データ</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>保存済みレコード数</Text>
            <Text style={styles.rowValue}>{recordCount} 件</Text>
          </View>
          <View style={styles.divider} />
          <Text style={styles.detailText}>
            睡眠記録はアプリ内のローカルストレージに保存されています。Google Calendarへの連携は不要です。
          </Text>
          {recordCount > 0 && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity onPress={handleClearData} style={styles.dangerButton}>
                <Text style={styles.dangerButtonText}>すべての記録を削除</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* API接続状態 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gemini API接続状態</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>ステータス</Text>
            {checking ? (
              <View style={styles.statusRow}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.statusText}>確認中...</Text>
              </View>
            ) : connectionStatus ? (
              <View
                style={[
                  styles.statusBadge,
                  connectionStatus.ok
                    ? { backgroundColor: Colors.successBg }
                    : { backgroundColor: Colors.errorBg },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    connectionStatus.ok
                      ? { color: "#166534" }
                      : { color: "#991b1b" },
                  ]}
                >
                  {connectionStatus.ok ? "✓ 接続OK" : "✗ 接続エラー"}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.detailText}>
            {connectionStatus?.message || ""}
          </Text>
        </View>
      </View>

      {/* API エンドポイント */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API エンドポイント</Text>
        <View style={styles.card}>
          <Text style={styles.detailText}>{API_BASE_URL}</Text>
        </View>
      </View>

      {/* イベントカラー凡例 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>イベントカラー</Text>
        <View style={styles.card}>
          <View style={styles.colorLegendRow}>
            <View style={[styles.colorDot, { backgroundColor: Colors.sleep }]} />
            <View style={styles.colorInfo}>
              <Text style={styles.colorLabel}>就寝</Text>
              <Text style={styles.colorDetail}>紺色</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.colorLegendRow}>
            <View style={[styles.colorDot, { backgroundColor: Colors.wake }]} />
            <View style={styles.colorInfo}>
              <Text style={styles.colorLabel}>起床</Text>
              <Text style={styles.colorDetail}>オレンジ×黄</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.colorLegendRow}>
            <View style={[styles.colorDot, { backgroundColor: Colors.nap }]} />
            <View style={styles.colorInfo}>
              <Text style={styles.colorLabel}>昼寝</Text>
              <Text style={styles.colorDetail}>青色</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 技術スタック */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>技術スタック</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>フロントエンド</Text>
            <Text style={styles.rowValue}>Expo + React Native</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>テキスト入力</Text>
            <Text style={styles.rowValue}>TextInput（日本語対応）</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>自然言語解析</Text>
            <Text style={styles.rowValue}>Gemini 2.5 Flash</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>データ保存</Text>
            <Text style={styles.rowValue}>AsyncStorage（アプリ内）</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>バックエンド</Text>
            <Text style={styles.rowValue}>Python 3.12 (Vercel) — 解析のみ</Text>
          </View>
        </View>
      </View>

      {/* アプリ情報 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>アプリ情報</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>アプリ名</Text>
            <Text style={styles.rowValue}>Sleep Tracker</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>バージョン</Text>
            <Text style={styles.rowValue}>2.1.0</Text>
          </View>
        </View>
      </View>

      {/* フッター */}
      <Text style={styles.footer}>
        Sleep Tracker App v2.1.0{"\n"}© 2026 Sleep Tracker
      </Text>
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
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textMuted,
    marginBottom: 8,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: "500",
  },
  rowValue: {
    fontSize: 15,
    color: Colors.textMuted,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  detailText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  colorLegendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  colorInfo: {
    flex: 1,
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.text,
  },
  colorDetail: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  dangerButton: {
    backgroundColor: Colors.errorBg,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  dangerButtonText: {
    color: Colors.error,
    fontSize: 15,
    fontWeight: "600",
  },
  footer: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 24,
    lineHeight: 20,
  },
});
