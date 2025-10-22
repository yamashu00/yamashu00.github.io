# Unity Game Development Course Hub

知財・プログラミング・デザインを横断するUnityゲーム開発授業の公式ハブサイト

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-success)](https://itoksk.github.io/yamashu00.github.io/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-blue)](https://yamashu00-github-io.vercel.app/)

## 📋 プロジェクト概要

このリポジトリは、聖学院高校で実施されているUnityゲーム開発授業の学習リソースハブとAIヒアリングシステムを含む統合プラットフォームです。

### 主な機能

1. **学習リソースハブ** (`index.html`)
   - 全23件のリソースをカテゴリ、レベル、タイプで絞り込み検索
   - 6つのGemツール（AIアシスタント）への統合アクセス
   - GitHub Classroom、Google Drive、外部学習リンクの一元管理
   - ペルソナ別ナビゲーション（プログラマー、デザイナー、プランナー）

2. **ヒアリングシステム** (`hearing-system/`)
   - Unity学習の問題をAIと対話しながら整理
   - OpenAI GPT-4o miniによる問題分析と解決案提示
   - Firebase Firestoreによるデータ管理
   - 教師・TAダッシュボードで全生徒の相談を確認
   - PDF形式でのレポートエクスポート

3. **更新情報ページ** (`updates/`)
   - サイト更新、Gemリリース、教材追加の最新情報
   - タイムライン形式で時系列表示

## 🚀 デプロイメント

### GitHub Pages（メインサイト）
- **URL**: https://itoksk.github.io/yamashu00.github.io/
- **自動デプロイ**: `main`ブランチへのプッシュで自動デプロイ
- **用途**: 学習リソースハブ、更新情報

### Vercel（ヒアリングシステム）
- **URL**: https://yamashu00-github-io.vercel.app/
- **自動デプロイ**: `main`ブランチへのプッシュで自動デプロイ
- **用途**: Next.js製のAIヒアリングシステム

## 📁 ディレクトリ構造

```
yamashu00.github.io/
├── index.html                    # メイン学習リソースハブ
├── data/
│   └── resources.json            # リソースメタデータAPI
├── updates/
│   └── index.html                # 更新情報ページ
├── hearing-system/               # Next.js AIヒアリングシステム
│   ├── app/                      # Next.js 14 App Router
│   │   ├── api/                  # API Routes
│   │   │   ├── auth/             # NextAuth.js認証
│   │   │   └── consultation/     # 相談API
│   │   ├── consultation/         # 相談関連ページ
│   │   │   ├── intro/            # 案内ページ
│   │   │   ├── new/              # 新規相談フォーム
│   │   │   ├── history/          # 相談履歴
│   │   │   └── [id]/             # 相談詳細
│   │   ├── teacher/              # 教師・TAダッシュボード
│   │   └── dashboard/            # ユーザーダッシュボード
│   ├── lib/                      # ユーティリティ
│   │   ├── auth.ts               # NextAuth設定
│   │   ├── firebase.ts           # Firebase Admin SDK
│   │   ├── openai.ts             # OpenAI API統合
│   │   └── resources.json        # リソースデータ（コピー）
│   └── public/                   # 静的ファイル
├── docs/                         # ドキュメント
│   └── IMPLEMENTATION_SUMMARY.md # 実装サマリー
├── firebase-config/              # Firebase設定ファイル（予約）
├── .firebaserc                   # Firebase CLI設定
├── firebase.json                 # Firebase Hosting設定
├── firestore.rules               # Firestoreセキュリティルール
├── firestore.indexes.json        # Firestoreインデックス
├── storage.rules                 # Cloud Storageルール
└── README.md                     # このファイル
```

## 🛠️ 技術スタック

### メインサイト
- **HTML/CSS/JavaScript**: バニラJS、レスポンシブデザイン
- **GitHub Pages**: 静的サイトホスティング

### ヒアリングシステム
- **Next.js 14**: App Router、Server/Client Components
- **TypeScript**: 型安全性
- **NextAuth.js**: Google OAuth認証
- **Firebase Admin SDK**: Firestore、認証管理
- **OpenAI API**: GPT-4o mini（相談分析）
- **Tailwind CSS**: スタイリング
- **jsPDF**: PDFエクスポート
- **Vercel**: デプロイメント

## 🔧 セットアップ

### 前提条件
- Node.js 18.x以上
- Firebase プロジェクト
- Google Cloud プロジェクト（OAuth認証用）
- OpenAI APIキー

### ヒアリングシステムのローカル開発

1. **リポジトリをクローン**
   ```bash
   git clone https://github.com/itoksk/yamashu00.github.io.git
   cd yamashu00.github.io/hearing-system
   ```

2. **依存関係をインストール**
   ```bash
   npm install
   ```

3. **環境変数を設定**
   `.env.local`ファイルを作成し、以下を記載：
   ```env
   # Firebase Admin SDK
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-random-secret-string

   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # OpenAI API
   OPENAI_API_KEY=sk-...
   ```

4. **開発サーバーを起動**
   ```bash
   npm run dev
   ```
   http://localhost:3000 にアクセス

5. **ビルド**
   ```bash
   npm run build
   npm start
   ```

## 🔐 環境変数の取得方法

詳細な手順は `docs/FORK_SETUP_GUIDE.md` を参照してください。

### Firebase Admin SDK
1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
2. プロジェクト設定 → サービスアカウント → 新しい秘密鍵を生成
3. ダウンロードしたJSONから `project_id`, `client_email`, `private_key` を抽出

### Google OAuth
1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. APIとサービス → 認証情報 → OAuth 2.0 クライアントID を作成
3. クライアントIDとクライアントシークレットを取得

### OpenAI API
1. [OpenAI Platform](https://platform.openai.com/) でアカウント作成
2. API Keys → Create new secret key
3. APIキーをコピー

## 📊 データ構造

### リソースメタデータ (`data/resources.json`)
```json
{
  "resources": [
    {
      "id": "gem-001",
      "title": "unity-debug-mentor",
      "description": "Unityエラー解決のための対話型AIアシスタント",
      "type": "gem-tool",
      "category": "programming",
      "level": "beginner",
      "tags": ["unity", "debug", "error"],
      "url": "https://gemini.google.com/gem/..."
    }
  ]
}
```

### Firestore スキーマ

#### `consultations` コレクション
```typescript
{
  consultationId: string;
  studentId: string;        // メールアドレス
  timestamp: Timestamp;
  lessonNumber: number;
  theme: string;
  details: string;          // PIIフィルタ済み
  aiResponse: {
    summary: string;
    category: string;
    difficulty: "low" | "medium" | "high";
    keyIssues: string[];
    suggestedSolution: string;
    nextSteps: string[];
    recommendedResources: Array<{id: string; reason: string}>;
    estimatedTime: string;
    tags: string[];
  };
  selfEvaluation: {
    success: string;
    challenges: string;
    nextSteps: string;
  };
  status: "completed";
  resolved: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `users` コレクション
```typescript
{
  email: string;
  displayName: string;
  role: "student" | "teacher" | "ta" | "external-instructor";
  stats: {
    totalConsultations: number;
    resolvedCount: number;
    lastConsultation: Timestamp;
  };
}
```

## 🎯 Gemツール一覧

1. **unity-debug-mentor** - Unityエラー解決サポート
2. **vector-math-coach** - ベクトル・数学の視覚的解説
3. **asset-handbook** - LOTTEキャラクター素材の使い方ガイド
4. **lesson-scheduler** - 授業スケジュール管理
5. **unity-install-help** - Unity Hub インストールサポート
6. **hearing-reporter** - ヒアリング結果レポート生成

## 🔒 セキュリティ

- **認証**: NextAuth.js + Google OAuth
- **個人情報保護**: OpenAI API呼び出し時にPIIフィルタリング
- **アクセス制御**:
  - 生徒: 自分の相談のみ閲覧可能
  - 教師・TA: 全生徒の相談を閲覧可能
- **Firebase Security Rules**: Firestoreアクセス制限
- **環境変数**: 秘密鍵は`.env.local`で管理（Git除外）

## 📝 ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。

ただし、以下のアセットは別途ライセンスが適用されます：
- LOTTEキャラクター素材: LOTTE様の利用規約に従う
- 外部リンク先のコンテンツ: 各サイトのライセンスに従う

## 🤝 コントリビューション

このプロジェクトは教育目的で使用されています。フォークして独自の授業環境で使用する場合は、`docs/FORK_SETUP_GUIDE.md` の手順に従ってください。

### フォーク後の変更が必要な箇所

1. **Firebase プロジェクト**: 独自のFirebaseプロジェクトを作成
2. **Google OAuth**: 独自のOAuthクライアントを作成
3. **OpenAI APIキー**: 独自のAPIキーを取得
4. **環境変数**: 全ての環境変数を独自の値に置き換え
5. **リンク**:
   - `index.html` のGemツールURL
   - `data/resources.json` のURL
   - 外部リンク（Google Drive、GitHub Classroomなど）

詳細は `docs/FORK_SETUP_GUIDE.md` を参照してください。

## 📞 サポート

質問や問題がある場合は、GitHubのIssuesで報告してください。

## 📚 関連ドキュメント

- [実装サマリー](docs/IMPLEMENTATION_SUMMARY.md) - 技術的な実装詳細
- [フォークセットアップガイド](docs/FORK_SETUP_GUIDE.md) - フォーク後の設定手順

---

**開発者**: 聖学院高校 Unity開発授業チーム
**最終更新**: 2025年10月22日
