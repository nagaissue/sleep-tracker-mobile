# Sleep Tracker App - GitHub Requirements

## 概要
Android向け睡眠記録アプリ。音声入力で「就寝」「起床」「昼寝」の時刻をGoogleカレンダーに自動記録する。

## 技術スタック（参考）
- フロントエンド: HTML / CSS / JavaScript (PWA)
- 自然言語解析: Gemini 2.5 Flash API
- カレンダー連携: Google Calendar API v3
- バックエンド: Python 3.12 (Vercel Serverless Functions)
- 音声入力: Web Speech API

## コア機能
1. **音声入力**: Web Speech API で日本語の音声認識
2. **自然言語解析**: Gemini 2.5 Flash で「就寝」「起床」「昼寝」の時刻を抽出
3. **Google Calendar連携**: 解析結果をGoogleカレンダーに自動登録
4. **睡眠統計ダッシュボード**: 過去7日間の睡眠統計を表示

## イベントカラー
| イベント | カラー | Google Calendar colorId |
|---------|--------|------------------------|
| 就寝 | 紺（Blueberry） | 9 |
| 起床 | オレンジ×黄（Tangerine） | 6 |
| 昼寝 | 青（Lavender） | 1 |

## API エンドポイント
- POST /api/parse: テキストから睡眠イベントを解析
- POST /api/calendar: イベントをGoogleカレンダーに登録
- GET /api/stats: 睡眠統計を取得

## 認証方式
- 個人利用専用のため認証機能は最小限
- サーバー側でリフレッシュトークンを管理
- フロントエンドはトークンを保持しない

## モバイルアプリ化の方針
- Expo + React Native + TypeScript で実装
- 音声入力、カレンダー連携、統計表示の機能を実装
- Gemini 2.5 Flash API を使用した自然言語解析
- Google Calendar API との連携
