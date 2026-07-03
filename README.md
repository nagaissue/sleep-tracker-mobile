# Sleep Tracker Mobile 📱😴

音声入力で「就寝」「起床」「昼寝」の時刻をGoogleカレンダーに自動記録するモバイルアプリ。

## 機能

- 🎤 **音声入力** — 日本語で話すだけで睡眠記録を入力（expo-speech-recognition）
- ⌨️ **テキスト入力** — 音声認識未対応環境でもテキスト入力で利用可能
- 🤖 **自然言語解析** — Gemini 2.5 Flash API が時刻情報を自動抽出
- 📅 **Google Calendar連携** — 就寝・起床・昼寝を自動でカレンダーに登録
  - 就寝 → 起床をペアリングし、実際の睡眠時間を1つのイベントとして登録
- 📊 **睡眠統計ダッシュボード** — 過去7日間の平均睡眠時間、就寝/起床時刻、日別チャート

## 技術スタック

| 項目 | 技術 |
|------|------|
| フロントエンド | Expo SDK 52 + React Native + TypeScript |
| 音声認識 | expo-speech-recognition (Android SpeechRecognizer / iOS SFSpeechRecognizer) |
| 自然言語解析 | Gemini 2.5 Flash API |
| カレンダー連携 | Google Calendar API v3 |
| バックエンド | Python 3.12 + Vercel Serverless Functions |
| 認証 | サーバー側リフレッシュトークン管理（クライアント認証なし） |

## イベントカラー

| イベント | カラー | Google Calendar colorId |
|---------|--------|------------------------|
| 就寝 | 紺（Blueberry） | 9 |
| 起床 | オレンジ×黄（Tangerine） | 6 |
| 昼寝 | 青（Lavender） | 1 |

## API エンドポイント（Vercel バックエンド）

- `POST /api/parse` — Gemini 2.5 Flash でテキスト解析
- `POST /api/calendar` — Google Calendar にイベント登録（就寝・起床ペアリング機能）
- `GET /api/stats?days=7` — 睡眠統計データを取得

## セットアップ

### 前提条件

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Android Studio（Android ビルド用）または EAS CLI

### インストール

```bash
npm install
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

#### ローカルビルドの場合

```bash
# Android プロジェクトを生成
npx expo prebuild --platform android

# APK ビルド
cd android && ./gradlew assembleRelease
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
│   │   ├── _layout.tsx      # タブナビゲーション（記録 / 統計 / 設定）
│   │   ├── index.tsx        # 記録タブ — 音声入力 + テキスト入力 + カレンダー登録
│   │   ├── stats.tsx        # 統計タブ — 睡眠統計ダッシュボード
│   │   └── settings.tsx     # 設定タブ — API状態・カラー凡例・技術情報
│   └── +not-found.tsx       # 404 ページ
├── components/
│   └── SleepChart.tsx       # 日別睡眠時間バーチャート
├── lib/
│   ├── api.ts               # Vercel API クライアント
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
- Gemini 2.5 Flash API による自然言語解析
- Google Calendar API v3（サーバー側リフレッシュトークン認証）
