import { ScrollView, Text, View } from "react-native";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";

interface DailySleep {
  date: string;
  hours: number;
}

interface StatsData {
  avgSleepHours: number | null;
  napCount: number;
  avgBedtime: string;
  avgWaketime: string;
  dailySleepHours: DailySleep[];
}

export default function StatsScreen() {
  const [stats, setStats] = useState<StatsData>({
    avgSleepHours: null,
    napCount: 0,
    avgBedtime: "--:--",
    avgWaketime: "--:--",
    dailySleepHours: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data for demo
      const mockStats: StatsData = {
        avgSleepHours: 7.2,
        napCount: 2,
        avgBedtime: "23:30",
        avgWaketime: "06:45",
        dailySleepHours: [
          { date: "7/1", hours: 6.5 },
          { date: "7/2", hours: 7.0 },
          { date: "7/3", hours: 7.5 },
          { date: "7/4", hours: 8.0 },
          { date: "7/5", hours: 7.2 },
          { date: "7/6", hours: 6.8 },
          { date: "7/7", hours: 7.3 },
        ],
      };

      setStats(mockStats);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const maxHours = Math.max(...stats.dailySleepHours.map((d) => d.hours), 10);

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-3xl font-bold text-foreground">睡眠統計</Text>
            <Text className="text-sm text-muted">過去7日間のデータ</Text>
          </View>

          {isLoading ? (
            <View className="items-center justify-center py-12">
              <Text className="text-base text-muted">統計を読み込み中...</Text>
            </View>
          ) : (
            <>
              {/* Key Stats */}
              <View className="gap-3">
                {/* Average Sleep */}
                <View className="bg-surface rounded-2xl p-6 border border-border">
                  <Text className="text-sm text-muted mb-1">平均睡眠時間</Text>
                  <Text className="text-3xl font-bold text-foreground">
                    {stats.avgSleepHours !== null ? `${stats.avgSleepHours.toFixed(1)}` : "--"}
                    <Text className="text-lg"> 時間</Text>
                  </Text>
                </View>

                {/* Nap Count */}
                <View className="bg-surface rounded-2xl p-6 border border-border">
                  <Text className="text-sm text-muted mb-1">昼寝の回数</Text>
                  <Text className="text-3xl font-bold text-foreground">{stats.napCount}</Text>
                </View>

                {/* Bedtime & Waketime */}
                <View className="flex-row gap-3">
                  <View className="flex-1 bg-surface rounded-2xl p-6 border border-border">
                    <Text className="text-sm text-muted mb-1">平均就寝時刻</Text>
                    <Text className="text-2xl font-bold text-foreground">{stats.avgBedtime}</Text>
                  </View>
                  <View className="flex-1 bg-surface rounded-2xl p-6 border border-border">
                    <Text className="text-sm text-muted mb-1">平均起床時刻</Text>
                    <Text className="text-2xl font-bold text-foreground">{stats.avgWaketime}</Text>
                  </View>
                </View>
              </View>

              {/* Daily Sleep Chart */}
              <View className="bg-surface rounded-2xl p-6 border border-border">
                <Text className="text-base font-semibold text-foreground mb-4">日別睡眠時間</Text>

                <View className="gap-4">
                  {stats.dailySleepHours.map((day, index) => {
                    const barHeight = (day.hours / maxHours) * 150;
                    return (
                      <View key={index} className="gap-2">
                        <View className="flex-row items-end gap-3">
                          <Text className="w-10 text-sm text-muted text-right">{day.date}</Text>
                          <View
                            style={{
                              height: barHeight,
                              backgroundColor: "#0a7ea4",
                              borderRadius: 4,
                              minHeight: 20,
                            }}
                            className="flex-1"
                          />
                          <Text className="w-12 text-sm text-foreground text-right">
                            {day.hours.toFixed(1)}h
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Info Card */}
              <View className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
                <Text className="text-sm font-semibold text-blue-900 mb-2">💡 ヒント</Text>
                <Text className="text-sm text-blue-800 leading-relaxed">
                  健康的な睡眠時間は1日7～9時間です。毎日の睡眠パターンを記録することで、より良い睡眠習慣を形成できます。
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
