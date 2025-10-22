# フォーク後のセットアップガイド

このガイドは、このリポジトリをフォークして独自の授業環境で使用する場合の設定手順を説明します。

## 📋 目次

1. [前提条件](#前提条件)
2. [Firebase プロジェクトのセットアップ](#firebase-プロジェクトのセットアップ)
3. [Google OAuth の設定](#google-oauth-の設定)
4. [OpenAI API キーの取得](#openai-api-キーの取得)
5. [環境変数の設定](#環境変数の設定)
6. [リンクとURLの変更](#リンクとurlの変更)
7. [デプロイ](#デプロイ)
8. [セキュリティ設定](#セキュリティ設定)

## 🔧 前提条件

- Node.js 18.x以上
- Git
- GitHubアカウント
- Googleアカウント
- Vercelアカウント（無料プランでOK）

## 🔥 Firebase プロジェクトのセットアップ

### 1. Firebaseプロジェクトを作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: `my-school-hearing-system`）
4. Google Analyticsは任意（オフでもOK）
5. 「プロジェクトを作成」をクリック

### 2. Firestore データベースを作成

1. プロジェクトダッシュボードで「Firestore Database」を選択
2. 「データベースを作成」をクリック
3. モード selection:
   - **本番環境モード**を選択
4. ロケーション:
   - `asia-northeast1 (Tokyo)` を推奨
5. 「有効にする」をクリック
6. **名前付きデータベース**を作成:
   - データベース一覧から「データベースを作成」
   - データベースID: `hearing-system`
   - ロケーション: `asia-northeast1 (Tokyo)`

### 3. Firebase Admin SDK サービスアカウントキーを取得

1. プロジェクト設定（歯車アイコン）→ 「プロジェクトの設定」
2. 「サービスアカウント」タブを選択
3. 「新しい秘密鍵の生成」をクリック
4. JSONファイルがダウンロードされます
5. 以下の情報を`.env.local`用にメモ:
   ```json
   {
     "project_id": "your-project-id",
     "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   }
   ```

### 4. Firestore セキュリティルールを設定

1. Firestore Database → 「ルール」タブ
2. 以下のルールを貼り付け:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // ヘルパー関数
    function isAuthenticated() {
      return request.auth != null;
    }

    function isStudent() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role == 'student';
    }

    function isTeacherOrTA() {
      return isAuthenticated() &&
             (get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role == 'teacher' ||
              get(/databases/$(database)/documents/users/$(request.auth.token.email)).data.role == 'ta');
    }

    // ユーザーコレクション
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.token.email == userId;
    }

    // 相談コレクション
    match /consultations/{consultationId} {
      // 読み取り: 本人または教員・TA
      allow read: if isAuthenticated() &&
                     (resource.data.studentId == request.auth.token.email || isTeacherOrTA());

      // 作成: 認証済みユーザー
      allow create: if isAuthenticated() &&
                      request.resource.data.studentId == request.auth.token.email;

      // 更新: 本人（自分の相談のみ）または教員・TA
      allow update: if isAuthenticated() &&
                      (resource.data.studentId == request.auth.token.email || isTeacherOrTA());

      // 削除: 教員・TAのみ
      allow delete: if isTeacherOrTA();
    }
  }
}
```

3. 「公開」をクリック

## 🔐 Google OAuth の設定

### 1. Google Cloud Console でプロジェクトを作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成（Firebaseプロジェクトと同じ名前を推奨）
3. プロジェクトを選択

### 2. OAuth 同意画面を設定

1. 「APIとサービス」→「OAuth 同意画面」
2. ユーザータイプ: **外部** を選択
3. アプリ情報を入力:
   - アプリ名: `Unity学習ヒアリングシステム`
   - ユーザーサポートメール: あなたのメールアドレス
   - デベロッパーの連絡先情報: あなたのメールアドレス
4. スコープ: デフォルトのまま（`openid`, `email`, `profile`）
5. テストユーザー: 学生と教師のメールアドレスを追加
6. 「保存して次へ」

### 3. OAuth 2.0 クライアント ID を作成

1. 「APIとサービス」→「認証情報」
2. 「認証情報を作成」→「OAuth 2.0 クライアントID」
3. アプリケーションの種類: **ウェブ アプリケーション**
4. 名前: `Hearing System Web Client`
5. 承認済みのリダイレクト URI:
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-domain.vercel.app/api/auth/callback/google
   https://yamashu00-github-io.vercel.app/api/auth/callback/google
   ```
   （実際のドメインに置き換え）
6. 「作成」をクリック
7. **クライアントID** と **クライアントシークレット** をメモ

## 🤖 OpenAI API キーの取得

1. [OpenAI Platform](https://platform.openai.com/) にアクセス
2. アカウントを作成（クレジットカード登録が必要）
3. 「API Keys」→「Create new secret key」
4. キー名: `Hearing System`
5. 権限: `All`（またはGPT-4へのアクセスが必要）
6. 「Create secret key」をクリック
7. **APIキー**をメモ（`sk-proj-...`で始まる）

## ⚙️ 環境変数の設定

### ローカル開発環境

`hearing-system/.env.local` ファイルを作成:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n<YOUR_PRIVATE_KEY_CONTENT>\n-----END PRIVATE KEY-----\n"

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<GENERATE_RANDOM_SECRET_HERE>

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OpenAI API
OPENAI_API_KEY=sk-proj-your-openai-api-key

# 許可ドメインとロール設定
ALLOWED_DOMAINS=seig-boys.jp,itoksk.com
TEACHER_EMAILS=teacher1@example.com,teacher2@example.com
```

**NEXTAUTH_SECRET の生成方法**:
```bash
openssl rand -base64 32
```

### Vercel環境変数

1. Vercelプロジェクトダッシュボードで「Settings」→「Environment Variables」
2. 以下の環境変数を追加:

| 変数名 | 値 | 環境 |
|--------|-----|------|
| `FIREBASE_PROJECT_ID` | Firebaseプロジェクトの`project_id` | Production, Preview, Development |
| `FIREBASE_CLIENT_EMAIL` | サービスアカウントの`client_email` | Production, Preview, Development |
| `FIREBASE_PRIVATE_KEY` | サービスアカウントの`private_key`（改行含む） | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | Production |
| `NEXTAUTH_SECRET` | ランダム文字列 | Production, Preview, Development |
| `GOOGLE_CLIENT_ID` | Google OAuthクライアントID | Production, Preview, Development |
| `GOOGLE_CLIENT_SECRET` | Google OAuthクライアントシークレット | Production, Preview, Development |
| `OPENAI_API_KEY` | OpenAI APIキー | Production, Preview, Development |
| `ALLOWED_DOMAINS` | 許可するメールドメイン（カンマ区切り） | Production, Preview, Development |
| `TEACHER_EMAILS` | 教員のメールアドレス（カンマ区切り） | Production, Preview, Development |

## 🔗 リンクとURLの変更

### 1. リソースデータ (`data/resources.json`)

**変更が必要な箇所**:
- Gemツールの`url`: 独自のGemツールを作成してURLを置き換え
- Google DriveのURL: 独自のGoogle Driveフォルダを作成してURLを置き換え
- GitHub ClassroomのURL: 独自のGitHub Organizationを作成してURLを置き換え

例:
```json
{
  "id": "gem-001",
  "url": "https://gemini.google.com/gem/YOUR_GEM_ID"
}
```

### 2. index.htmlのリンク

**変更が必要な箇所**:

**行677付近**: ヒアリングシステムへのリンク
```html
<!-- 変更前 -->
<a href="https://yamashu00-github-io.vercel.app/" target="_blank">

<!-- 変更後 -->
<a href="https://YOUR_VERCEL_DOMAIN.vercel.app/" target="_blank">
```

**行804-823付近**: ChatGPT/Geminiリンク（変更不要、そのまま使用可能）

### 3. Firebase設定ファイル

**`.firebaserc`**:
```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

### 4. hearing-system/lib/resources.json

`data/resources.json`の内容をコピーして、ヒアリングシステム内でも使用します。

### 5. hearing-system/app/auth/signin/page.tsx

**タイトルとロゴの変更** (任意):
```typescript
// 行20付近
<h1 className="text-2xl font-bold mb-6 text-center text-gray-900">
  ヒアリングシステム {/* 学校名を追加する場合 */}
</h1>
```

### 6. hearing-system/lib/auth.ts

**認可メールドメインの変更** (行47付近):
```typescript
// 学校のメールドメインに変更
if (!email.endsWith('@your-school-domain.com') &&
    !email.endsWith('@gmail.com')) { // テスト用
  return false;
}
```

**ロール割り当てロジックの変更** (行64-78付近):
```typescript
// 学校の教師・TAのメールアドレスを設定
const teacherEmails = [
  'teacher1@your-school-domain.com',
  'teacher2@your-school-domain.com',
];

const taEmails = [
  'ta1@your-school-domain.com',
  'ta2@your-school-domain.com',
];
```

## 🚀 デプロイ

### GitHub Pages（メインサイト）

1. リポジトリの設定 → Pages
2. Source: `Deploy from a branch`
3. Branch: `main` / `/ (root)`
4. 「Save」をクリック
5. 数分後に `https://your-username.github.io/repo-name/` でアクセス可能

### Vercel（ヒアリングシステム）

1. [Vercel](https://vercel.com/) にGitHubアカウントでログイン
2. 「New Project」→ リポジトリを選択
3. Root Directory: `hearing-system`
4. Framework Preset: `Next.js`
5. 環境変数を設定（上記参照）
6. 「Deploy」をクリック
7. デプロイ完了後、カスタムドメインを設定（任意）

### Firebase Hosting（任意）

メインサイトをFirebase Hostingにもデプロイしたい場合:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# public directory: . (カレントディレクトリ)
# single-page app: No
firebase deploy --only hosting
```

## 🔒 セキュリティ設定

### 1. 環境変数の確認

すべての秘密鍵とAPIキーが`.env.local`に設定されていること、`.gitignore`に含まれていることを確認:

```bash
cat .gitignore | grep ".env.local"
# 出力されない場合は追加:
echo ".env.local" >> .gitignore
```

### 2. Firebase Security Rules の検証

Firebaseコンソールで「Rules Playground」を使ってテスト:

- 生徒ユーザーが自分の相談のみ読み書きできることを確認
- 教師・TAが全相談を読めることを確認
- 未認証ユーザーがアクセスできないことを確認

### 3. OAuth リダイレクトURIの制限

Google Cloud Consoleで、本番環境のURLのみを承認済みリダイレクトURIに設定:

```
https://your-production-domain.vercel.app/api/auth/callback/google
```

ローカル開発用:
```
http://localhost:3000/api/auth/callback/google
```

### 4. OpenAI API 使用量モニタリング

[OpenAI Usage Dashboard](https://platform.openai.com/usage) で使用量を定期的に確認:

- 使用量制限を設定（例: 月$50）
- 異常な使用パターンを監視

### 5. Firestore コストモニタリング

Firebase Console → 「Usage and billing」で使用量を確認:

- 読み取り/書き込み操作数
- ストレージ使用量
- 予算アラートを設定

## ✅ 動作確認チェックリスト

デプロイ後、以下を確認してください:

- [ ] メインサイト（GitHub Pages）が表示される
- [ ] リソース検索が動作する
- [ ] Gemツールのリンクが正しく遷移する
- [ ] ヒアリングシステム（Vercel）が表示される
- [ ] Googleログインが動作する
- [ ] 相談を送信してFirestoreにデータが保存される
- [ ] AI分析結果が表示される
- [ ] 教師ダッシュボードで全相談が表示される
- [ ] PDFエクスポートが動作する
- [ ] 生徒は自分の相談のみ閲覧できる
- [ ] 教師・TAは全相談を閲覧できる

## 🆘 トラブルシューティング

### ログインできない

- Google OAuthのリダイレクトURIが正しいか確認
- `NEXTAUTH_URL`が本番環境のURLと一致しているか確認
- ブラウザのキャッシュをクリア

### Firestoreにデータが保存されない

- Firebase Admin SDKの環境変数が正しいか確認
- Firestoreデータベース名が`hearing-system`になっているか確認
- Firestore Security Rulesが正しく設定されているか確認

### AI分析が動作しない

- OpenAI APIキーが正しいか確認
- APIキーに十分なクレジットがあるか確認
- Vercelのログで詳細なエラーを確認

### リソースが表示されない

- `data/resources.json`のパスが正しいか確認
- JSONの構文エラーがないか確認
- ブラウザの開発者ツールでネットワークエラーを確認

## 📞 サポート

問題が解決しない場合は、GitHubリポジトリのIssuesで報告してください。

## 📚 関連ドキュメント

- [Firebase ドキュメント](https://firebase.google.com/docs)
- [Next.js ドキュメント](https://nextjs.org/docs)
- [NextAuth.js ドキュメント](https://next-auth.js.org/)
- [OpenAI API リファレンス](https://platform.openai.com/docs/api-reference)

---

**最終更新**: 2025年10月22日
