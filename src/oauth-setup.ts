import * as http from 'http';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as readline from 'readline';

const TWITCH_CLIENT_ID = 'YOUR_CLIENT_ID'; // ユーザーが設定する
const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPES = ['chat:read'];

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string[];
}

class OAuthSetup {
  private server: http.Server | null = null;
  private clientId: string = '';
  private clientSecret: string = '';

  async start(): Promise<void> {
    console.log('\n=== Twitch OAuth トークン取得ツール ===\n');

    // クライアント ID とシークレットを入力
    await this.getClientCredentials();

    // 認可 URL を生成
    const authUrl = this.generateAuthUrl();
    console.log(`\n以下のURLをブラウザで開いてください:\n${authUrl}\n`);

    // コールバックサーバーを起動
    await this.startCallbackServer();
  }

  private async getClientCredentials(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('Twitch Client ID を入力してください: ', (clientId) => {
        this.clientId = clientId;
        rl.question('Twitch Client Secret を入力してください: ', (clientSecret) => {
          this.clientSecret = clientSecret;
          rl.close();
          resolve();
        });
      });
    });
  }

  private generateAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: SCOPES.join(' ')
    });

    return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
  }

  private startCallbackServer(): Promise<void> {
    return new Promise((resolve) => {
      this.server = http.createServer(async (req, res) => {
        const parsedUrl = url.parse(req.url || '', true);
        const pathname = parsedUrl.pathname;
        const query = parsedUrl.query;

        if (pathname === '/callback') {
          const code = query.code as string;
          const error = query.error as string;

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<h1>エラーが発生しました</h1><p>${error}</p>`);
            this.server?.close();
            console.error(`認可エラー: ${error}`);
            resolve();
            return;
          }

          if (!code) {
            res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>認可コードが見つかりません</h1>');
            this.server?.close();
            resolve();
            return;
          }

          try {
            // トークンを取得
            const token = await this.exchangeCodeForToken(code);
            
            // .env ファイルに保存
            await this.saveToken(token.access_token);

            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`
              <h1>✓ 認可が完了しました</h1>
              <p>トークンが .env ファイルに保存されました。</p>
              <p>このウィンドウを閉じて、アプリケーションを実行してください。</p>
            `);

            console.log('\n✓ OAuth トークンが正常に取得されました。');
            this.server?.close();
            resolve();
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<h1>エラーが発生しました</h1><p>${error instanceof Error ? error.message : '不明なエラー'}</p>`);
            this.server?.close();
            resolve();
          }
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      });

      this.server.listen(3000, () => {
        console.log('コールバックサーバーが localhost:3000 で起動しました。');
      });
    });
  }

  private async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI
      }
    });

    return response.data as TokenResponse;
  }

  private async saveToken(token: string): Promise<void> {
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';

    // 既存の .env ファイルを読み込む
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
      // 既存のトークンを削除
      envContent = envContent.replace(/TWITCH_OAUTH_TOKEN=.*/g, '');
    }

    // トークンを追加
    if (!envContent.includes('TWITCH_OAUTH_TOKEN')) {
      envContent += `\nTWITCH_OAUTH_TOKEN=${token}\n`;
    } else {
      envContent = envContent.replace(/TWITCH_OAUTH_TOKEN=.*/, `TWITCH_OAUTH_TOKEN=${token}`);
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
