import { Link, Stack } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/lib/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "ページが見つかりません" }} />
      <View style={styles.container}>
        <Text style={styles.title}>404</Text>
        <Text style={styles.text}>このページは存在しません。</Text>
        <Link href="/" style={styles.link}>
          ホームに戻る
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: Colors.textMuted,
    marginBottom: 24,
  },
  link: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: "600",
  },
});
