# Sleep Tracker Mobile 📱😴

音声入力で「就寝」「起床」「昼寝」の時刻を記録し、アプリ内カレンダーで管理するモバイルアプリ。
Google Calendar APIへの依存なし — すべてのデータはアプリ内のローカルストレージに保存されます。

## 機能

- 🎤 **音声入力** — 日本語で話すだけで睡眠記録を入力（expo-speech-recognition）
- ⌨️ **テキスト入力** — 音声認識未対応環境でもテキスト入力で利用可能
- 🤖 **自然言語解析** — Gemini 2.5 Flash API が時刻情報を自動抽出
- 📅 **アプリ内カレンダー** — 月間ビューで睡眠記録をカラー ドット表示
  - 日をタップするとその日の就寝/起床/昼寝の詳細を表示
  - 前月/翌月へのナビゲーション対応
- 💾 **ローカルストレージ** — AsyncStorage でデータをアプリ内に保存（ネットワーク不要）
- 📊 **睡眠統計ダッシュボード** — 過去7日間の平均睡眠時間、就寝/起床時刻、日別チャート
  - 就寝↔起床のペアリングで実際の睡眠時間を自動計算

## 技術スタック

| 項目 | 技術 |
|------|------|
| フロントエンド | Expo SDK 52 + React Native + TypeScript |
| 音声認識 | expo-speech-recognition (Android SpeechRecognizer / iOS SFSpeechRecognizer) |
| 自然言語解析 | Gemini 2.5 Flash API（Vercel バックエンド経由） |
| データ保存 | @react-native-async-storage/async-storage（アプリ内ローカル） |
| 統計計算 | クライアント側（lib/stats.ts） |
| バックエンド | Python 3.12 + Vercel Serverless Functions（テキスト解析のみ） |

## アーキテクチャ

```
音声/テキスト入力
      ↓
Gemini 2.5 Flash解析（Vercel /api/parse）
      ↓
SleepEvent[] （就寝/起床/昼寝 + 日時）
      ↓
AsyncStorage にローカル保存
      ↓
カレンダー表示 / 統計計算（すべてアプリ内で完結）
```

Google Calendar APIは使用しません。データはデバイス内のAsyncStorageに保存され、ネットワーク接続なしでもカレンダー閲覧・統計確認が可能です。

## イベントカラー

| イベント | カラー | 説明 |
|---------|--------|------|
| 就寝 | 紺（#1e3a8a） | 睡眠開始を示す |
| 起床 | オレンジ×黄（#f97316） | 睡眠終了を示す |
| 昼寝 | 青（#3b82f6） | 昼間の仮眠を示す |

## API エンドポイント（Vercel バックエンド）

| エンドポイント | メソッド | 説明 | 使用状況 |
|---------------|---------|------|---------|
| `/api/parse` | POST | Gemini 2.5 Flash でテキスト解析 | ✅ 使用中 |
| `/api/calendar` | POST | Google Calendar にイベント登録 | ❌ 廃止（v2.0.0〜） |
| `/api/stats` | GET | 睡眠統計データを取得 | ❌ 廃止（v2.0.0〜） |

> **注意:** `/api/calendar` と `/api/stats` は v2.0.0 で廃止されました。統計計算はクライアント側（`lib/stats.ts`）で行われます。

## セットアップ

### 前提条件

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Android Studio（Android ビルド用）または EAS CLI

### インストール

```bash
npm install --legacy-peer-deps
```

### 開発

```bash
# 開発サーバー起動（Expo Go では音声認識不可 — Development Build が必要）
npx expo start

# Android 向け Development Build
npx expo run:android

# iOS 向け Development Build
npx expo run:ios
```

### ビルド（APK / AAB）

#### ローカルビルドの場合

```bash
# Android プロジェクトを生成
npx expo prebuild --platform android

# APK ビルド
cd android && ./gradlew assembleRelease
```

生成されたAPKは以下に配置されます：
```
android/app/build/outputs/apk/release/app-release.apk
```

#### EAS Build を使用する場合

```bash
# EAS CLI インストール
npm install -g eas-cli

# ログイン
eas login

# ビルド設定初期化
eas build:configure

# APK ビルド（プレビュー用）
eas build --platform android --profile preview

# AAB ビルド（ストア申請用）
eas build --platform android --profile production
```

### 環境変数

必要に応じて `.env` ファイルを作成：

```
EXPO_PUBLIC_API_BASE_URL=https://your-vercel-app.vercel.app
```

未設定の場合はデフォルトURL（`https://sleep-tracker-app-three.vercel.app`）が使用されます。

## プロジェクト構成

```
├── app/
│   ├── _layout.tsx          # ルートレイアウト（SafeAreaProvider + Stack）
│   ├── (tabs)/
│   │   ├── _layout.tsx      # タブナビゲーション（記録 / カレンダー / 統計 / 設定）
│   │   ├── index.tsx        # 記録タブ — 音声/テキスト入力 → Gemini解析 → ローカル保存
│   │   ├── calendar.tsx     # カレンダータブ — 月間カレンダー（カラードット + 日詳細）
│   │   ├── stats.tsx        # 統計タブ — 睡眠統計ダッシュボード（ローカル計算）
│   │   └── settings.tsx     # 設定タブ — データ管理・API状態・カラー凡例・技術情報
│   └── +not-found.tsx       # 404 ページ
├── components/
│   └── SleepChart.tsx       # 日別睡眠時間バーチャート
├── lib/
│   ├── api.ts               # Vercel API クライアント（parseText のみ）
│   ├── storage.ts           # AsyncStorage CRUD（ローカルデータ管理）
│   ├── stats.ts             # ローカル統計計算（就寝↔起床ペアリング含む）
│   └── theme.ts             # カラー・テーマ定数
├── assets/
│   └── images/              # アプリアイコン・スプラッシュ画面
├── app.json                 # Expo 設定
├── package.json
└── tsconfig.json
```

## バックエンド

バックエンドは別リポジトリ `sleep-tracker-app` で管理：
- Python 3.12 + Vercel Serverless Functions
- Gemini 2.5 Flash API による自然言語解析（`/api/parse` のみ使用）
- Google Calendar API連携コード（`/api/calendar`, `/api/stats`）は残存するが未使用

## 変更履歴

### v2.0.0
- Google Calendar API連携を廃止し、アプリ内ローカルストレージに切り替え
- 新規「カレンダー」タブ追加（月間ビュー、カラー ドット表示）
- 統計計算をクライアント側に移行（Vercel /api/stats 不要）
- データ管理機能追加（全削除、レコード数表示）

### v1.0.0
- 初期リリース
- Google Calendar API v3 連携
- 音声認識 + Gemini 2.5 Flash 解析
- 睡眠統計ダッシュボード
