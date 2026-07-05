import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { useState, useCallback } from "react";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, EventColors } from "@/lib/theme";
import { parseText, type SleepEvent } from "@/lib/api";
import { saveRecords } from "@/lib/storage";

type StatusType = "info" | "success" | "error";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const [textInput, setTextInput] = useState("");
  const [parsedEvents, setParsedEvents] = useState<SleepEvent[]>([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState<StatusType>("info");
  const [isLoading, setIsLoading] = useState(false);

  // ── ヘルパー関数 ──────────────────────────────────────
  const showStatus = useCallback((msg: string, type: StatusType = "info") => {
    setStatusMsg(msg);
    setStatusType(type);
  }, []);

  // ── テキスト入力から解析 ──────────────────────────────
  const handleTextParse = async () => {
    const text = textInput.trim();
    if (!text) return;
    Keyboard.dismiss();
    await handleParse(text);
  };

  // ── Gemini API で解析 ─────────────────────────────────
  const handleParse = async (text: string) => {
    showStatus("Gemini 2.5 Flash で解析中...", "info");
    setIsLoading(true);
    try {
      const result = await parseText(text);
      if (result.events.length > 0) {
        setParsedEvents(result.events);
        showStatus(`${result.events.length}件のイベントを検出しました`, "success");
      } else {
        showStatus("イベントを検出できませんでした", "error");
      }
    } catch (err) {
      showStatus(
        `解析エラー: ${err instanceof Error ? err.message : "不明なエラー"}`,
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ── ローカルストレージに保存 ──────────────────────────
  const handleRegister = async () => {
    if (parsedEvents.length === 0) return;
    showStatus("アプリ内に保存中...", "info");
    setIsLoading(true);
    try {
      const saved = await saveRecords(
        parsedEvents.map((ev) => ({
          type: ev.type,
          datetime: ev.datetime,
          duration_min: ev.duration_min,
        }))
      );
      showStatus(
        `✅ ${saved.length}件のイベントを保存しました！`,
        "success"
      );
      setParsedEvents([]);
      setTextInput("");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      showStatus(
        `保存エラー: ${err instanceof Error ? err.message : "不明なエラー"}`,
        "error"
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setParsedEvents([]);
    setTextInput("");
    setStatusMsg("");
  };

  // ── イベントプレビューのペアリング ────────────────────
  const renderEventPreview = () => {
    if (parsedEvents.length === 0) return null;

    const sleepEv = parsedEvents.find((e) => e.type === "就寝");
    const wakeEv = parsedEvents.find((e) => e.type === "起床");
    const napEv = parsedEvents.find((e) => e.type === "昼寝");
    const cards: React.ReactNode[] = [];

    // 就寝+起床のペア表示
    if (sleepEv && wakeEv) {
      const sDt = new Date(sleepEv.datetime);
      const wDt = new Date(wakeEv.datetime);
      const hours = ((wDt.getTime() - sDt.getTime()) / 3600000).toFixed(1);
      cards.push(
        <View key="pair" style={styles.eventCard}>
          <View style={[styles.eventDot, { backgroundColor: EventColors["就寝"] }]} />
          <View style={styles.eventInfo}>
            <Text style={styles.eventTypeText}>就寝 → 起床</Text>
            <Text style={styles.eventTimeText}>
              {formatDateTime(sDt)} 〜 {formatDateTime(wDt)}　({hours}h)
            </Text>
          </View>
        </View>
      );
    }

    // 個別表示（ペアになっていないもの）
    if (!sleepEv || !wakeEv) {
      parsedEvents.forEach((ev, i) => {
        if (sleepEv && ev.type === "就寝") return;
        if (wakeEv && ev.type === "起床") return;
        const dt = new Date(ev.datetime);
        cards.push(
          <View key={`ev-${i}`} style={styles.eventCard}>
            <View
              style={[styles.eventDot, { backgroundColor: EventColors[ev.type] || Colors.primary }]}
            />
            <View style={styles.eventInfo}>
              <Text style={styles.eventTypeText}>{ev.type}</Text>
              <Text style={styles.eventTimeText}>
                {formatDateTime(dt)}
                {ev.duration_min ? `　(${ev.duration_min}分)` : ""}
              </Text>
            </View>
          </View>
        );
      });
    }

    // 昼寝は常に個別表示
    if (napEv) {
      const dt = new Date(napEv.datetime);
      cards.push(
        <View key="nap" style={styles.eventCard}>
          <View style={[styles.eventDot, { backgroundColor: EventColors["昼寝"] }]} />
          <View style={styles.eventInfo}>
            <Text style={styles.eventTypeText}>昼寝</Text>
            <Text style={styles.eventTimeText}>
              {formatDateTime(dt)}
              {napEv.duration_min ? `　(${napEv.duration_min}分)` : ""}
            </Text>
          </View>
        </View>
      );
    }

    return <View style={styles.eventsContainer}>{cards}</View>;
  };

  // ── レンダー ──────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>😴 Sleep Tracker</Text>
        <Text style={styles.subtitle}>テキスト入力で睡眠を記録</Text>
      </View>

      {/* テキスト入力 */}
      <View style={styles.textInputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="例: 昨夜11時に就寝して今朝6時半に起床した"
          placeholderTextColor={Colors.textMuted}
          value={textInput}
          onChangeText={setTextInput}
          onSubmitEditing={handleTextParse}
          editable={!isLoading}
          multiline
        />
        <TouchableOpacity
          onPress={handleTextParse}
          disabled={isLoading || !textInput.trim()}
          style={[
            styles.parseButton,
            (!textInput.trim() || isLoading) && { opacity: 0.4 },
          ]}
        >
          <Text style={styles.parseButtonText}>解析</Text>
        </TouchableOpacity>
      </View>

      {/* ステータスメッセージ */}
      {statusMsg ? (
        <View
          style={[
            styles.statusBox,
            statusType === "success" && { backgroundColor: Colors.successBg, borderColor: Colors.success },
            statusType === "error" && { backgroundColor: Colors.errorBg, borderColor: Colors.error },
            statusType === "info" && { backgroundColor: Colors.infoBg, borderColor: Colors.info },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              statusType === "success" && { color: "#166534" },
              statusType === "error" && { color: "#991b1b" },
              statusType === "info" && { color: "#1e40af" },
            ]}
          >
            {statusMsg}
          </Text>
        </View>
      ) : null}

      {/* ローディング */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : null}

      {/* イベントプレビュー */}
      {renderEventPreview()}

      {/* 登録・クリアボタン */}
      {parsedEvents.length > 0 && !isLoading ? (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={handleRegister}
            style={[styles.registerButton, { backgroundColor: Colors.primary }]}
          >
            <Text style={styles.registerButtonText}>アプリ内に保存</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleClear}
            style={[styles.registerButton, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }]}
          >
            <Text style={[styles.registerButtonText, { color: Colors.textMuted }]}>クリア</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

// ── ユーティリティ ──────────────────────────────────────

function formatDateTime(dt: Date): string {
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  const h = String(dt.getHours()).padStart(2, "0");
  const min = String(dt.getMinutes()).padStart(2, "0");
  return `${m}/${d} ${h}:${min}`;
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
    gap: 4,
    marginBottom: 24,
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
  textInputContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 48,
  },
  parseButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  parseButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  statusBox: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  eventsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  eventDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  eventInfo: {
    flex: 1,
  },
  eventTypeText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  eventTimeText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  registerButton: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
