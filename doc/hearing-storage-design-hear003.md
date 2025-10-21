# ヒアリングシステム ストレージ設計 (#HEAR-003)

## 実施日: 2025-10-21

---

## 1. データストレージ概要

### 1.1 選定技術スタック
- **プライマリDB:** Firestore（Cloud Firestore）
- **ファイルストレージ:** Cloud Storage（PDF/Markdownレポート保存）
- **セッション管理:** NextAuth.js（セッションはFirestore）
- **キャッシュ:** Upstash Redis（レート制限用）

### 1.2 選定理由
| 要件 | Firestore | 代替案 | 判断理由 |
|------|-----------|--------|---------|
| リアルタイム同期 | ✅ Native | Cloud SQL ❌ | 教員ダッシュボードのリアルタイム更新 |
| オフライン対応 | ✅ Native | Cloud SQL ❌ | 生徒のオフライン作業対応 |
| スケーラビリティ | ✅ 自動 | Cloud SQL △ | 生徒数増加に対応 |
| Security Rules | ✅ 細かい制御 | RLS △ | ドメイン・ロール単位のアクセス制御 |
| コスト | ✅ 小規模なら安価 | Cloud SQL △ | 月間1000読取で$0.06程度 |

---

## 2. Firestoreコレクション設計

### 2.1 コレクション構造概要

```
/consultations (相談ログ)
  /{consultationId}
    - studentId
    - timestamp
    - theme
    - details
    - aiResponse
    - selfEvaluation
    - status
    - recommendedResources
    - tags
    - ...

/users (ユーザー情報)
  /{userId}
    - email
    - role
    - displayName
    - createdAt
    - lastLogin

/lessons (授業回情報)
  /{lessonId}
    - lessonNumber
    - title
    - date
    - theme
    - consultations (サブコレクション)

/reports (生成レポート)
  /{reportId}
    - consultationId
    - format (pdf|markdown|json)
    - url (Cloud Storage URL)
    - createdAt
    - expiresAt

/analytics (集計データ)
  /{analyticsId}
    - period (daily|weekly|monthly)
    - metrics
    - topTags
    - createdAt
```

---

### 2.2 詳細スキーマ

#### コレクション: consultations

```typescript
interface Consultation {
  // 基本情報
  consultationId: string;           // UUID v4
  studentId: string;                // user email (@seig-boys.jp)
  timestamp: Timestamp;             // Firestore Timestamp
  lessonNumber: number;             // 授業回（1〜15）

  // 相談内容
  theme: string;                    // 相談テーマ
  details: string;                  // 相談詳細（PII除去済み）
  originalDetails?: string;         // 元の詳細（暗号化、期間限定）

  // AI分析結果
  aiResponse: {
    summary: string;                // 100文字以内の要約
    category: 'unity-error' | 'math-concept' | 'asset-usage' | 'game-design' | 'other';
    difficulty: 'low' | 'medium' | 'high';
    keyIssues: string[];            // 主な問題点
    suggestedSolution: string;      // 解決案（200文字以内）
    nextSteps: string[];            // 次にすべきこと
    estimatedTime: string;          // 推定解決時間
  };

  // 推奨リソース
  recommendedResources: Array<{
    id: string;                     // resources.json のID
    reason: string;                 // 推薦理由
  }>;

  // 生徒の自己評価
  selfEvaluation: {
    success: string;                // 成功したこと
    challenges: string;             // 課題
    nextSteps: string;              // 次にやること
  };

  // メタデータ
  status: 'draft' | 'ai-analyzing' | 'awaiting-eval' | 'completed';
  tags: string[];                   // 自動抽出タグ
  resolved: boolean;                // 解決済みフラグ

  // 共有設定
  sharedWith: string[];             // 共有先のemail配列
  shareLink?: string;               // 共有リンクID（期限付き）
  shareLinkExpiry?: Timestamp;      // 共有リンク有効期限

  // 管理情報
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp;            // 論理削除
}
```

**インデックス設計:**
```
複合インデックス:
1. studentId (ASC) + timestamp (DESC)
2. lessonNumber (ASC) + timestamp (DESC)
3. status (ASC) + timestamp (DESC)
4. resolved (ASC) + timestamp (DESC)
5. tags (ARRAY) + timestamp (DESC)
```

---

#### コレクション: users

```typescript
interface User {
  userId: string;                   // email（主キー）
  email: string;                    // @seig-boys.jp or @itoksk.com
  role: 'student' | 'teacher' | 'ta' | 'external-instructor';

  // 表示情報
  displayName: string;              // 表示名
  avatar?: string;                  // プロフィール画像URL

  // 統計情報
  stats: {
    totalConsultations: number;     // 総相談回数
    resolvedCount: number;          // 解決済み件数
    lastConsultation?: Timestamp;   // 最終相談日時
  };

  // 設定
  preferences: {
    emailNotifications: boolean;    // メール通知
    theme: 'light' | 'dark';        // テーマ
    language: 'ja' | 'en';          // 言語
  };

  // 管理情報
  createdAt: Timestamp;
  lastLogin: Timestamp;
  active: boolean;                  // アカウント有効フラグ
}
```

**インデックス設計:**
```
単一フィールドインデックス:
1. email (ASC)
2. role (ASC)
3. active (ASC)
```

---

#### コレクション: lessons

```typescript
interface Lesson {
  lessonId: string;                 // lesson-{lessonNumber}
  lessonNumber: number;             // 1〜15

  // 授業情報
  title: string;                    // 授業タイトル
  date: Timestamp;                  // 実施日
  theme: string;                    // 授業テーマ
  objectives: string[];             // 学習目標

  // 統計情報
  stats: {
    totalConsultations: number;     // 総相談件数
    topTags: string[];              // 頻出タグ
    averageDifficulty: number;      // 平均難易度（1-3）
  };

  // 管理情報
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// サブコレクション: consultations
/lessons/{lessonId}/consultations/{consultationId}
// → 授業回ごとの相談ログへの参照（コピーではなく参照）
```

---

#### コレクション: reports

```typescript
interface Report {
  reportId: string;                 // UUID v4
  consultationId: string;           // 元の相談ID

  // レポート情報
  format: 'pdf' | 'markdown' | 'json';
  url: string;                      // Cloud Storage URL
  fileSize: number;                 // バイト単位

  // アクセス制御
  generatedBy: string;              // 生成者のemail
  accessibleBy: string[];           // アクセス可能なemail配列

  // 有効期限
  createdAt: Timestamp;
  expiresAt: Timestamp;             // デフォルト: 3ヶ月後
  autoDelete: boolean;              // 自動削除フラグ
}
```

---

#### コレクション: analytics

```typescript
interface Analytics {
  analyticsId: string;              // {period}-{date}
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Timestamp;
  endDate: Timestamp;

  // 集計メトリクス
  metrics: {
    totalConsultations: number;
    totalStudents: number;
    resolvedRate: number;           // 解決率（0-1）
    averageResponseTime: number;    // 平均AI応答時間（秒）
  };

  // ランキング
  topTags: Array<{
    tag: string;
    count: number;
  }>;

  topCategories: Array<{
    category: string;
    count: number;
  }>;

  // カテゴリ別統計
  byCategory: {
    [category: string]: {
      count: number;
      resolvedRate: number;
      averageDifficulty: number;
    };
  };

  // 管理情報
  createdAt: Timestamp;
}
```

---

## 3. アクセス権限ポリシー

### 3.1 ロール定義

| ロール | 説明 | ドメイン制限 |
|--------|------|-------------|
| student | 生徒 | @seig-boys.jp のみ |
| teacher | 教員 | @seig-boys.jp または @itoksk.com |
| ta | TA（外部講師） | @itoksk.com のみ |
| external-instructor | 外部講師（読取専用） | @itoksk.com のみ |

---

### 3.2 アクセス権限マトリクス

#### consultations コレクション

| ロール | 読取 | 作成 | 更新 | 削除 |
|--------|------|------|------|------|
| student | 自分のみ | ✅ | 自分のみ（status=draft時） | ❌ |
| teacher | ✅ 全件 | ✅ | ✅ 全件 | ✅ 論理削除のみ |
| ta | ✅ 全件 | ✅ | ✅ 全件 | ❌ |
| external-instructor | ✅ 匿名化済みのみ | ❌ | ❌ | ❌ |

**詳細ルール:**
- 生徒は自分の相談のみ読取・更新可能
- 教員・TAは全相談を閲覧可能（ただしPII除去済み）
- `originalDetails`（暗号化フィールド）は教員のみアクセス可
- 外部講師は統計データと匿名化済みログのみ閲覧可

---

#### users コレクション

| ロール | 読取 | 作成 | 更新 | 削除 |
|--------|------|------|------|------|
| student | 自分のみ | 自動作成 | 自分のみ | ❌ |
| teacher | ✅ 全件 | ✅ | ✅ 全件 | ✅ |
| ta | ✅ 全件 | ❌ | 自分のみ | ❌ |
| external-instructor | 匿名化済みのみ | ❌ | ❌ | ❌ |

---

#### lessons コレクション

| ロール | 読取 | 作成 | 更新 | 削除 |
|--------|------|------|------|------|
| student | ✅ 全件 | ❌ | ❌ | ❌ |
| teacher | ✅ 全件 | ✅ | ✅ | ✅ |
| ta | ✅ 全件 | ❌ | ❌ | ❌ |
| external-instructor | ✅ 全件 | ❌ | ❌ | ❌ |

---

#### reports コレクション

| ロール | 読取 | 作成 | 更新 | 削除 |
|--------|------|------|------|------|
| student | 自分が作成したもの | ✅ | ❌ | ❌ |
| teacher | ✅ 全件 | ✅ | ✅ | ✅ |
| ta | ✅ 全件 | ✅ | ❌ | ❌ |
| external-instructor | sharedWithに含まれるもの | ❌ | ❌ | ❌ |

---

#### analytics コレクション

| ロール | 読取 | 作成 | 更新 | 削除 |
|--------|------|------|------|------|
| student | ❌ | ❌ | ❌ | ❌ |
| teacher | ✅ 全件 | 自動生成 | 自動生成 | ✅ |
| ta | ✅ 全件 | ❌ | ❌ | ❌ |
| external-instructor | ✅ 全件 | ❌ | ❌ | ❌ |

---

## 4. データ保持・削除ポリシー

### 4.1 保持期間

| データ種別 | 保持期間 | 削除方法 | 例外 |
|-----------|---------|---------|------|
| 相談ログ（consultations） | 学期末後3ヶ月 | 論理削除 → 完全削除 | 教員が明示的に保持指定 |
| ユーザー情報（users） | 卒業後1年 | 論理削除 | 教員・TAは無期限 |
| レポート（reports） | 生成後3ヶ月 | 自動削除 | ダウンロード済みフラグで延長可 |
| 分析データ（analytics） | 2年間 | 自動削除 | 匿名化後は無期限保持可 |

---

### 4.2 論理削除フロー

```typescript
// 論理削除
async function softDeleteConsultation(consultationId: string) {
  await db.collection('consultations').doc(consultationId).update({
    deletedAt: Timestamp.now(),
    status: 'deleted',
    // PII除去
    details: '[削除済み]',
    originalDetails: FieldValue.delete(),
    selfEvaluation: {
      success: '[削除済み]',
      challenges: '[削除済み]',
      nextSteps: '[削除済み]',
    },
  });
}

// 完全削除（学期末後3ヶ月経過時）
async function hardDeleteConsultation(consultationId: string) {
  // 関連レポートも削除
  const reports = await db.collection('reports')
    .where('consultationId', '==', consultationId)
    .get();

  for (const doc of reports.docs) {
    // Cloud Storageファイルも削除
    await deleteFileFromStorage(doc.data().url);
    await doc.ref.delete();
  }

  // 相談ログ削除
  await db.collection('consultations').doc(consultationId).delete();
}
```

---

### 4.3 自動削除スケジュール

**Cloud Functions（スケジュール実行）:**

```typescript
// functions/src/cleanup.ts
import * as functions from 'firebase-functions';
import { db } from './admin';

// 毎日午前2時に実行
export const dailyCleanup = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    const now = Timestamp.now();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // 1. 期限切れレポートの削除
    const expiredReports = await db.collection('reports')
      .where('expiresAt', '<', Timestamp.fromDate(threeMonthsAgo))
      .where('autoDelete', '==', true)
      .get();

    for (const doc of expiredReports.docs) {
      await deleteFileFromStorage(doc.data().url);
      await doc.ref.delete();
      console.log(`Deleted report: ${doc.id}`);
    }

    // 2. 論理削除から3ヶ月経過した相談ログの完全削除
    const deletedConsultations = await db.collection('consultations')
      .where('deletedAt', '<', Timestamp.fromDate(threeMonthsAgo))
      .get();

    for (const doc of deletedConsultations.docs) {
      await hardDeleteConsultation(doc.id);
      console.log(`Hard deleted consultation: ${doc.id}`);
    }

    // 3. 古い分析データの削除（2年以上前）
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const oldAnalytics = await db.collection('analytics')
      .where('endDate', '<', Timestamp.fromDate(twoYearsAgo))
      .get();

    for (const doc of oldAnalytics.docs) {
      await doc.ref.delete();
      console.log(`Deleted analytics: ${doc.id}`);
    }

    return null;
  });
```

---

## 5. バックアップ戦略

### 5.1 自動バックアップ

**Firestore自動エクスポート:**

```typescript
// functions/src/backup.ts
import * as functions from 'firebase-functions';
import { firestore } from 'firebase-admin';

// 毎週日曜日午前3時に実行
export const weeklyBackup = functions.pubsub
  .schedule('0 3 * * 0')
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    const projectId = process.env.GCP_PROJECT || 'yamashu-hearing';
    const bucket = `gs://${projectId}-backups`;

    const client = new firestore.v1.FirestoreAdminClient();
    const databaseName = client.databasePath(projectId, '(default)');

    return client.exportDocuments({
      name: databaseName,
      outputUriPrefix: bucket,
      collectionIds: ['consultations', 'users', 'lessons', 'analytics'],
    });
  });
```

---

### 5.2 手動エクスポート機能

**教員ダッシュボードからのCSVエクスポート:**

```typescript
// app/api/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/firebase';
import { Parser } from 'json2csv';

export async function POST(req: NextRequest) {
  const session = await getServerSession();

  // 教員のみ実行可能
  if (!session?.user?.role || !['teacher', 'ta'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { lessonNumber, format } = await req.json();

  // Firestore クエリ
  let query = db.collection('consultations');
  if (lessonNumber) {
    query = query.where('lessonNumber', '==', lessonNumber);
  }

  const snapshot = await query.orderBy('timestamp', 'desc').get();

  const data = snapshot.docs.map(doc => ({
    consultationId: doc.id,
    studentId: doc.data().studentId,
    timestamp: doc.data().timestamp.toDate().toISOString(),
    theme: doc.data().theme,
    category: doc.data().aiResponse.category,
    difficulty: doc.data().aiResponse.difficulty,
    resolved: doc.data().resolved,
    tags: doc.data().tags.join(', '),
  }));

  if (format === 'csv') {
    const parser = new Parser();
    const csv = parser.parse(data);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="consultations-${Date.now()}.csv"`,
      },
    });
  }

  // JSON形式
  return NextResponse.json(data);
}
```

---

## 6. プライバシー・セキュリティ対策

### 6.1 PIIフィルタリング戦略

**多層防御:**

```
レイヤー1: クライアント側（入力時）
  ↓ 警告表示「個人情報を含めないでください」
レイヤー2: API呼び出し前（サーバー側）
  ↓ PIIフィルタ実行（#HEAR-002で実装済み）
レイヤー3: Firestore書き込み前
  ↓ 再度PIIチェック
レイヤー4: 読み取り時
  ↓ ロールに応じたマスキング
```

---

### 6.2 暗号化戦略

| データ種別 | 暗号化方式 | 用途 |
|-----------|-----------|------|
| `originalDetails` | AES-256 + Cloud KMS | 元の相談内容（教員のみ復号可） |
| PII（保管必須の場合） | AES-256 + Cloud KMS | 氏名・連絡先等 |
| レポートファイル | Cloud Storage暗号化 | PDF/Markdown |
| 通信 | TLS 1.3 | 全API通信 |

**実装例:**

```typescript
// lib/encryption.ts
import { KMS } from '@google-cloud/kms';

const kmsClient = new KMS();
const keyName = process.env.KMS_KEY_NAME!;

export async function encryptPII(plaintext: string): Promise<string> {
  const [result] = await kmsClient.encrypt({
    name: keyName,
    plaintext: Buffer.from(plaintext),
  });

  return result.ciphertext!.toString('base64');
}

export async function decryptPII(ciphertext: string): Promise<string> {
  const [result] = await kmsClient.decrypt({
    name: keyName,
    ciphertext: Buffer.from(ciphertext, 'base64'),
  });

  return result.plaintext!.toString();
}
```

---

### 6.3 監査ログ

**アクセスログの記録:**

```typescript
interface AuditLog {
  logId: string;
  userId: string;
  action: 'read' | 'create' | 'update' | 'delete' | 'export';
  resourceType: 'consultation' | 'user' | 'report' | 'analytics';
  resourceId: string;
  timestamp: Timestamp;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
}

// functions/src/audit.ts
export async function logAccess(params: {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
}) {
  await db.collection('audit_logs').add({
    ...params,
    timestamp: Timestamp.now(),
  });
}
```

---

## 7. Cloud Storage設計（レポートファイル）

### 7.1 バケット構成

```
gs://yamashu-hearing-reports/
  /pdf/
    /{consultationId}/
      report-{timestamp}.pdf
  /markdown/
    /{consultationId}/
      report-{timestamp}.md
  /json/
    /{consultationId}/
      report-{timestamp}.json
  /exports/
    /csv/
      consultations-{timestamp}.csv
    /json/
      consultations-{timestamp}.json
```

---

### 7.2 ライフサイクルポリシー

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "age": 90,
          "matchesPrefix": ["pdf/", "markdown/", "json/"]
        }
      },
      {
        "action": {
          "type": "Delete"
        },
        "condition": {
          "age": 30,
          "matchesPrefix": ["exports/"]
        }
      }
    ]
  }
}
```

---

### 7.3 アクセス制御

**IAMポリシー:**

```yaml
bindings:
  - role: roles/storage.objectViewer
    members:
      - serviceAccount:firebase-adminsdk@yamashu-hearing.iam.gserviceaccount.com

  - role: roles/storage.objectCreator
    members:
      - serviceAccount:firebase-adminsdk@yamashu-hearing.iam.gserviceaccount.com

  - role: roles/storage.objectAdmin
    members:
      - group:teachers@seig-boys.jp
```

**署名付きURL生成:**

```typescript
// lib/storage.ts
import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const bucket = storage.bucket('yamashu-hearing-reports');

export async function generateSignedUrl(
  filePath: string,
  expiresInMinutes: number = 60
): Promise<string> {
  const [url] = await bucket.file(filePath).getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  });

  return url;
}
```

---

## 8. コスト試算

### 8.1 Firestoreコスト

**想定:**
- 生徒20人
- 月間相談回数: 1人あたり10回 = 200回/月
- 教員ダッシュボード閲覧: 100回/月

**料金計算（東京リージョン）:**

| 操作 | 単価 | 回数/月 | コスト |
|------|------|---------|--------|
| ドキュメント書込 | $0.18/10万 | 200回 | $0.0004 |
| ドキュメント読取 | $0.06/10万 | 300回（閲覧+分析） | $0.0002 |
| ドキュメント削除 | $0.02/10万 | 10回 | $0.0000 |
| ストレージ（1GB/月） | $0.18/GB | 0.1GB | $0.018 |

**月間合計: 約$0.02（約2円）**

---

### 8.2 Cloud Storageコスト

| 項目 | 単価 | 使用量/月 | コスト |
|------|------|-----------|--------|
| ストレージ（Standard） | $0.020/GB | 2GB（PDFレポート） | $0.04 |
| 読み取り操作 | $0.004/1万 | 500回 | $0.0002 |
| 書き込み操作 | $0.005/1万 | 200回 | $0.0001 |

**月間合計: 約$0.04（約4円）**

---

### 8.3 Cloud Functions（バックアップ・削除処理）

| 関数 | 実行頻度 | 実行時間 | コスト/月 |
|------|---------|---------|----------|
| dailyCleanup | 1回/日 | 10秒 | $0.01 |
| weeklyBackup | 1回/週 | 30秒 | $0.005 |

**月間合計: 約$0.015（約1.5円）**

---

### 8.4 総コスト

| サービス | 月間コスト |
|---------|-----------|
| Firestore | 2円 |
| Cloud Storage | 4円 |
| Cloud Functions | 1.5円 |
| OpenAI API（#HEAR-002） | 5.2円（月200回相談） |
| Upstash Redis | $0（無料枠内） |

**総計: 約12.7円/月**

---

## 9. 移行計画

### 9.1 既存hearingリポジトリからの移行

**ステップ1: データ抽出**
```bash
# 既存DBからデータエクスポート（形式により調整）
# 例: PostgreSQL
pg_dump -h localhost -U user -d hearing_db -t consultations -F c -f consultations.dump
```

**ステップ2: データ変換**
```typescript
// scripts/migrate.ts
import { db } from './firebase-admin';
import oldData from './exports/consultations.json';

async function migrate() {
  for (const record of oldData) {
    const consultation = {
      consultationId: record.id,
      studentId: record.student_email,
      timestamp: Timestamp.fromDate(new Date(record.created_at)),
      lessonNumber: record.lesson_number,
      theme: record.theme,
      details: filterPII(record.details), // PII除去
      aiResponse: JSON.parse(record.ai_response),
      selfEvaluation: {
        success: record.self_eval_success,
        challenges: record.self_eval_challenges,
        nextSteps: record.self_eval_next_steps,
      },
      status: 'completed',
      tags: extractTags(record.details),
      resolved: record.resolved,
      createdAt: Timestamp.fromDate(new Date(record.created_at)),
      updatedAt: Timestamp.fromDate(new Date(record.updated_at)),
    };

    await db.collection('consultations').doc(consultation.consultationId).set(consultation);
    console.log(`Migrated: ${consultation.consultationId}`);
  }
}

migrate();
```

---

### 9.2 移行スケジュール

| フェーズ | 期間 | 作業内容 |
|---------|------|---------|
| Phase 1 | 1週間 | Firestore設計完了、Security Rules実装 |
| Phase 2 | 1週間 | データ移行スクリプト作成・テスト |
| Phase 3 | 3日 | 本番環境へのデータ移行実施 |
| Phase 4 | 1週間 | 並行稼働（旧システムと新システム） |
| Phase 5 | - | 旧システム停止 |

---

## 10. 次のアクションアイテム

### ユーザー作業（教員チーム）

- [ ] **データ保持期間の承認**
  - 学期末後3ヶ月で削除で問題ないか確認
  - 例外的に保持すべきログの基準を決定

- [ ] **アクセス権限の最終確認**
  - 外部講師に見せてよい情報の範囲を確認
  - 生徒が他生徒のログを見れないことの確認

### システム側（次タスク #HEAR-004で実装）

- [ ] Firebase Security Rulesの実装
- [ ] Cloud Functions（cleanup, backup）の実装
- [ ] データ移行スクリプトの作成
- [ ] 監査ログシステムの実装

---

## 11. まとめ

### ストレージ設計の完了事項

✅ **Firestoreコレクション設計**
- consultations, users, lessons, reports, analytics の5つのコレクション
- 詳細スキーマとインデックス設計

✅ **アクセス権限ポリシー**
- 4つのロール（student, teacher, ta, external-instructor）
- コレクションごとの詳細な権限マトリクス

✅ **データ保持・削除ポリシー**
- 学期末後3ヶ月で論理削除 → 完全削除
- 自動削除スケジュール（Cloud Functions）

✅ **バックアップ戦略**
- 週次自動バックアップ
- 手動エクスポート機能（CSV/JSON）

✅ **プライバシー・セキュリティ対策**
- 多層PIIフィルタ
- AES-256暗号化（Cloud KMS）
- 監査ログ

✅ **コスト試算**
- 月間約12.7円（生徒20人、月200回相談）

### 次のステップ

**#HEAR-004**: Firebase Security Rulesの実装
- 上記のアクセス権限ポリシーをFirebase Security Rulesとして記述
- ドメイン制限（@seig-boys.jp、@itoksk.com）の実装
- セキュリティルールのテスト
