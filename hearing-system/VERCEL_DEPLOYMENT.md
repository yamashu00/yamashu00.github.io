# Vercel デプロイ手順書

このドキュメントでは、ヒアリングシステムをVercelにデプロイする手順を説明します。

## 前提条件

- GitHubリポジトリにプッシュ済み
- Vercelアカウント作成済み
- 全ての環境変数の値を準備済み

## デプロイ手順

### ステップ1: Vercelでプロジェクトをインポート

1. https://vercel.com にアクセスしてログイン
2. 「Add New」→「Project」をクリック
3. GitHubリポジトリを選択
4. 「Import」をクリック

### ステップ2: プロジェクト設定

#### Framework Preset
- **Framework**: Next.js
- **Root Directory**: `hearing-system`（サブディレクトリの場合）

#### Build and Output Settings
- **Build Command**: `npm run build`（デフォルト）
- **Output Directory**: `.next`（デフォルト）
- **Install Command**: `npm install`（デフォルト）

### ステップ3: 環境変数の設定

**重要**: 環境変数は一つずつ手動で入力するか、`.env`ファイルをアップロードします。

#### 環境変数一覧

以下の環境変数を設定してください：

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `NEXTAUTH_URL` | 本番環境のURL | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | NextAuth秘密鍵 | ランダム文字列（32文字以上推奨） |
| `GOOGLE_CLIENT_ID` | Google OAuth クライアントID | `xxxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth クライアントシークレット | `GOCSPX-xxxxx` |
| `FIREBASE_PROJECT_ID` | Firebase プロジェクトID | `aiagent-462205` |
| `FIREBASE_CLIENT_EMAIL` | Firebase サービスアカウントメール | `firebase-adminsdk-xxxxx@xxxxx.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | Firebase 秘密鍵 | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n` |
| `OPENAI_API_KEY` | OpenAI APIキー | `sk-proj-xxxxx` |
| `ALLOWED_DOMAINS` | 許可ドメイン（カンマ区切り） | `seig-boys.jp,itoksk.com` |
| `TEACHER_EMAILS` | 教員メールアドレス（カンマ区切り） | `teacher1@example.com,teacher2@example.com` |

#### 環境変数の設定方法

**方法1: 手動で入力**

1. Vercelプロジェクト設定ページの「Environment Variables」セクションに移動
2. 各変数名と値を入力
3. Environment: `Production`, `Preview`, `Development` を全て選択
4. 「Add」をクリック

**方法2: .envファイルをアップロード**

1. ローカルの `.env.local` ファイルを `.env` にコピー
2. **重要**: `.env` ファイルから以下の行を更新：
   ```
   # NEXTAUTH_URLを本番URLに変更
   NEXTAUTH_URL=https://your-app.vercel.app
   ```
3. Vercelの「Environment Variables」セクションで「Load .env File」をクリック
4. `.env` ファイルをアップロード

#### ⚠️ 重要な注意点

**FIREBASE_PRIVATE_KEY の設定**

Firebase秘密鍵は改行を含むため、正しく設定する必要があります：

- Vercel UIで設定する場合: そのまま貼り付けてOK（Vercelが自動で処理）
- `.env`ファイルで設定する場合: ダブルクォートで囲む
  ```
  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQ...\n-----END PRIVATE KEY-----\n"
  ```

**NEXTAUTH_URL の設定**

- Production環境では本番URLを設定
- Previewブランチでは `https://your-app-git-branch.vercel.app` 形式のURLを設定
- Development環境では `http://localhost:3000` でOK

### ステップ4: Google OAuth設定の更新

Vercelにデプロイ後、Google Cloud ConsoleでOAuth設定を更新します：

1. https://console.cloud.google.com/ にアクセス
2. プロジェクトを選択
3. 「APIとサービス」→「認証情報」
4. OAuth 2.0 クライアントIDを選択
5. **承認済みのリダイレクトURI**に以下を追加：
   ```
   https://your-app.vercel.app/api/auth/callback/google
   https://your-app-git-*.vercel.app/api/auth/callback/google
   ```
6. 「保存」をクリック

### ステップ5: デプロイ

1. Vercel設定画面で「Deploy」をクリック
2. ビルドログを確認
3. デプロイ完了後、URLをクリックしてアクセス

### ステップ6: 動作確認

1. デプロイされたURLにアクセス
2. Googleアカウントでログイン
3. 各ページが正常に動作することを確認：
   - ダッシュボード
   - 新しい相談
   - 相談履歴
   - 教員ダッシュボード（教員アカウントの場合）

## トラブルシューティング

### ビルドエラーが発生する場合

1. Vercelのビルドログを確認
2. ローカル環境で `npm run build` を実行して同じエラーが出ないか確認
3. 環境変数が正しく設定されているか確認

### 認証エラーが発生する場合

1. `NEXTAUTH_URL` が本番URLと一致しているか確認
2. `NEXTAUTH_SECRET` が設定されているか確認
3. Google OAuthのリダイレクトURIが正しく設定されているか確認

### Firestoreエラーが発生する場合

1. `FIREBASE_PRIVATE_KEY` が正しく設定されているか確認
2. Firebase Security Rulesがデプロイされているか確認
3. Firestore Indexesがデプロイされているか確認

## セキュリティチェックリスト

デプロイ前に以下を確認してください：

- [ ] `.env.local` ファイルがGitHubにプッシュされていない
- [ ] Firebase サービスキーJSONファイルがGitHubにプッシュされていない
- [ ] `.gitignore` に以下が含まれている：
  - `.env*.local`
  - `.env`
  - `*-firebase-adminsdk-*.json`
- [ ] Git履歴に秘密鍵やAPIキーが含まれていない
- [ ] ハードコードされたメールアドレスやドメインが環境変数化されている

## 継続的デプロイ

Vercelは自動的にGitHubと連携します：

- **mainブランチへのプッシュ**: 本番環境に自動デプロイ
- **その他のブランチへのプッシュ**: プレビュー環境に自動デプロイ

## 環境変数の更新

環境変数を更新する場合：

1. Vercelプロジェクト設定の「Environment Variables」に移動
2. 変数を編集または削除
3. **重要**: 環境変数を更新後、再デプロイが必要
   - 「Deployments」タブに移動
   - 最新のデプロイメントの「...」メニューから「Redeploy」を選択

## サポート

問題が発生した場合：

1. Vercelのビルドログを確認
2. ブラウザのデベロッパーツールでエラーを確認
3. Firebaseコンソールでログを確認
4. 必要に応じてVercelサポートに問い合わせ

---

**最終更新**: 2025-10-21
