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

### 1. Client ID と Client Secret の取得

以下のサイトで Twitch Application を登録してください:
https://dev.twitch.tv/console/apps

登録後、以下の情報を取得します:
- Client ID
- Client Secret

必要なリダイレクト URI:
- `http://localhost:3000/callback`

### 2. OAuth トークンの自動取得

以下のコマンドでセットアップツールを実行します:

```bash
npm run setup
```

セットアップツールが起動し、以下を求められます:
1. Client ID を入力
2. Client Secret を入力

その後、表示されたURLをブラウザで開きます。

認可を完了すると、トークンが自動的に `.env` ファイルに保存されます。

### 3. 環境変数の設定

`.env` ファイルに以下の情報を追記します:

```env
TWITCH_USERNAME=your_twitch_username
TWITCH_CHANNELS=channel1,channel2,channel3
NOTIFICATION_SOUND_PATH=./sounds/notification.mp3
```

- `TWITCH_USERNAME`: Twitch のユーザー名（小文字）
- `TWITCH_CHANNELS`: 通知したいチャンネル名（カンマ区切り）
- `NOTIFICATION_SOUND_PATH`: 通知音ファイル
- `TWITCH_OAUTH_TOKEN`: セットアップツールで自動設定されたトークン

#### セキュリティに関する注意

- `.env` ファイルを Git リポジトリにコミットしないでください
- OAuth トークンを他者と共有しないでください
- トークンが漏洩した場合は、すぐに Twitch のセキュリティ設定から無効化してください

`./sounds/notification.mp3` に通知音ファイルを配置してください。  
好きな音声ファイル（MP3, WAV など）を使用できます。

## 実行

### セットアップ（初回のみ）
```bash
npm run setup
```

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
