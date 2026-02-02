# ヒアリングシステム

生徒の相談内容をAIで分析し、レポートを生成するシステム

## 技術スタック

- **フロントエンド:** Next.js 14 (App Router), React 18, TypeScript
- **認証:** NextAuth.js (Google OAuth)
- **データベース:** Firebase Firestore
- **AI:** OpenAI GPT-4o mini
- **レート制限:** Upstash Redis
- **スタイリング:** Tailwind CSS
- **ホスティング:** Vercel

## セットアップ手順

### 1. 依存関係のインストール

```bash
cd hearing-system
npm install
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env.local`を作成:

```bash
cp .env.example .env.local
```

以下の環境変数を設定してください:

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=  # openssl rand -base64 32 で生成

# Google OAuth
GOOGLE_CLIENT_ID=  # Google Cloud Consoleから取得
GOOGLE_CLIENT_SECRET=

# Firebase Admin SDK
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=  # 改行を\nでエスケープ

# OpenAI API
OPENAI_API_KEY=  # OpenAIダッシュボードから取得

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### 3. 環境変数の取得方法

#### NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

#### Google OAuth (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)

1. https://console.cloud.google.com/ にアクセス
2. プロジェクト作成: `yamashu-hearing`
3. APIとサービス → 認証情報 → OAuth 2.0 クライアント ID 作成
4. リダイレクトURI: `http://localhost:3000/api/auth/callback/google`

詳細: `doc/hearing-deployment-hear005.md` の「1. Google Workspace OAuth設定」参照

#### Firebase (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)

1. https://console.firebase.google.com/ にアクセス
2. プロジェクト作成: `yamashu-hearing`
3. プロジェクトの設定 → サービスアカウント → 秘密鍵を生成
4. ダウンロードしたJSONファイルから値を取得

詳細: `doc/hearing-deployment-hear005.md` の「3.3 Firebase Admin SDK秘密鍵の取得」参照

#### OpenAI (OPENAI_API_KEY)

1. https://platform.openai.com/api-keys にアクセス
2. APIキーを作成
3. `sk-proj-...`形式のキーを取得

#### Upstash Redis (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)

1. https://upstash.com/ にアクセス
2. 新しいRedisデータベースを作成
3. ダッシュボードから REST URL と REST TOKEN を取得

### 4. Firestore Security Rulesのデプロイ

```bash
cd ..
firebase init

# 選択:
# - Firestore
# - Storage

# デプロイ
firebase deploy --only firestore:rules
firebase deploy --only storage
```

Security Rulesファイル: `doc/hearing-security-rules-hear004.md` 参照

### 5. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 にアクセス

### 6. ビルド確認

```bash
npm run build
npm start
```

## プロジェクト構造

```
hearing-system/
├── app/
│   ├── api/
│   │   └── auth/[...nextauth]/route.ts  # NextAuth APIルート
│   ├── auth/
│   │   ├── signin/page.tsx              # ログインページ
│   │   └── error/page.tsx               # エラーページ
│   ├── dashboard/page.tsx               # ダッシュボード
│   ├── consultation/                    # 相談関連（TODO）
│   ├── teacher/                         # 教員ダッシュボード（TODO）
│   ├── layout.tsx                       # ルートレイアウト
│   ├── page.tsx                         # ホームページ
│   └── globals.css                      # グローバルCSS
├── components/
│   └── providers/
│       └── AuthProvider.tsx             # 認証プロバイダー
├── lib/
│   ├── auth.ts                          # NextAuth設定
│   ├── firebase.ts                      # Firebase Admin SDK
│   ├── openai.ts                        # OpenAI API + PIIフィルタ
│   └── rate-limiter.ts                  # レート制限
├── types/
│   └── next-auth.d.ts                   # NextAuth型定義
├── public/                              # 静的ファイル
├── .env.example                         # 環境変数テンプレート
├── .env.local                           # 環境変数（Git除外）
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── postcss.config.js
└── README.md
```

## 実装済み機能

- ✅ NextAuth.js認証（Google OAuth）
- ✅ ドメイン制限（@seig-boys.jp、@itoksk.com）
- ✅ ロール自動割り当て（student, teacher, ta, external-instructor）
- ✅ Firebase Admin SDK連携
- ✅ OpenAI GPT-4o mini統合
- ✅ PIIフィルタ
- ✅ レート制限（Upstash Redis）
- ✅ ダッシュボード（基本UI）

## 未実装機能（今後の作業）

- [ ] 相談作成フロー（5ステップ）
- [ ] 相談履歴表示
- [ ] レポート生成（PDF/Markdown/JSON）
- [ ] 教員ダッシュボード
- [ ] 統計・分析機能
- [ ] CSVエクスポート

## デプロイ

### Vercelへのデプロイ

1. Vercelアカウント作成: https://vercel.com/signup
2. GitHubリポジトリと連携
3. 環境変数を設定（Settings → Environment Variables）
4. 自動デプロイ実行

詳細: `doc/hearing-deployment-hear005.md` の「4. Vercelプロジェクト設定」参照

### 環境変数設定（Vercel）

以下の環境変数を Vercel Dashboard → Settings → Environment Variables で設定:

- `NEXTAUTH_URL` (Production: `https://hearing.yamashu.com`)
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `OPENAI_API_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## トラブルシューティング

### `NEXTAUTH_URL` not set エラー

`.env.local`に`NEXTAUTH_URL=http://localhost:3000`を設定してください。

### AccessDenied エラー

ログイン試行したメールアドレスが`@seig-boys.jp`または`@itoksk.com`ドメインであることを確認してください。

### Firebase接続エラー

`FIREBASE_PRIVATE_KEY`の改行が正しくエスケープされているか確認してください（`\n`）。

### OpenAI API呼び出しエラー

`OPENAI_API_KEY`が有効であることを確認し、OpenAI Dashboardで使用量とレート制限を確認してください。

詳細: `doc/hearing-deployment-hear005.md` の「7. トラブルシューティング」参照

## ドキュメント

設計ドキュメントは`/doc`ディレクトリにあります:

- `hearing-ux-review-hear001.md` - UXレビュー
- `hearing-api-design-hear002.md` - OpenAI API設計
- `hearing-storage-design-hear003.md` - ストレージ設計
- `hearing-security-rules-hear004.md` - Security Rules
- `hearing-deployment-hear005.md` - デプロイ手順

## ライセンス

Private - 聖学院中学校・高等学校

## サポート

問題が発生した場合は、`teacher@seig-boys.jp`に連絡してください。
