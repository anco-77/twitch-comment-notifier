# Twitch コメント通知ツール

Twitch のライブ配信中にコメントを受信したら、通知音を再生するツールです。

## 機能

- Twitch チャットをリアルタイムで監視
- コメント受信時に通知音を再生
- 複数のチャンネルに対応

## インストール

```bash
npm install
```

## セットアップ

### 1. Twitch OAuth トークンの取得

以下のサイトから OAuth トークンを取得してください:
https://twitchtokengenerator.com/

必要なスコープ:
- `chat:read`

### 2. 環境変数の設定

`.env` ファイルを作成して、以下の情報を設定します:

```env
TWITCH_USERNAME=your_username
TWITCH_OAUTH_TOKEN=your_oauth_token
TWITCH_CHANNELS=channel1,channel2,channel3
NOTIFICATION_SOUND_PATH=./sounds/notification.mp3
```

### 3. 通知音の配置

`./sounds/notification.mp3` に通知音ファイルを配置してください。

好きな音声ファイル（MP3, WAV など）を使用できます。

## 実行

### 開発モード（ホットリロードあり）
```bash
npm run dev
```

### ビルド
```bash
npm run build
```

### 実行
```bash
npm start
```

## 環境変数の説明

| 環境変数 | 説明 | 例 |
|---------|------|-----|
| `TWITCH_USERNAME` | Twitch のユーザー名 | `myusername` |
| `TWITCH_OAUTH_TOKEN` | OAuth トークン（`oauth:` プレフィックスなし） | `abcdef1234567890` |
| `TWITCH_CHANNELS` | 監視するチャンネル（カンマ区切り） | `channel1,channel2` |
| `NOTIFICATION_SOUND_PATH` | 通知音ファイルのパス | `./sounds/notification.mp3` |

## 停止

ツールを停止するには、ターミナルで `Ctrl + C` を押します。

## トラブルシューティング

### 通知音が再生されない場合

1. ファイルパスが正しいか確認してください
2. サウンドファイルのフォーマットが対応していることを確認してください
3. ターミナルの音量設定を確認してください

### Twitch に接続できない場合

1. OAuth トークンが有効か確認してください
2. ネットワーク接続を確認してください
3. チャンネル名が正しいか確認してください（# は不要）

## ライセンス

MIT
