import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { useState, useCallback } from "react";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";

import { Colors, EventColors } from "@/lib/theme";
import {
  parseText,
  registerToCalendar,
  type SleepEvent,
} from "@/lib/api";

type StatusType = "info" | "success" | "error";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [parsedEvents, setParsedEvents] = useState<SleepEvent[]>([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState<StatusType>("info");
  const [isLoading, setIsLoading] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(true);

  // ── 音声認識イベントハンドラ ──────────────────────────
  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results.map((r) => r.transcript).join("");
    setTranscript(text);
    if (event.isFinal) {
      setIsRecording(false);
      handleParse(text);
    }
  });

  useSpeechRecognitionEvent("start", () => {
    setIsRecording(true);
  });

  useSpeechRecognitionEvent("end", () => {
    setIsRecording(false);
  });

  useSpeechRecognitionEvent("error", (event) => {
    setIsRecording(false);
    const code = event.error;
    if (code === "service-not-allowed" || code === "language-not-supported") {
      setSpeechAvailable(false);
      showStatus("音声認識が利用できません。テキスト入力をご利用ください。", "error");
    } else if (code === "not-allowed") {
      setSpeechAvailable(false);
      showStatus("マイクへのアクセス許可が必要です", "error");
    } else if (code === "no-speech" || code === "speech-timeout") {
      showStatus("音声が検出されませんでした。もう一度お試しください。", "error");
    } else {
      showStatus(`音声認識エラー: ${code}`, "error");
    }
  });

  // ── ヘルパー関数 ──────────────────────────────────────
  const showStatus = useCallback((msg: string, type: StatusType = "info") => {
    setStatusMsg(msg);
    setStatusType(type);
  }, []);

  // ── 音声入力 ──────────────────────────────────────────
  const handleMicPress = async () => {
    if (isRecording) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    try {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) {
        showStatus("マイクへのアクセス許可が必要です", "error");
        return;
      }
      setTranscript("");
      setParsedEvents([]);
      setStatusMsg("");
      Keyboard.dismiss();
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      ExpoSpeechRecognitionModule.start({
        lang: "ja-JP",
        interimResults: true,
      });
    } catch {
      setSpeechAvailable(false);
      showStatus("音声認識を開始できません。テキスト入力をご利用ください。", "error");
    }
  };

  // ── テキスト入力から解析 ──────────────────────────────
  const handleTextParse = async () => {
    const text = textInput.trim();
    if (!text) return;
    Keyboard.dismiss();
    setTranscript(text);
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

  // ── Google Calendar に登録 ────────────────────────────
  const handleRegister = async () => {
    if (parsedEvents.length === 0) return;
    showStatus("Googleカレンダーに登録中...", "info");
    setIsLoading(true);
    try {
      const result = await registerToCalendar(parsedEvents);
      showStatus(
        `✅ ${result.created.length}件のイベントを登録しました！`,
        "success"
      );
      setParsedEvents([]);
      setTranscript("");
      setTextInput("");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      showStatus(
        `登録エラー: ${err instanceof Error ? err.message : "不明なエラー"}`,
        "error"
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setParsedEvents([]);
    setTranscript("");
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
        <Text style={styles.subtitle}>音声またはテキストで睡眠を記録</Text>
      </View>

      {/* マイクボタン */}
      <View style={styles.micContainer}>
        <Pressable
          onPress={handleMicPress}
          disabled={isLoading || !speechAvailable}
          style={({ pressed }) => [
            styles.micButton,
            {
              backgroundColor: isRecording ? Colors.error : Colors.primary,
              opacity: !speechAvailable || isLoading ? 0.4 : pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            },
          ]}
        >
          <Text style={styles.micIcon}>{isRecording ? "⏹" : "🎤"}</Text>
        </Pressable>
        <Text style={styles.micLabel}>
          {!speechAvailable
            ? "音声認識非対応（テキスト入力をご利用ください）"
            : isRecording
              ? "話しています...（タップで停止）"
              : "タップして話す"}
        </Text>
      </View>

      {/* テキスト入力（フォールバック） */}
      <View style={styles.textInputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="例: 昨夜11時に就寝して今朝6時半に起床した"
          placeholderTextColor={Colors.textMuted}
          value={textInput}
          onChangeText={setTextInput}
          onSubmitEditing={handleTextParse}
          editable={!isLoading}
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

      {/* 音声認識結果 */}
      {transcript ? (
        <View style={styles.transcriptBox}>
          <Text style={styles.transcriptLabel}>認識されたテキスト:</Text>
          <Text style={styles.transcriptText}>{transcript}</Text>
        </View>
      ) : null}

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
          {isLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginRight: 8 }} />
          ) : null}
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

      {/* イベントプレビュー */}
      {parsedEvents.length > 0 ? (
        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>検出されたイベント:</Text>
          {renderEventPreview()}

          {/* アクションボタン */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              style={[styles.registerButton, isLoading && { opacity: 0.5 }]}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? "登録中..." : "カレンダーに登録"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleClear}
              disabled={isLoading}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* 使い方ガイド */}
      {parsedEvents.length === 0 && !transcript && !statusMsg ? (
        <View style={styles.guideBox}>
          <Text style={styles.guideTitle}>使い方</Text>
          <Text style={styles.guideText}>
            1. マイクボタンをタップして話す{"\n"}
            2. 「昨夜11時に就寝して今朝6時に起床した」のように話す{"\n"}
            3. テキスト入力も可能（音声認識未対応環境用）{"\n"}
            4. イベントが自動で検出されます{"\n"}
            5. 「カレンダーに登録」をタップして保存
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

// ── ユーティリティ ──────────────────────────────────────
function formatDateTime(dt: Date): string {
  const M = dt.getMonth() + 1;
  const D = dt.getDate();
  const H = String(dt.getHours()).padStart(2, "0");
  const m = String(dt.getMinutes()).padStart(2, "0");
  return `${M}/${D} ${H}:${m}`;
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
    gap: 6,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
  },
  micContainer: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 12,
  },
  micButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  micIcon: {
    fontSize: 36,
  },
  micLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
  },
  textInputContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  parseButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  parseButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  transcriptBox: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  transcriptLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  transcriptText: {
    fontSize: 15,
    color: Colors.text,
  },
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  previewSection: {
    gap: 12,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  eventsContainer: {
    gap: 10,
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
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
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  eventTimeText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 2,
  },
  actionButtons: {
    gap: 10,
    marginTop: 8,
  },
  registerButton: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  guideBox: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 16,
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 10,
  },
  guideText: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 22,
  },
});
