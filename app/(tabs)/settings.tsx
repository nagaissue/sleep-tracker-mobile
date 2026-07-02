import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";

export default function SettingsScreen() {
  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-3xl font-bold text-foreground">設定</Text>
          </View>

          {/* Settings Sections */}
          <View className="gap-4">
            {/* Google Calendar Status */}
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <Text className="text-base font-semibold text-foreground mb-3">
                Google Calendar 連携
              </Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted">連携状態</Text>
                <View className="bg-green-100 px-3 py-1 rounded-full">
                  <Text className="text-xs font-semibold text-green-800">接続済み</Text>
                </View>
              </View>
              <Text className="text-xs text-muted mt-3">
                イベントは自動的にあなたのGoogleカレンダーに登録されます。
              </Text>
            </View>

            {/* API Status */}
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <Text className="text-base font-semibold text-foreground mb-3">
                API設定
              </Text>
              <View className="gap-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-muted">Gemini API</Text>
                  <View className="bg-green-100 px-3 py-1 rounded-full">
                    <Text className="text-xs font-semibold text-green-800">有効</Text>
                  </View>
                </View>
                <Text className="text-xs text-muted">
                  自然言語解析に使用されます。
                </Text>
              </View>
            </View>

            {/* App Info */}
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <Text className="text-base font-semibold text-foreground mb-3">
                アプリ情報
              </Text>
              <View className="gap-2">
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted">アプリ名</Text>
                  <Text className="text-sm text-foreground font-medium">Sleep Tracker</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-sm text-muted">バージョン</Text>
                  <Text className="text-sm text-foreground font-medium">1.0.0</Text>
                </View>
              </View>
            </View>

            {/* Help & Support */}
            <View className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
              <Text className="text-base font-semibold text-blue-900 mb-3">
                💡 ヒント
              </Text>
              <Text className="text-sm text-blue-800 leading-relaxed">
                より正確な睡眠記録のために、「昨夜11時に就寝して今朝6時に起床した」のように、具体的な時刻を含めて話してください。
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View className="mt-auto pt-6 border-t border-border">
            <Text className="text-xs text-muted text-center">
              Sleep Tracker App v1.0.0{"\n"}
              © 2026 Sleep Tracker
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
