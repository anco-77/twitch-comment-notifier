import * as tmi from 'tmi.js';
import playSound from 'play-sound';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { execSync } from 'child_process';
import * as fs from 'fs';

// 環境変数を読み込む
dotenv.config();

interface Config {
  username: string;
  oauth_token: string;
  channels: string[];
  notification_sound_path: string;
}

class TwitchCommentNotifier {
  private client: tmi.Client;
  private player: any;
  private config: Config;
  private isConnected: boolean = false;

  constructor() {
    // 環境変数から設定を読み込む
    this.config = {
      username: process.env.TWITCH_USERNAME || '',
      oauth_token: process.env.TWITCH_OAUTH_TOKEN || '',
      channels: (process.env.TWITCH_CHANNELS || '').split(',').map(c => c.trim()),
      notification_sound_path: process.env.NOTIFICATION_SOUND_PATH || './sounds/notification.mp3'
    };

    // 設定の検証
    if (!this.config.username || !this.config.oauth_token || this.config.channels.length === 0) {
      throw new Error('環境変数が不足しています。.env ファイルを確認してください。');
    }

    // Twitch クライアントを初期化
    this.client = new tmi.Client({
      options: { debug: false },
      connection: {
        reconnect: true,
        secure: true
      },
      identity: {
        username: this.config.username,
        password: `oauth:${this.config.oauth_token}`
      },
      channels: this.config.channels
    });

    // play-sound を初期化
    this.player = playSound();

    // イベントハンドラーを登録
    this.registerEventHandlers();
  }

  private registerEventHandlers(): void {
    // 接続成功時
    this.client.on('connected', () => {
      this.isConnected = true;
      console.log(`✓ Twitch に接続しました。チャンネル: ${this.config.channels.join(', ')}`);
    });

    // 切断時
    this.client.on('disconnected', (reason) => {
      this.isConnected = false;
      console.log(`✗ Twitch から切断しました。理由: ${reason}`);
    });

    // チャットメッセージ受信時
    this.client.on('message', (channel: string, tags: tmi.ChatUserstate, message: string, self: boolean) => {
      // ボット自身のメッセージは無視
      if (self) return;

      // ユーザー情報
      const username = tags['display-name'] || tags.username || '不明';
      
      console.log(`[${channel}] ${username}: ${message}`);

      // 通知音を再生
      this.playNotification();
    });

    // エラーハンドラー
    this.client.on('error' as any, (error: Error) => {
      console.error('エラーが発生しました:', error.message);
    });
  }

  private playNotification(): void {
    try {
      // WSL2またはLinuxの場合の処理
      if (this.isWSL()) {
        this.playNotificationOnWSL();
      } else if (process.platform === 'win32') {
        this.playNotificationOnWindows();
      } else {
        // その他のプラットフォーム（macOS、Linux など）
        this.player.play(this.config.notification_sound_path, (err: any) => {
          if (err) {
            console.error('通知音の再生に失敗しました:', err.message);
          }
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('通知音の再生エラー:', error.message);
      }
    }
  }

  private isWSL(): boolean {
    try {
      const procVersion = fs.readFileSync('/proc/version', 'utf8');
      return procVersion.toLowerCase().includes('microsoft') || procVersion.toLowerCase().includes('wsl');
    } catch {
      return false;
    }
  }

  private playNotificationOnWSL(): void {
    try {
      let soundPath = this.config.notification_sound_path;
      
      // Windows パス（C:\... または C:/...）かどうか判定
      const isWindowsPath = /^[a-zA-Z]:[/\\]/.test(soundPath);
      
      if (!isWindowsPath) {
        // Linux パスの場合は /mnt/c に変換
        soundPath = soundPath
          .replace(/^\/mnt\/([a-z])\//, '$1:\\')
          .replace(/\//g, '\\');
      }
      
      // バックスラッシュをエスケープ
      const escapedPath = soundPath.replace(/\\/g, '\\\\');
      
      // PowerShellコマンドを実行（Start-Process で既定のプレイヤーで再生）
      const psCommand = `Start-Process '${escapedPath}'`;
      execSync(`powershell.exe -Command "${psCommand}"`, { stdio: 'ignore' });
    } catch (error) {
      if (error instanceof Error) {
        console.error('WSL2での音声再生に失敗しました:', error.message);
      }
    }
  }

  private playNotificationOnWindows(): void {
    try {
      const soundPath = path.resolve(this.config.notification_sound_path);
      const psCommand = `(New-Object Media.SoundPlayer "${soundPath}").PlaySync()`;
      execSync(`powershell.exe -Command "${psCommand}"`, { stdio: 'ignore' });
    } catch (error) {
      if (error instanceof Error) {
        console.error('Windows での音声再生に失敗しました:', error.message);
      }
    }
  }

  public async connect(): Promise<void> {
    try {
      console.log('Twitch に接続中...');
      await this.client.connect();
    } catch (error) {
      if (error instanceof Error) {
        console.error('接続エラー:', error.message);
      }
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await this.client.disconnect();
        console.log('Twitch から切断しました。');
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('切断エラー:', error.message);
      }
    }
  }
}

// メイン処理
async function main(): Promise<void> {
  const notifier = new TwitchCommentNotifier();

  // グレースフルシャットダウンを設定
  process.on('SIGINT', async () => {
    console.log('\n\nシャットダウン中...');
    await notifier.disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n\nシャットダウン中...');
    await notifier.disconnect();
    process.exit(0);
  });

  try {
    await notifier.connect();
  } catch (error) {
    console.error('起動に失敗しました。');
    process.exit(1);
  }
}

main();
