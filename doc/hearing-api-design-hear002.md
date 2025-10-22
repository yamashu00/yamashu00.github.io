# OpenAI GPT API設計 (#HEAR-002)

## 実施日: 2025-10-21

---

## 1. API選定

### 推奨モデル: GPT-4o mini
**理由:**
- コストパフォーマンスが最も高い
- 日本語対応が優秀
- レスポンス速度が速い（1-3秒）
- 相談内容の要約・分析に十分な性能

### モデル比較
| モデル | 入力($/ 1M tokens) | 出力($/ 1M tokens) | 用途 |
|--------|-------------------|-------------------|------|
| GPT-4o mini | $0.150 | $0.600 | **推奨** 日常的な相談分析 |
| GPT-4o | $2.50 | $10.00 | 複雑な分析が必要な場合 |
| GPT-4.1 | $30.00 | $60.00 | 不要（オーバースペック） |

---

## 2. プロンプトテンプレート

### 2.1 相談内容の要約・分析

```javascript
const CONSULTATION_ANALYSIS_PROMPT = `あなたは高校生のUnity学習をサポートするAIアシスタントです。

以下の相談内容を分析し、JSON形式で回答してください。

# 相談内容
テーマ: {theme}
詳細: {details}

# 出力形式（JSON）
{
  "summary": "相談内容の要約（100文字以内）",
  "category": "unity-error|math-concept|asset-usage|game-design|other",
  "difficulty": "low|medium|high",
  "keyIssues": ["主な問題点1", "主な問題点2"],
  "suggestedSolution": "具体的な解決案（200文字以内）",
  "nextSteps": ["次にすべきこと1", "次にすべきこと2"],
  "recommendedResources": [
    {
      "id": "gem-001",
      "reason": "推薦理由"
    }
  ],
  "estimatedTime": "解決までの推定時間（例: 30分）",
  "tags": ["タグ1", "タグ2", "タグ3"]
}

# 注意事項
- 高校生にわかりやすい言葉で説明してください
- 具体的で実行可能なアドバイスを提供してください
- recommendedResourcesは以下のIDから選択してください:
  - gem-001: unity-debug-mentor
  - gem-002: vector-math-coach
  - gem-003: asset-handbook
  - code-001: PlayerController
  - code-002: EnemyChaser
  - code-003: ItemDropper
  - theme-001: 数列×レベルアップ
  - theme-002: 確率×ガチャ
  - theme-003: ベクトル×追尾
  - resource-001〜009: 外部リンク
`;
```

---

### 2.2 レポート生成

```javascript
const REPORT_GENERATION_PROMPT = `以下の情報から学習振り返りレポートを作成してください。

# 相談情報
テーマ: {theme}
詳細: {details}
AI回答: {aiResponse}
成功したこと: {selfEvaluation.success}
課題: {selfEvaluation.challenges}
次の一手: {selfEvaluation.nextSteps}

# 出力形式（Markdown）
## 相談レポート

### 📋 基本情報
- 相談ID: {consultationId}
- 日時: {timestamp}
- 授業回: 第{lessonNumber}回
- テーマ: {theme}

### 💬 相談内容
{details}

### 🤖 AI分析結果
{aiResponse}

### ✅ 振り返り
**成功したこと:**
{selfEvaluation.success}

**課題・まだわからないこと:**
{selfEvaluation.challenges}

**次にやること:**
{selfEvaluation.nextSteps}

### 💡 推奨リソース
{recommendedResources}

### 📊 次回の目標
{nextGoals}

---
*このレポートは自動生成されました*
`;
```

---

## 3. コスト試算

### 3.1 想定トークン数

**入力（相談内容）:**
- システムプロンプト: 300 tokens
- 相談テーマ: 20 tokens
- 相談詳細: 200 tokens（平均）
- **合計: 約520 tokens**

**出力（AI回答）:**
- JSON分析結果: 300 tokens（平均）
- **合計: 約300 tokens**

### 3.2 1相談あたりのコスト（GPT-4o mini）

```
入力: 520 tokens × $0.150 / 1,000,000 = $0.000078
出力: 300 tokens × $0.600 / 1,000,000 = $0.000180
合計: $0.000258 ≈ 0.026円（1ドル=100円換算）
```

### 3.3 月間コスト試算

| 生徒数 | 1人あたり月間相談数 | 月間総相談数 | 月間コスト（円） |
|--------|-------------------|------------|-----------------|
| 20人 | 5回 | 100回 | 2.6円 |
| 20人 | 10回 | 200回 | 5.2円 |
| 20人 | 20回 | 400回 | 10.4円 |

**結論:** GPT-4o miniなら月間コストは**10円未満**で運用可能（生徒20人×月20回相談でも）

---

## 4. レート制限設計

### 4.1 OpenAI APIの制限
- **Tier 1（初期）:** 500 RPM, 30,000 TPM
- **Tier 2:** 5,000 RPM, 2,000,000 TPM

### 4.2 アプリケーション側の制限

```javascript
// rate-limiter.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// ユーザーごとのレート制限
export const userRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 1時間に10回まで
  analytics: true,
});

// IP制限（DoS対策）
export const ipRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, "1 h"), // 1時間に50回まで
  analytics: true,
});
```

### 4.3 実装例

```typescript
// app/api/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { userRateLimit } from "@/lib/rate-limiter";
import { analyzeConsultation } from "@/lib/openai";

export async function POST(req: NextRequest) {
  // 認証チェック
  const session = await getServerSession();
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // レート制限チェック
  const { success, remaining } = await userRateLimit.limit(session.user.email);
  if (!success) {
    return NextResponse.json(
      { error: "レート制限に達しました。1時間後に再試行してください。" },
      { status: 429 }
    );
  }

  // リクエストボディ取得
  const { theme, details } = await req.json();

  // OpenAI API呼び出し
  try {
    const analysis = await analyzeConsultation({ theme, details });

    return NextResponse.json({
      analysis,
      remaining, // 残り回数をフロントエンドに返す
    });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return NextResponse.json(
      { error: "AI分析中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
```

---

## 5. PIIフィルタ実装

```typescript
// lib/pii-filter.ts

const PII_PATTERNS = {
  name: /[一-龥]{2,4}(?:さん|君|ちゃん)?/g,
  phone: /\d{2,4}[-\s]?\d{2,4}[-\s]?\d{4}/g,
  email: /[\w\.-]+@[\w\.-]+\.\w+/g,
  address: /[都道府県][市区町村][一-龥ぁ-ん]+/g,
};

export function filterPII(text: string): string {
  let filtered = text;

  // 名前の匿名化
  filtered = filtered.replace(PII_PATTERNS.name, "[生徒名]");

  // 電話番号の匿名化
  filtered = filtered.replace(PII_PATTERNS.phone, "[電話番号]");

  // メールアドレスの匿名化（学校ドメイン以外）
  filtered = filtered.replace(PII_PATTERNS.email, (match) => {
    if (match.endsWith("@seig-boys.jp") || match.endsWith("@itoksk.com")) {
      return match; // 学校ドメインはそのまま
    }
    return "[メールアドレス]";
  });

  // 住所の匿名化
  filtered = filtered.replace(PII_PATTERNS.address, "[住所]");

  return filtered;
}

// 使用例
export async function analyzeConsultation({ theme, details }: {
  theme: string;
  details: string;
}) {
  // PII除去
  const filteredDetails = filterPII(details);

  // OpenAI API呼び出し
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: CONSULTATION_ANALYSIS_PROMPT,
      },
      {
        role: "user",
        content: `テーマ: ${theme}\n詳細: ${filteredDetails}`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 500,
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}
```

---

## 6. エラーハンドリング

```typescript
// lib/openai.ts
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeConsultationWithRetry(
  params: { theme: string; details: string },
  maxRetries = 3
) {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: CONSULTATION_ANALYSIS_PROMPT,
          },
          {
            role: "user",
            content: `テーマ: ${params.theme}\n詳細: ${filterPII(params.details)}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 500,
      });

      return JSON.parse(response.choices[0].message.content || "{}");
    } catch (error) {
      lastError = error as Error;

      // レート制限エラーの場合は待機
      if (error instanceof OpenAI.APIError && error.status === 429) {
        const waitTime = Math.pow(2, attempt) * 1000; // 指数バックオフ
        console.warn(`Rate limit hit, waiting ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      // その他のエラーはすぐにリトライ
      if (attempt < maxRetries) {
        console.warn(`Attempt ${attempt} failed, retrying...`);
        continue;
      }
    }
  }

  // 全てのリトライ失敗
  throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`);
}
```

---

## 7. 環境変数設定

```.env.local
# OpenAI API
OPENAI_API_KEY=sk-...

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=... # openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Firestore
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
```

---

## 8. 次のアクションアイテム

- [ ] OpenAI APIキーの取得（教員チーム）
- [ ] Upstash Redisアカウント作成（開発チーム）
- [ ] プロンプトの微調整とテスト（TAチーム）
- [ ] PIIフィルタの精度向上（開発チーム）

---

## 9. まとめ

### コスト
✅ GPT-4o mini使用で月間**10円未満**（生徒20人×月20回）

### レート制限
✅ ユーザーごと: 1時間に10回
✅ IP制限: 1時間に50回
✅ リトライロジック: 指数バックオフ

### セキュリティ
✅ PIIフィルタ実装
✅ 学校ドメイン除外
✅ エラーハンドリング

**実装ファイル:** 次タスク（#HEAR-003〜005）で作成
