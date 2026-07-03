import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/lib/theme";
import type { SleepSessionDetail } from "@/lib/api";

interface SleepChartProps {
  sessions: SleepSessionDetail[];
}

export function SleepChart({ sessions }: SleepChartProps) {
  if (sessions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>データがありません</Text>
      </View>
    );
  }

  const maxHours = Math.max(...sessions.map((s) => s.hours), 10);

  return (
    <View style={styles.container}>
      {sessions.map((session, index) => {
        const barWidth = Math.max((session.hours / maxHours) * 100, 8);
        return (
          <View key={index} style={styles.barRow}>
            <Text style={styles.dateLabel}>
              {session.date}({session.weekday})
            </Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${barWidth}%`,
                    backgroundColor:
                      session.hours < 6
                        ? Colors.error
                        : session.hours >= 9
                          ? Colors.nap
                          : Colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={styles.hoursLabel}>{session.hours.toFixed(1)}h</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateLabel: {
    width: 70,
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "right",
  },
  barTrack: {
    flex: 1,
    height: 24,
    backgroundColor: Colors.border,
    borderRadius: 6,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 6,
  },
  hoursLabel: {
    width: 48,
    fontSize: 13,
    color: Colors.text,
    fontWeight: "500",
    textAlign: "right",
  },
});
