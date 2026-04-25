import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as readline from 'readline';

const SCOPES = ['chat:read'];

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string[];
}

class OAuthSetup {
  private clientId: string = '';

  async start(): Promise<void> {
    console.log('\n=== Twitch OAuth トークン取得ツール ===\n');

    // クライアント ID を入力
    await this.getClientId();

    // Device Code Flow を開始
    await this.startDeviceCodeFlow();
  }

  private async getClientId(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('Twitch Client ID を入力してください: ', (clientId) => {
        this.clientId = clientId;
        rl.close();
        resolve();
      });
    });
  }

  private async startDeviceCodeFlow(): Promise<void> {
    try {
      // ステップ1: Device Code を取得
      const deviceCodeResponse = await this.getDeviceCode();
      
      console.log('\n========================================');
      console.log('以下のコードをブラウザに入力してください:');
      console.log(`\n  ${deviceCodeResponse.user_code}`);
      console.log('\n========================================');
      console.log(`以下のURLにアクセスしてください:\n${deviceCodeResponse.verification_uri}\n`);

      // ステップ2: ユーザーの認可を待ち、トークンを取得
      const token = await this.pollForToken(
        deviceCodeResponse.device_code,
        deviceCodeResponse.interval,
        deviceCodeResponse.expires_in
      );

      // ステップ3: トークンを .env に保存
      await this.saveToken(token.access_token, token.refresh_token);

      console.log('\n✓ OAuth トークンが正常に取得されました。');
      console.log('アプリケーションを実行してください。\n');
    } catch (error) {
      if (error instanceof Error) {
        console.error('エラーが発生しました:', error.message);
      }
      process.exit(1);
    }
  }

  private async getDeviceCode(): Promise<DeviceCodeResponse> {
    const response = await axios.post('https://id.twitch.tv/oauth2/device', null, {
      params: {
        client_id: this.clientId,
        scopes: SCOPES.join(' ')
      }
    });

    return response.data as DeviceCodeResponse;
  }

  private async pollForToken(
    deviceCode: string,
    interval: number,
    expiresIn: number
  ): Promise<TokenResponse> {
    const startTime = Date.now();
    const expirationTime = startTime + expiresIn * 1000;

    while (Date.now() < expirationTime) {
      try {
        const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
          params: {
            client_id: this.clientId,
            scopes: SCOPES.join(' '),
            device_code: deviceCode,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
          }
        });

        return response.data as TokenResponse;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          const errorMessage = error.response.data?.message;
          
          // authorization_pending の場合は待機
          if (errorMessage === 'authorization_pending') {
            console.log('待機中...');
            await this.delay(interval * 1000);
            continue;
          }

          // その他のエラーは throw
          throw new Error(`トークン取得エラー: ${errorMessage || error.message}`);
        }
        throw error;
      }
    }

    throw new Error('認可がタイムアウトしました。もう一度実行してください。');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async saveToken(token: string, refreshToken: string): Promise<void> {
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';

    // 既存の .env ファイルを読み込む
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
      // 既存のトークンを削除
      envContent = envContent.replace(/TWITCH_OAUTH_TOKEN=.*/g, '');
      envContent = envContent.replace(/TWITCH_REFRESH_TOKEN=.*/g, '');
      envContent = envContent.replace(/TWITCH_CLIENT_ID=.*/g, '');
    }

    // アクセストークンを追加
    if (!envContent.includes('TWITCH_OAUTH_TOKEN')) {
      envContent += `\nTWITCH_OAUTH_TOKEN=${token}\n`;
    } else {
      envContent = envContent.replace(/TWITCH_OAUTH_TOKEN=.*/, `TWITCH_OAUTH_TOKEN=${token}`);
    }

    // リフレッシュトークンを追加
    if (!envContent.includes('TWITCH_REFRESH_TOKEN')) {
      envContent += `TWITCH_REFRESH_TOKEN=${refreshToken}\n`;
    } else {
      envContent = envContent.replace(/TWITCH_REFRESH_TOKEN=.*/, `TWITCH_REFRESH_TOKEN=${refreshToken}`);
    }

    // Client ID を追加
    if (!envContent.includes('TWITCH_CLIENT_ID')) {
      envContent += `TWITCH_CLIENT_ID=${this.clientId}\n`;
    } else {
      envContent = envContent.replace(/TWITCH_CLIENT_ID=.*/, `TWITCH_CLIENT_ID=${this.clientId}`);
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n');
    console.log(`.env ファイルにトークンを保存しました: ${envPath}`);
  }
}

// メイン処理
const setup = new OAuthSetup();
setup.start().catch((error) => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});
