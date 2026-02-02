# OAuth連携とVercelデプロイ環境セットアップ (#HEAR-005)

## 実施日: 2025-10-21

---

## 1. Google Workspace OAuth設定

### 1.1 Google Cloud Console プロジェクト作成

**ステップ1: プロジェクト作成**

1. https://console.cloud.google.com/ にアクセス
2. プロジェクト選択 → 「新しいプロジェクト」
3. プロジェクト名: `yamashu-hearing`
4. 組織: seig-boys.jp
5. 「作成」をクリック

---

**ステップ2: OAuth同意画面の設定**

1. 左メニュー「APIとサービス」→「OAuth 同意画面」
2. ユーザータイプ: **内部**（組織内ユーザーのみ）
3. アプリ名: `ヒアリングシステム`
4. ユーザーサポートメール: `teacher@seig-boys.jp`
5. 承認済みドメイン:
   - `seig-boys.jp`
   - `itoksk.com`
6. デベロッパーの連絡先メール: `teacher@seig-boys.jp`
7. 「保存して次へ」

---

**ステップ3: スコープ設定**

必要なスコープ:
- `openid`
- `email`
- `profile`

**画面操作:**
1. 「スコープを追加または削除」
2. 上記3つのスコープを選択
3. 「更新」→「保存して次へ」

---

**ステップ4: OAuth 2.0 クライアント ID 作成**

1. 左メニュー「APIとサービス」→「認証情報」
2. 「認証情報を作成」→「OAuth クライアント ID」
3. アプリケーションの種類: **ウェブ アプリケーション**
4. 名前: `ヒアリングシステム (Production)`
5. 承認済みの JavaScript 生成元:
   ```
   https://hearing.yamashu.com
   ```
6. 承認済みのリダイレクト URI:
   ```
   https://hearing.yamashu.com/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google (開発用)
   ```
7. 「作成」をクリック

**取得した情報（メモしておく）:**
- クライアント ID: `123456789-xxxxxx.apps.googleusercontent.com`
- クライアント シークレット: `GOCSPX-xxxxxxxxxxxxx`

---

### 1.2 ドメイン制限の設定

**Google Admin Console での設定:**

1. https://admin.google.com/ にアクセス（管理者アカウント）
2. セキュリティ → アクセスとデータ管理 → API の制御
3. 「アプリアクセスの設定」→「信頼できるアプリ」
4. `ヒアリングシステム`を追加
5. アクセス権限:
   - 対象: `seig-boys.jp` および `itoksk.com` のユーザー
   - スコープ: `openid, email, profile`

---

### 1.3 OAuth設定の検証

**テスト手順:**

```bash
# ローカルで動作確認
npm run dev

# ブラウザで開く
open http://localhost:3000

# ログインボタンをクリック
# → Google OAuth画面が表示される
# → seig-boys.jp または itoksk.com のアカウントでログイン
# → 成功すれば正しく設定されている
```

---

## 2. NextAuth.js設定

### 2.1 パッケージインストール

```bash
npm install next-auth@latest
npm install --save-dev @types/next-auth
```

---

### 2.2 NextAuth.js設定ファイル

#### app/api/auth/[...nextauth]/route.ts

```typescript
import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { FirestoreAdapter } from '@auth/firestore-adapter';
import { cert } from 'firebase-admin/app';
import { Firestore } from 'firebase-admin/firestore';

// Firestore Adapter用の設定
const firestore = new Firestore({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

export const authOptions: NextAuthOptions = {
  adapter: FirestoreAdapter(firestore),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          hd: 'seig-boys.jp', // ドメイン制限（1つ目）
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // ドメイン制限チェック
      const email = user.email || '';
      const allowedDomains = ['seig-boys.jp', 'itoksk.com'];
      const domain = email.split('@')[1];

      if (!allowedDomains.includes(domain)) {
        console.error('不正なドメインからのログイン試行:', email);
        return false; // ログイン拒否
      }

      // ロール自動割り当て
      let role = 'student'; // デフォルト

      if (domain === 'seig-boys.jp') {
        // @seig-boys.jp の場合
        if (email.startsWith('teacher')) {
          role = 'teacher';
        } else {
          role = 'student';
        }
      } else if (domain === 'itoksk.com') {
        // @itoksk.com の場合
        // TODO: ここで外部講師リストと照合
        const externalInstructors = ['instructor1@itoksk.com', 'instructor2@itoksk.com'];
        if (externalInstructors.includes(email)) {
          role = 'external-instructor';
        } else {
          role = 'ta';
        }
      }

      // Firestoreにユーザー情報を保存・更新
      try {
        const userRef = firestore.collection('users').doc(email);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
          // 新規ユーザー
          await userRef.set({
            email,
            role,
            displayName: user.name || '',
            avatar: user.image || '',
            createdAt: new Date(),
            lastLogin: new Date(),
            active: true,
            preferences: {
              emailNotifications: false,
              theme: 'light',
              language: 'ja',
            },
            stats: {
              totalConsultations: 0,
              resolvedCount: 0,
            },
          });
          console.log('新規ユーザー作成:', email, role);
        } else {
          // 既存ユーザー: lastLogin更新
          await userRef.update({
            lastLogin: new Date(),
          });
        }
      } catch (error) {
        console.error('Firestoreへのユーザー保存エラー:', error);
        return false;
      }

      return true;
    },

    async session({ session, token }) {
      // セッションにロール情報を追加
      if (session.user) {
        try {
          const userDoc = await firestore.collection('users').doc(session.user.email!).get();
          const userData = userDoc.data();

          session.user.role = userData?.role || 'student';
          session.user.displayName = userData?.displayName || session.user.name || '';
        } catch (error) {
          console.error('セッション取得エラー:', error);
        }
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      // ログイン後のリダイレクト先
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

---

### 2.3 型定義の拡張

#### types/next-auth.d.ts

```typescript
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      email: string;
      name?: string | null;
      image?: string | null;
      role: 'student' | 'teacher' | 'ta' | 'external-instructor';
      displayName: string;
    };
  }

  interface User {
    email: string;
    name?: string | null;
    image?: string | null;
    role?: 'student' | 'teacher' | 'ta' | 'external-instructor';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'student' | 'teacher' | 'ta' | 'external-instructor';
  }
}
```

---

### 2.4 カスタムログインページ

#### app/auth/signin/page.tsx

```typescript
'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function SignIn() {
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (err) {
      setError('ログインに失敗しました。再度お試しください。');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">ヒアリングシステム</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Googleアカウントでログイン
          </button>
        </div>

        <p className="mt-6 text-sm text-gray-600 text-center">
          @seig-boys.jp または @itoksk.com のアカウントでログインしてください
        </p>
      </div>
    </div>
  );
}
```

---

### 2.5 エラーページ

#### app/auth/error/page.tsx

```typescript
'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: { [key: string]: string } = {
    Configuration: 'サーバーの設定に問題があります。管理者に連絡してください。',
    AccessDenied: '許可されていないドメインからのログイン試行です。',
    Verification: '認証に失敗しました。再度お試しください。',
    Default: '予期しないエラーが発生しました。',
  };

  const message = errorMessages[error || 'Default'] || errorMessages.Default;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">ログインエラー</h1>
          <p className="text-gray-600 mb-6">{message}</p>

          <Link
            href="/auth/signin"
            className="inline-block bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
          >
            ログイン画面に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---

## 3. 環境変数設定

### 3.1 .env.local（ローカル開発用）

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET_HERE  # openssl rand -base64 32 で生成

# Google OAuth
GOOGLE_CLIENT_ID=123456789-xxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx

# Firebase Admin SDK
FIREBASE_PROJECT_ID=yamashu-hearing
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@yamashu-hearing.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"

# OpenAI API
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxx

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxxxxxxxxxxxxxxxxxxx
```

---

### 3.2 NEXTAUTH_SECRET の生成

```bash
# ターミナルで実行
openssl rand -base64 32

# 出力例:
# K8zL3mN9pQ2rS4tU5vW6xY7zA1bC2dE3fG4hI5jK6lM=

# この値を NEXTAUTH_SECRET に設定
```

---

### 3.3 Firebase Admin SDK秘密鍵の取得

**ステップ1: Firebase Console**

1. https://console.firebase.google.com/ にアクセス
2. プロジェクト選択: `yamashu-hearing`
3. プロジェクトの設定（歯車アイコン）→「サービス アカウント」
4. 「新しい秘密鍵の生成」をクリック
5. JSONファイルがダウンロードされる

**ステップ2: 環境変数に設定**

```json
// ダウンロードされたJSONファイル
{
  "type": "service_account",
  "project_id": "yamashu-hearing",
  "private_key_id": "xxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@yamashu-hearing.iam.gserviceaccount.com",
  "client_id": "123456789",
  ...
}
```

`.env.local`に追加:
```bash
FIREBASE_PROJECT_ID=yamashu-hearing
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@yamashu-hearing.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n"
```

⚠️ **注意:** 秘密鍵は改行を `\n` でエスケープし、ダブルクォートで囲む

---

## 4. Vercelプロジェクト設定

### 4.1 Vercelアカウント作成・プロジェクト連携

**ステップ1: Vercelアカウント作成**

1. https://vercel.com/signup にアクセス
2. GitHubアカウントで登録

**ステップ2: GitHubリポジトリと連携**

1. Vercel Dashboard → 「New Project」
2. Import Git Repository → `yamashu-hearing`リポジトリを選択
3. Framework Preset: **Next.js**
4. Root Directory: `./` (デフォルト)
5. Build Command: `npm run build`
6. Output Directory: `.next` (デフォルト)
7. 「Deploy」をクリック

---

### 4.2 Vercel環境変数設定

**設定方法:**

1. Vercel Dashboard → プロジェクト選択
2. Settings → Environment Variables
3. 以下の環境変数を追加:

| 変数名 | 値 | 環境 |
|--------|---|------|
| `NEXTAUTH_URL` | `https://hearing.yamashu.com` | Production |
| `NEXTAUTH_SECRET` | （生成した値） | Production, Preview, Development |
| `GOOGLE_CLIENT_ID` | （Google Cloud Consoleから取得） | Production, Preview, Development |
| `GOOGLE_CLIENT_SECRET` | （Google Cloud Consoleから取得） | Production, Preview, Development |
| `FIREBASE_PROJECT_ID` | `yamashu-hearing` | Production, Preview, Development |
| `FIREBASE_CLIENT_EMAIL` | （サービスアカウントのemail） | Production, Preview, Development |
| `FIREBASE_PRIVATE_KEY` | （秘密鍵、改行を`\n`でエスケープ） | Production, Preview, Development |
| `OPENAI_API_KEY` | `sk-proj-xxxxxxxx` | Production, Preview |
| `UPSTASH_REDIS_REST_URL` | `https://xxxxx.upstash.io` | Production, Preview, Development |
| `UPSTASH_REDIS_REST_TOKEN` | `AXXXxxxxxx` | Production, Preview, Development |

⚠️ **注意:**
- `FIREBASE_PRIVATE_KEY`は改行を`\n`でエスケープし、全体をダブルクォートで囲まない
- Vercelでは環境変数に自動的にエスケープされるため、`"-----BEGIN..."`のようにダブルクォートは不要

---

### 4.3 カスタムドメイン設定

**ステップ1: Vercelでドメイン追加**

1. Vercel Dashboard → プロジェクト → Settings → Domains
2. 「Add Domain」→ `hearing.yamashu.com` を入力
3. DNSレコードの設定方法が表示される

**ステップ2: DNSレコード設定**

GitHub Pagesのドメイン管理画面（または使用しているDNSプロバイダ）で以下を設定:

```
Type: CNAME
Name: hearing
Value: cname.vercel-dns.com
```

**ステップ3: SSL証明書の自動発行**

Vercelが自動的にLet's EncryptでSSL証明書を発行します（数分かかる場合があります）。

---

### 4.4 デプロイ設定

#### vercel.json

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["hnd1"],
  "env": {
    "NEXTAUTH_URL": "https://hearing.yamashu.com"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_APP_URL": "https://hearing.yamashu.com"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

---

## 5. デプロイ手順

### 5.1 初回デプロイ

```bash
# 1. 依存関係インストール
npm install

# 2. ローカルでビルド確認
npm run build

# 3. ローカルで動作確認
npm run dev
# → http://localhost:3000 で動作確認

# 4. Gitにコミット
git add .
git commit -m "feat: ヒアリングシステム初回リリース"
git push origin main

# → Vercelが自動的にデプロイを開始
```

---

### 5.2 Vercel CLIを使ったデプロイ

```bash
# Vercel CLI インストール
npm install -g vercel

# ログイン
vercel login

# プロジェクトリンク（初回のみ）
vercel link

# プレビューデプロイ
vercel

# 本番デプロイ
vercel --prod
```

---

### 5.3 GitHub Actionsでの自動デプロイ（オプション）

#### .github/workflows/deploy.yml

```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

**必要なシークレット設定（GitHub）:**
1. GitHubリポジトリ → Settings → Secrets and variables → Actions
2. 以下を追加:
   - `VERCEL_TOKEN`: Vercel Account Settings → Tokens で生成
   - `VERCEL_ORG_ID`: Vercel Dashboard → Settings → General → Team ID
   - `VERCEL_PROJECT_ID`: Vercel Project → Settings → General → Project ID

---

## 6. デプロイ後の確認

### 6.1 動作確認チェックリスト

- [ ] **OAuth認証**
  - [ ] https://hearing.yamashu.com にアクセス
  - [ ] 「Googleアカウントでログイン」をクリック
  - [ ] @seig-boys.jp でログイン成功
  - [ ] @itoksk.com でログイン成功
  - [ ] @gmail.com でログイン失敗（AccessDenied）

- [ ] **ダッシュボード表示**
  - [ ] ログイン後にダッシュボードが表示される
  - [ ] ユーザー名が表示される
  - [ ] ロールが正しく表示される（生徒/教員/TA）

- [ ] **相談作成**
  - [ ] 生徒アカウントで相談を作成できる
  - [ ] テーマ選択が正常に動作する
  - [ ] AI分析が実行される（OpenAI API呼び出し）
  - [ ] 結果が表示される

- [ ] **教員ダッシュボード**
  - [ ] 教員アカウントで全相談を閲覧できる
  - [ ] フィルタ機能が動作する
  - [ ] CSVエクスポートが動作する

- [ ] **セキュリティ**
  - [ ] 生徒は他生徒の相談を閲覧できない
  - [ ] 未認証ユーザーは/dashboardにアクセスできない
  - [ ] レート制限が機能する（1時間に10回まで）

---

### 6.2 パフォーマンス確認

```bash
# Lighthouse スコア確認
npx lighthouse https://hearing.yamashu.com --view

# 目標スコア:
# - Performance: 90+
# - Accessibility: 95+
# - Best Practices: 90+
# - SEO: 90+
```

---

### 6.3 エラーモニタリング

**Vercel Analytics**

1. Vercel Dashboard → プロジェクト → Analytics
2. 確認項目:
   - Page Views
   - Unique Visitors
   - Error Rate
   - Response Time

**Vercel Logs**

```bash
# リアルタイムログ確認
vercel logs

# 特定のデプロイメントのログ
vercel logs [deployment-url]
```

---

## 7. トラブルシューティング

### 7.1 よくあるエラーと解決策

#### エラー1: `NEXTAUTH_URL` not set

**原因:** 環境変数が設定されていない

**解決策:**
```bash
# .env.local に追加
NEXTAUTH_URL=http://localhost:3000

# Vercel環境変数を確認
vercel env ls
```

---

#### エラー2: `AccessDenied` エラー

**原因:** ドメイン制限に引っかかっている

**解決策:**
1. Google Cloud Console → OAuth同意画面 → 承認済みドメインを確認
2. `app/api/auth/[...nextauth]/route.ts`の`allowedDomains`を確認
3. ログイン試行したメールアドレスを確認

---

#### エラー3: Firebase接続エラー

**原因:** 秘密鍵の改行エスケープが不正

**解決策:**
```bash
# .env.local で確認
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"

# Vercelでは改行をそのまま設定（\nは不要）
# Settings → Environment Variables で再設定
```

---

#### エラー4: OpenAI API呼び出しエラー

**原因:** APIキーが無効、またはレート制限

**解決策:**
```bash
# APIキーの確認
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# レート制限の確認
# → OpenAI Dashboardで使用状況を確認
```

---

### 7.2 ログ確認方法

```bash
# Vercelログ確認
vercel logs --follow

# Firebaseログ確認
firebase functions:log

# Next.jsサーバーログ（ローカル）
# → ターミナル出力を確認

# ブラウザコンソール
# → F12 → Console タブ
```

---

## 8. セキュリティチェックリスト

### 本番環境デプロイ前の確認

- [ ] **環境変数**
  - [ ] すべての秘密鍵が環境変数に設定されている
  - [ ] `.env.local`をGitにコミットしていない
  - [ ] `.gitignore`に`.env.local`が含まれている

- [ ] **OAuth設定**
  - [ ] リダイレクトURIが正しい
  - [ ] ドメイン制限が設定されている
  - [ ] スコープが最小限（openid, email, profile）

- [ ] **Firestore Security Rules**
  - [ ] ルールがデプロイされている
  - [ ] テストケースが通過している
  - [ ] ドメイン制限が機能している

- [ ] **レート制限**
  - [ ] Upstash Redisが設定されている
  - [ ] ユーザーごとの制限が機能している
  - [ ] IP制限が機能している

- [ ] **HTTPSセキュリティヘッダー**
  - [ ] X-Frame-Options: DENY
  - [ ] X-Content-Type-Options: nosniff
  - [ ] Referrer-Policy設定済み

- [ ] **CORS設定**
  - [ ] 許可されたオリジンのみアクセス可能

---

## 9. 運用手順

### 9.1 定期メンテナンス

**毎週:**
- [ ] Vercel Analyticsで異常なアクセスパターンを確認
- [ ] エラーログを確認
- [ ] API使用量を確認（OpenAI、Firebase）

**毎月:**
- [ ] 依存パッケージの更新
  ```bash
  npm outdated
  npm update
  ```
- [ ] セキュリティアップデートの適用
  ```bash
  npm audit
  npm audit fix
  ```

**学期ごと:**
- [ ] データバックアップの確認
- [ ] 不要なデータの削除（#HEAR-003のポリシーに従う）
- [ ] ユーザーアカウントの棚卸し

---

### 9.2 緊急時対応

**障害発生時:**

1. **Vercelデプロイメントロールバック**
   ```bash
   # Vercel Dashboard → Deployments
   # → 前のデプロイメントを選択 → Promote to Production
   ```

2. **Firebase Rulesロールバック**
   ```bash
   # Firebase Console → Firestore → Rules
   # → 以前のバージョンを選択 → Publish
   ```

3. **問い合わせ対応**
   - 生徒: teacher@seig-boys.jp に連絡
   - 教員: 開発チームに連絡

---

## 10. まとめ

### 完了事項

✅ **Google Workspace OAuth設定**
- OAuth同意画面設定
- クライアントID・シークレット取得
- ドメイン制限設定（@seig-boys.jp、@itoksk.com）

✅ **NextAuth.js設定**
- 認証フロー実装
- ロール自動割り当て
- Firestore連携
- カスタムログインページ・エラーページ

✅ **環境変数設定**
- ローカル環境（.env.local）
- Vercel環境変数
- 秘密鍵の安全な管理

✅ **Vercelデプロイ設定**
- プロジェクト作成
- カスタムドメイン設定
- 自動デプロイ（GitHub連携）
- セキュリティヘッダー設定

✅ **デプロイ手順書**
- 初回デプロイ手順
- GitHub Actions設定（オプション）
- 動作確認チェックリスト
- トラブルシューティング

✅ **運用手順**
- 定期メンテナンス
- 緊急時対応フロー
- セキュリティチェックリスト

### システム構成完了

```
ユーザー（ブラウザ）
  ↓
  ↓ HTTPS
  ↓
Vercel (Next.js App)
  ├── NextAuth.js (OAuth認証)
  │   └→ Google OAuth
  │
  ├── API Routes
  │   ├→ OpenAI GPT API (相談分析)
  │   ├→ Firebase Firestore (データ保存)
  │   └→ Upstash Redis (レート制限)
  │
  └── Cloud Functions
      ├→ dailyCleanup (データ削除)
      └→ weeklyBackup (バックアップ)
```

### 次のステップ（ユーザー作業）

**教員チーム:**
1. Google Workspace管理者アカウントでOAuth設定を実施
2. 外部講師リストを作成し、開発チームに共有
3. 初回ログインテストを実施

**開発チーム:**
1. 実装完了後、#GEM-004（ヒアリングシステムとGemのAPI連携）を実施
2. #OPS-001（プライバシーポリシー）を作成
3. #OPS-002（運用ドキュメント）を整備

**全体:**
- #INT-001（相談ログ分析フロー）の設計
- #QA-001（ユーザーテスト）の実施

---

## 付録: 環境変数一覧

| 変数名 | 説明 | 例 |
|--------|------|---|
| `NEXTAUTH_URL` | アプリケーションURL | `https://hearing.yamashu.com` |
| `NEXTAUTH_SECRET` | NextAuth.jsのシークレット | `openssl rand -base64 32`で生成 |
| `GOOGLE_CLIENT_ID` | Google OAuthクライアントID | `123456789-xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuthクライアントシークレット | `GOCSPX-xxxxxx` |
| `FIREBASE_PROJECT_ID` | FirebaseプロジェクトID | `yamashu-hearing` |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin SDKメール | `firebase-adminsdk-xxx@yamashu-hearing.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Firebase秘密鍵 | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n` |
| `OPENAI_API_KEY` | OpenAI APIキー | `sk-proj-xxxxxxxxxx` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL | `https://xxxxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redisトークン | `AXXXxxxxxxxxx` |
