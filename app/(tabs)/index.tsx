import { ScrollView, Text, View, TouchableOpacity, Pressable } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";

import * as Haptics from "expo-haptics";

interface SleepEvent {
  type: "就寝" | "起床" | "昼寝";
  datetime: string;
  colorId: string;
}

const EVENT_COLORS: Record<string, string> = {
  就寝: "#1e3a8a", // Navy blue
  起床: "#f97316", // Orange
  昼寝: "#a78bfa", // Lavender
};

const EVENT_COLORS_LIGHT: Record<string, string> = {
  就寝: "#3b82f6", // Light blue
  起床: "#fb923c", // Light orange
  昼寝: "#c4b5fd", // Light lavender
};

export default function HomeScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsedEvents, setParsedEvents] = useState<SleepEvent[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<"info" | "success" | "error">("info");
  const [isLoading, setIsLoading] = useState(false);

  // Mock function to simulate API call for text parsing
  const parseText = async (text: string) => {
    setStatusMessage("テキストを解析中...");
    setStatusType("info");
    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock parsing logic - in real app, this would call the backend API
      const events: SleepEvent[] = [];

      // Simple pattern matching for demo
      if (text.includes("就寝") || text.includes("寝た")) {
        const timeMatch = text.match(/(\d{1,2})[時:：](\d{1,2})?/);
        if (timeMatch) {
          const hour = timeMatch[1];
          const minute = timeMatch[2] || "00";
          events.push({
            type: "就寝",
            datetime: `2026-07-02T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00+09:00`,
            colorId: "9",
          });
        }
      }

      if (text.includes("起床") || text.includes("起きた")) {
        const timeMatch = text.match(/(\d{1,2})[時:：](\d{1,2})?/);
        if (timeMatch) {
          const hour = timeMatch[1];
          const minute = timeMatch[2] || "00";
          events.push({
            type: "起床",
            datetime: `2026-07-02T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00+09:00`,
            colorId: "6",
          });
        }
      }

      if (text.includes("昼寝") || text.includes("仮眠")) {
        events.push({
          type: "昼寝",
          datetime: `2026-07-02T14:00:00+09:00`,
          colorId: "1",
        });
      }

      if (events.length > 0) {
        setParsedEvents(events);
        setStatusMessage(`${events.length}件のイベントを検出しました`);
        setStatusType("success");
      } else {
        setStatusMessage("イベントが検出されませんでした");
        setStatusType("info");
      }
    } catch (error) {
      setStatusMessage(`エラー: ${error instanceof Error ? error.message : "不明なエラー"}`);
      setStatusType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicPress = async () => {
    if (isRecording) {
      setIsRecording(false);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      setIsRecording(true);
      setTranscript("");
      setParsedEvents([]);
      setStatusMessage("");
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Simulate speech recognition
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const mockTranscript = "昨夜11時に就寝して今朝6時に起床した";
        setTranscript(mockTranscript);
        setIsRecording(false);
        await parseText(mockTranscript);
      } catch (error) {
        setStatusMessage("音声認識エラー");
        setStatusType("error");
        setIsRecording(false);
      }
    }
  };

  const handleRegisterCalendar = async () => {
    if (parsedEvents.length === 0) return;

    setStatusMessage("Googleカレンダーに登録中...");
    setStatusType("info");
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setStatusMessage(`✅ ${parsedEvents.length}件のイベントをカレンダーに登録しました！`);
      setStatusType("success");
      setParsedEvents([]);
      setTranscript("");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      setStatusMessage(`登録エラー: ${error instanceof Error ? error.message : "不明なエラー"}`);
      setStatusType("error");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearPreview = () => {
    setParsedEvents([]);
    setTranscript("");
    setStatusMessage("");
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-4xl font-bold text-foreground">😴 Sleep Tracker</Text>
            <Text className="text-base text-muted text-center">
              音声で睡眠を記録しよう
            </Text>
          </View>

          {/* Microphone Button */}
          <View className="items-center py-8">
            <Pressable
              onPress={handleMicPress}
              disabled={isLoading}
              style={({ pressed }) => [
                {
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: isRecording ? "#ef4444" : "#0a7ea4",
                  justifyContent: "center",
                  alignItems: "center",
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                  opacity: isLoading ? 0.5 : 1,
                },
              ]}
            >
              <Text className="text-4xl">{isRecording ? "🔴" : "🎤"}</Text>
            </Pressable>
            <Text className="text-sm text-muted mt-4 text-center">
              {isRecording ? "話しています..." : "タップして話す"}
            </Text>
          </View>

          {/* Transcript Display */}
          {transcript && (
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-sm text-muted mb-2">認識されたテキスト:</Text>
              <Text className="text-base text-foreground">{transcript}</Text>
            </View>
          )}

          {/* Status Message */}
          {statusMessage && (
            <View
              className={`rounded-2xl p-4 border ${
                statusType === "success"
                  ? "bg-green-50 border-green-200"
                  : statusType === "error"
                    ? "bg-red-50 border-red-200"
                    : "bg-blue-50 border-blue-200"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  statusType === "success"
                    ? "text-green-800"
                    : statusType === "error"
                      ? "text-red-800"
                      : "text-blue-800"
                }`}
              >
                {statusMessage}
              </Text>
            </View>
          )}

          {/* Events Preview */}
          {parsedEvents.length > 0 && (
            <View className="gap-3">
              <Text className="text-sm font-semibold text-foreground">検出されたイベント:</Text>
              {parsedEvents.map((event, index) => {
                const eventColor = EVENT_COLORS[event.type] || "#0a7ea4";
                const timeStr = event.datetime.split("T")[1]?.substring(0, 5) || "--:--";

                return (
                  <View
                    key={index}
                    className="flex-row items-center gap-3 bg-surface rounded-xl p-4 border border-border"
                  >
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: eventColor,
                      }}
                    />
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">
                        {event.type}
                      </Text>
                      <Text className="text-sm text-muted">{timeStr}</Text>
                    </View>
                  </View>
                );
              })}

              {/* Action Buttons */}
              <View className="gap-3 mt-4">
                <TouchableOpacity
                  onPress={handleRegisterCalendar}
                  disabled={isLoading}
                  style={{ opacity: isLoading ? 0.5 : 1 }}
                  className="bg-primary px-6 py-3 rounded-full items-center"
                >
                  <Text className="text-background font-semibold">
                    {isLoading ? "登録中..." : "カレンダーに登録"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleClearPreview}
                  disabled={isLoading}
                  className="bg-surface border border-border px-6 py-3 rounded-full items-center"
                >
                  <Text className="text-foreground font-semibold">キャンセル</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Info Card */}
          {parsedEvents.length === 0 && !transcript && (
            <View className="bg-surface rounded-2xl p-6 border border-border mt-auto">
              <Text className="text-lg font-semibold text-foreground mb-3">
                使い方
              </Text>
              <Text className="text-sm text-muted leading-relaxed">
                1. マイクボタンをタップして話す{"\n"}
                2. 「昨夜11時に就寝して今朝6時に起床した」のように話す{"\n"}
                3. イベントが自動で検出されます{"\n"}
                4. 「カレンダーに登録」をタップして保存
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
