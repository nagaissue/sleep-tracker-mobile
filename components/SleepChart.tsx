/**
 * SleepChart — 睡眠時間の日別グラフ（棒グラフ）
 *
 * react-native-svg を使い、Y軸目盛り・グリッドライン・推奨睡眠時間の基準線・
 * 各バーの時間ラベルを備えた本格的なグラフとして描画する。
 * セッション数が多い場合は横スクロールで全件表示できる。
 */

import { Fragment, useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, LayoutChangeEvent } from "react-native";
import Svg, { Rect, Line, Text as SvgText } from "react-native-svg";

import { Colors } from "@/lib/theme";
import type { SleepSessionDetail } from "@/lib/stats";

interface SleepChartProps {
  sessions: SleepSessionDetail[];
}

const CHART_HEIGHT = 200;
const PADDING = { top: 14, bottom: 34, left: 28, right: 12 };
const Y_MAX = 12;
const Y_TICKS = [0, 3, 6, 9, 12];
const RECOMMENDED_HOURS = 7;
const BAR_MIN_SLOT_WIDTH = 44;
const BAR_MAX_WIDTH = 28;

function barColor(hours: number): string {
  if (hours < 6) return Colors.error;
  if (hours >= 9) return Colors.nap;
  return Colors.primary;
}

export function SleepChart({ sessions }: SleepChartProps) {
  const [containerWidth, setContainerWidth] = useState(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  }, []);

  if (sessions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>データがありません</Text>
      </View>
    );
  }

  const availablePlotWidth = Math.max(containerWidth - PADDING.left - PADDING.right, 0);
  const plotWidth = Math.max(availablePlotWidth, sessions.length * BAR_MIN_SLOT_WIDTH);
  const svgWidth = plotWidth + PADDING.left + PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const xStep = plotWidth / sessions.length;
  const barWidth = Math.min(xStep * 0.55, BAR_MAX_WIDTH);

  const yToPixel = (hours: number) =>
    PADDING.top + plotHeight - (Math.min(hours, Y_MAX) / Y_MAX) * plotHeight;

  return (
    <View onLayout={onLayout} style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ minWidth: containerWidth || undefined }}
      >
        <Svg width={svgWidth} height={CHART_HEIGHT}>
          {/* Y軸グリッドライン & 目盛りラベル */}
          {Y_TICKS.map((tick) => {
            const y = yToPixel(tick);
            return (
              <Fragment key={`grid-${tick}`}>
                <Line
                  x1={PADDING.left}
                  y1={y}
                  x2={svgWidth - PADDING.right}
                  y2={y}
                  stroke={Colors.border}
                  strokeWidth={1}
                />
                <SvgText
                  x={PADDING.left - 6}
                  y={y + 3}
                  fontSize={10}
                  fill={Colors.textMuted}
                  textAnchor="end"
                >
                  {tick}
                </SvgText>
              </Fragment>
            );
          })}

          {/* 推奨睡眠時間の基準線 */}
          <Line
            x1={PADDING.left}
            y1={yToPixel(RECOMMENDED_HOURS)}
            x2={svgWidth - PADDING.right}
            y2={yToPixel(RECOMMENDED_HOURS)}
            stroke={Colors.success}
            strokeWidth={1.5}
            strokeDasharray="4,4"
          />

          {/* 各セッションのバー・時間ラベル・日付ラベル */}
          {sessions.map((session, i) => {
            const barH = (Math.min(session.hours, Y_MAX) / Y_MAX) * plotHeight;
            const x = PADDING.left + i * xStep + (xStep - barWidth) / 2;
            const y = PADDING.top + plotHeight - barH;
            return (
              <Fragment key={`bar-${i}`}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barH, 2)}
                  rx={4}
                  fill={barColor(session.hours)}
                />
                <SvgText
                  x={x + barWidth / 2}
                  y={Math.max(y - 4, PADDING.top + 8)}
                  fontSize={10}
                  fontWeight="600"
                  fill={Colors.text}
                  textAnchor="middle"
                >
                  {session.hours.toFixed(1)}
                </SvgText>
                <SvgText
                  x={x + barWidth / 2}
                  y={PADDING.top + plotHeight + 14}
                  fontSize={9}
                  fill={Colors.textMuted}
                  textAnchor="middle"
                >
                  {session.date}
                </SvgText>
                <SvgText
                  x={x + barWidth / 2}
                  y={PADDING.top + plotHeight + 26}
                  fontSize={9}
                  fill={Colors.textMuted}
                  textAnchor="middle"
                >
                  ({session.weekday})
                </SvgText>
              </Fragment>
            );
          })}
        </Svg>
      </ScrollView>

      {/* 凡例 */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDash, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>推奨 {RECOMMENDED_HOURS}h+</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
          <Text style={styles.legendText}>不足(6h未満)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.nap }]} />
          <Text style={styles.legendText}>十分(9h以上)</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    paddingTop: 2,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendDash: {
    width: 12,
    height: 2,
    borderRadius: 1,
  },
  legendText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
