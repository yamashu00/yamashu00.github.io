# ユーザー設定ガイド（教員が実施する作業）

## 実施日: 2025-10-21

---

## 概要

ヒアリングシステムを動作させるために、以下の設定が必要です：

1. ✅ OpenAI APIキー（提供済み）
2. ⚠️ Firebase プロジェクト作成
3. ⚠️ Firebase Admin SDK サービスアカウントキー取得
4. ⚠️ Firestore データベース作成
5. ⚠️ Firebase Security Rules デプロイ
6. ⚠️ Google Cloud OAuth 設定
7. ⚠️ Upstash Redis 作成（レート制限用）

---

## 1. Firebase プロジェクト作成

### ステップ1: Firebaseコンソールにアクセス

1. https://console.firebase.google.com/ にアクセス
2. Googleアカウント（@seig-boys.jp または @itoksk.com）でログイン

### ステップ2: 新しいプロジェクトを作成

1. 「プロジェクトを追加」をクリック
2. **プロジェクト名:** `yamashu-hearing`
3. **Google アナリティクス:** 有効にする（推奨）
4. 「プロジェクトを作成」をクリック

### ステップ3: Firestore データベース作成

1. 左メニュー「Firestore Database」をクリック
2. 「データベースを作成」をクリック
3. **モード:** 本番環境モード
4. **ロケーション:** `asia-northeast1`（東京）
5. 「有効にする」をクリック

---

## 2. Firebase Admin SDK サービスアカウントキー取得

### ステップ1: サービスアカウント設定

1. Firebaseコンソール → プロジェクトの設定（歯車アイコン）
2. 「サービス アカウント」タブをクリック
3. 「新しい秘密鍵の生成」をクリック
4. 「キーを生成」をクリック

### ステップ2: JSONファイルのダウンロード

`yamashu-hearing-firebase-adminsdk-xxxxx.json`というファイルがダウンロードされます。

### ステップ3: 環境変数に設定する値を確認

JSONファイルを開いて、以下の値を確認してください：

```json
{
  "type": "service_account",
  "project_id": "yamashu-hearing",           // ← これが FIREBASE_PROJECT_ID
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",  // ← これが FIREBASE_PRIVATE_KEY
  "client_email": "firebase-adminsdk-xxxxx@yamashu-hearing.iam.gserviceaccount.com",  // ← これが FIREBASE_CLIENT_EMAIL
  ...
}
```

**⚠️ 重要:** このJSONファイルは絶対にGitHubにアップロードしないでください！

---

## 3. Firebase Security Rules デプロイ

### ステップ1: Firebase CLI インストール

```bash
npm install -g firebase-tools
```

### ステップ2: Firebase ログイン

```bash
firebase login
```

### ステップ3: Firebase 初期化

```bash
cd /Users/keisuke/git/yamashu00.github.io
firebase init

# 選択項目:
# ✅ Firestore
# ✅ Storage
# プロジェクト: yamashu-hearing を選択
# Firestore rules: firestore.rules を指定
# Firestore indexes: firestore.indexes.json を指定
# Storage rules: storage.rules を指定
```

### ステップ4: Security Rules ファイル作成

#### firestore.rules

`doc/hearing-security-rules-hear004.md`の「1.1 完全な firestore.rules ファイル」をコピーして、プロジェクトルートに`firestore.rules`として保存してください。

#### storage.rules

`doc/hearing-security-rules-hear004.md`の「2.1 完全な storage.rules ファイル」をコピーして、プロジェクトルートに`storage.rules`として保存してください。

#### firestore.indexes.json

`doc/hearing-security-rules-hear004.md`の「4.4 firestore.indexes.json」をコピーして、プロジェクトルートに`firestore.indexes.json`として保存してください。

### ステップ5: デプロイ

```bash
# Firestoreルールのデプロイ
firebase deploy --only firestore:rules

# Storageルールのデプロイ
firebase deploy --only storage

# インデックスのデプロイ
firebase deploy --only firestore:indexes
```

---

## 4. Google Cloud OAuth 設定

### ステップ1: Google Cloud Console にアクセス

1. https://console.cloud.google.com/ にアクセス
2. Firebaseで作成したプロジェクト`yamashu-hearing`を選択

### ステップ2: OAuth 同意画面の設定

1. 左メニュー「APIとサービス」→「OAuth 同意画面」
2. ユーザータイプ: **内部**（組織内ユーザーのみ）
3. アプリ名: `ヒアリングシステム`
4. ユーザーサポートメール: `teacher@seig-boys.jp`
5. 承認済みドメイン:
   - `seig-boys.jp`
   - `itoksk.com`
6. デベロッパーの連絡先メール: `teacher@seig-boys.jp`
7. 「保存して次へ」

### ステップ3: スコープ設定

1. 「スコープを追加または削除」
2. 以下のスコープを選択:
   - `openid`
   - `email`
   - `profile`
3. 「更新」→「保存して次へ」

### ステップ4: OAuth 2.0 クライアント ID 作成

1. 左メニュー「APIとサービス」→「認証情報」
2. 「認証情報を作成」→「OAuth クライアント ID」
3. アプリケーションの種類: **ウェブ アプリケーション**
4. 名前: `ヒアリングシステム (Production)`
5. 承認済みの JavaScript 生成元:
   ```
   http://localhost:3000
   ```
6. 承認済みのリダイレクト URI:
   ```
   http://localhost:3000/api/auth/callback/google
   https://hearing.yamashu.com/api/auth/callback/google
   ```
7. 「作成」をクリック

### ステップ5: クライアント ID とシークレットをメモ

作成されたクライアント ID とクライアントシークレットをメモしてください：

- **クライアント ID:** `123456789-xxxxxx.apps.googleusercontent.com`
- **クライアントシークレット:** `GOCSPX-xxxxxxxxxxxxx`

**⚠️ 重要:** クライアントシークレットは絶対にGitHubにアップロードしないでください！

---

## 5. Upstash Redis 作成（レート制限用）

### ステップ1: Upstashアカウント作成

1. https://upstash.com/ にアクセス
2. GitHubアカウントでサインアップ

### ステップ2: 新しいRedisデータベース作成

1. 「Create Database」をクリック
2. **Name:** `yamashu-hearing-ratelimit`
3. **Type:** Regional
4. **Region:** `ap-northeast-1`（東京）
5. 「Create」をクリック

### ステップ3: REST URL と REST TOKEN を取得

データベース作成後、ダッシュボードに表示される：

- **UPSTASH_REDIS_REST_URL:** `https://xxxxx.upstash.io`
- **UPSTASH_REDIS_REST_TOKEN:** `AXXXxxxxxxxxxxxxxxxxx`

---

## 6. 環境変数ファイルの作成

### ステップ1: .env.local ファイル作成

```bash
cd hearing-system
cp .env.example .env.local
```

### ステップ2: 環境変数を設定

`.env.local`を開いて、以下の値を設定してください：

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=YOUR_GENERATED_SECRET  # 下記コマンドで生成

# Google OAuth
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID  # ステップ4で取得
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET

# Firebase Admin SDK
FIREBASE_PROJECT_ID=yamashu-hearing  # ステップ2で確認
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@yamashu-hearing.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"

# OpenAI API
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_API_KEY_HERE

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io  # ステップ5で取得
UPSTASH_REDIS_REST_TOKEN=AXXXxxxxxxxxxxxxxxxxx
```

### ステップ3: NEXTAUTH_SECRET の生成

```bash
openssl rand -base64 32
```

出力された文字列を`NEXTAUTH_SECRET`に設定してください。

---

## 7. 動作確認

### ステップ1: 依存関係インストール

```bash
cd hearing-system
npm install
```

### ステップ2: 開発サーバー起動

```bash
npm run dev
```

### ステップ3: ブラウザで確認

http://localhost:3000 にアクセス

### ステップ4: ログインテスト

1. 「ログイン」ボタンをクリック
2. Google OAuthでログイン（@seig-boys.jp または @itoksk.com）
3. ダッシュボードが表示されればOK

---

## 8. Vercel デプロイ設定

### ステップ1: Vercelアカウント作成

1. https://vercel.com/signup にアクセス
2. GitHubアカウントでサインアップ

### ステップ2: GitHubリポジトリと連携

1. Vercel Dashboard → 「New Project」
2. Import Git Repository → `yamashu00.github.io` を選択
3. Root Directory: `hearing-system`
4. Framework Preset: **Next.js**
5. 「Deploy」をクリック

### ステップ3: 環境変数設定

Vercel Dashboard → プロジェクト → Settings → Environment Variables

以下の環境変数を**全て**追加してください（Production, Preview, Development すべてにチェック）：

| 変数名 | 値 |
|--------|---|
| `NEXTAUTH_URL` | `https://hearing.yamashu.com` (Production) / `http://localhost:3000` (Development) |
| `NEXTAUTH_SECRET` | （ステップ6で生成した値） |
| `GOOGLE_CLIENT_ID` | （ステップ4で取得した値） |
| `GOOGLE_CLIENT_SECRET` | （ステップ4で取得した値） |
| `FIREBASE_PROJECT_ID` | `yamashu-hearing` |
| `FIREBASE_CLIENT_EMAIL` | （ステップ2で確認した値） |
| `FIREBASE_PRIVATE_KEY` | （ステップ2で確認した値、改行を`\n`に置換） |
| `OPENAI_API_KEY` | `sk-proj-YOUR_OPENAI_API_KEY_HERE` |
| `UPSTASH_REDIS_REST_URL` | （ステップ5で取得した値） |
| `UPSTASH_REDIS_REST_TOKEN` | （ステップ5で取得した値） |

**⚠️ 重要: FIREBASE_PRIVATE_KEY の設定**

JSONファイルの`private_key`は複数行になっていますが、Vercelでは1行にする必要があります。

**元の値:**
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
...複数行...
-----END PRIVATE KEY-----
```

**Vercelに設定する値:**（改行を`\n`に置換）
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n...\n-----END PRIVATE KEY-----\n
```

---

## 9. カスタムドメイン設定（オプション）

### ステップ1: Vercelでドメイン追加

1. Vercel Dashboard → プロジェクト → Settings → Domains
2. 「Add Domain」→ `hearing.yamashu.com` を入力
3. DNSレコードの設定方法が表示される

### ステップ2: DNSレコード設定

GitHub Pagesのドメイン管理画面で以下を設定:

```
Type: CNAME
Name: hearing
Value: cname.vercel-dns.com
```

---

## 10. チェックリスト

設定が完了したら、以下をチェックしてください：

### Firebase
- [ ] Firebaseプロジェクト作成完了
- [ ] Firestoreデータベース作成完了
- [ ] Firebase Admin SDKサービスアカウントキー取得完了
- [ ] Security Rulesデプロイ完了

### Google Cloud OAuth
- [ ] OAuth同意画面設定完了
- [ ] OAuth 2.0 クライアントID作成完了
- [ ] クライアントIDとシークレット取得完了

### Upstash Redis
- [ ] Upstashアカウント作成完了
- [ ] Redisデータベース作成完了
- [ ] REST URLとREST TOKEN取得完了

### 環境変数
- [ ] .env.local ファイル作成完了
- [ ] 全ての環境変数設定完了
- [ ] NEXTAUTH_SECRET生成完了

### 動作確認
- [ ] ローカル環境で起動成功
- [ ] ログイン成功
- [ ] ダッシュボード表示成功

### Vercel
- [ ] Vercelアカウント作成完了
- [ ] GitHubリポジトリ連携完了
- [ ] 環境変数設定完了（Production, Preview, Development）
- [ ] デプロイ成功

---

## トラブルシューティング

### エラー: "FIREBASE_PRIVATE_KEY is not valid"

**原因:** 改行が正しくエスケープされていない

**解決策:**
1. JSONファイルの`private_key`をコピー
2. 改行を`\n`に置換
3. 全体をダブルクォートで囲む

### エラー: "AccessDenied"

**原因:** ログインしようとしたメールアドレスのドメインが許可されていない

**解決策:**
- @seig-boys.jp または @itoksk.com のアカウントでログインしてください

### エラー: "Rate limit exceeded"

**原因:** OpenAI APIのレート制限に達した

**解決策:**
- https://platform.openai.com/account/limits で使用状況を確認
- 数分待ってから再試行

---

## サポート

問題が発生した場合は、以下を確認してください：

1. `doc/hearing-deployment-hear005.md` のトラブルシューティングセクション
2. Firebase Console のログ
3. Vercel Dashboard のログ

それでも解決しない場合は、開発チームに連絡してください。
