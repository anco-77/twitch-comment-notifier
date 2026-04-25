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

### 2. OAuth トークンの自動取得（Device Code Grant Flow）

以下のコマンドでセットアップツールを実行します:

```bash
npm run setup
```

セットアップツールが起動し、以下を求められます:
1. Client ID を入力

その後、以下が表示されます:
- ユーザーコード（8文字）
- 認可用 URL

**ユーザーコード**をメモして、表示された URL をブラウザで開き、コードを入力して認可します。

認可が完了すると、トークンが自動的に `.env` ファイルに保存されます。

**重要**: Device Code Grant Flow を使用しているため、`client_secret` は保存されません。これにより以下のセキュリティメリットがあります:
- `.env` に秘密鍵が保存されない
- ローカルマシンに秘密情報が残らない
- リフレッシュトークンのみで自動更新が可能

### 3. 環境変数の設定

`.env` ファイルに以下の情報を追記します:

```env
TWITCH_CLIENT_ID=your_client_id
TWITCH_USERNAME=your_twitch_username
TWITCH_CHANNELS=channel1,channel2,channel3
NOTIFICATION_SOUND_PATH=./sounds/notification.mp3
TWITCH_OAUTH_TOKEN=auto_saved_by_setup_tool
TWITCH_REFRESH_TOKEN=auto_saved_by_setup_tool
```

- `TWITCH_CLIENT_ID`: Twitch 開発者コンソールで取得したクライアント ID（セットアップツールで自動保存）
- `TWITCH_USERNAME`: Twitch のユーザー名（小文字）
- `TWITCH_CHANNELS`: 通知したいチャンネル名（カンマ区切り）
- `NOTIFICATION_SOUND_PATH`: 通知音ファイル
- `TWITCH_OAUTH_TOKEN`: セットアップツールで自動設定されたアクセストークン
- `TWITCH_REFRESH_TOKEN`: セットアップツールで自動設定されたリフレッシュトークン（トークン自動更新に必要）

**注意**: `TWITCH_CLIENT_SECRET` は必要ありません（セキュリティ上の理由）

#### WSL2を使用している場合

Windows側に音声ファイルを配置して、Windows パスを指定してください:

```env
NOTIFICATION_SOUND_PATH=C:/Users/YourUsername/notification.mp3
```

または `/mnt/c/` パスで指定：

```env
NOTIFICATION_SOUND_PATH=/mnt/c/Users/YourUsername/notification.mp3
```

#### 音声再生について（WSL2）

このアプリケーションは、WSL2上で実行される場合、Windows上の既定のサウンドプレイヤー（Groove Music など）が自動で起動して、指定された音声ファイルが再生されます。

コメント受信時に既定のサウンドプレイヤーウィンドウが開き、音が再生されます。

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

### トークン更新エラーが表示される場合

Device Code Grant Flow のリフレッシュトークンは以下の特性があります:

- **30日間の有効期限**: パブリッククライアント型のため、リフレッシュトークンは 30日以上使用しないと失効します
- **ワンタイム使用**: 使用すると新しいリフレッシュトークンに更新されます（自動的に .env に保存）

30日以上アプリケーションを実行していない場合は、以下のコマンドで再度セットアップしてください:

```bash
npm run setup
```

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
