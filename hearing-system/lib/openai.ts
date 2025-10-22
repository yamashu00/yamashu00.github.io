import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// resources.jsonを読み込む
function loadResources() {
  try {
    const resourcesPath = path.join(process.cwd(), 'public', 'resources.json');
    const resourcesData = JSON.parse(fs.readFileSync(resourcesPath, 'utf-8'));
    return resourcesData.resources;
  } catch (error) {
    console.error('Failed to load resources.json:', error);
    return [];
  }
}

// リソース情報をプロンプト用にフォーマット
function formatResourcesForPrompt() {
  const resources = loadResources();

  const gems = resources.filter((r: any) => r.type === 'gem-tool');
  const codeSnippets = resources.filter((r: any) => r.type === 'code-snippet');
  const themes = resources.filter((r: any) => r.type === 'theme');
  const externalLinks = resources.filter((r: any) => r.type === 'external-link');

  let formatted = '\n利用可能なリソース:\n\n';

  if (gems.length > 0) {
    formatted += '【Gemツール】\n';
    gems.forEach((gem: any) => {
      formatted += `  - ${gem.id}: ${gem.title} - ${gem.description}\n`;
      formatted += `    URL: ${gem.url}\n`;
    });
    formatted += '\n';
  }

  if (codeSnippets.length > 0) {
    formatted += '【コードスニペット】\n';
    codeSnippets.forEach((code: any) => {
      formatted += `  - ${code.id}: ${code.title} - ${code.description}\n`;
    });
    formatted += '\n';
  }

  if (themes.length > 0) {
    formatted += '【学習テーマ】\n';
    themes.forEach((theme: any) => {
      formatted += `  - ${theme.id}: ${theme.title} - ${theme.description}\n`;
    });
    formatted += '\n';
  }

  if (externalLinks.length > 0) {
    formatted += '【外部リンク】\n';
    externalLinks.forEach((link: any) => {
      formatted += `  - ${link.id}: ${link.title} - ${link.description}\n`;
    });
  }

  return formatted;
}

// 相談分析用プロンプトを動的に生成
function generateAnalysisPrompt() {
  const resourceInfo = formatResourcesForPrompt();

  return `あなたは高校生のUnity学習をサポートするAIアシスタントです。

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
- recommendedResourcesには最も関連性の高いリソース（最大3つ）を選んでください
${resourceInfo}
`;
}
// PIIフィルタ
const PII_PATTERNS = {
  name: /[一-龥]{2,4}(?:さん|君|ちゃん)?/g,
  phone: /\d{2,4}[-\s]?\d{2,4}[-\s]?\d{4}/g,
  email: /[\w\.-]+@[\w\.-]+\.\w+/g,
  address: /[都道府県][市区町村][一-龥ぁ-ん]+/g,
};

export function filterPII(text: string): string {
  let filtered = text;

  // 名前の匿名化
  filtered = filtered.replace(PII_PATTERNS.name, '[生徒名]');

  // 電話番号の匿名化
  filtered = filtered.replace(PII_PATTERNS.phone, '[電話番号]');

  // メールアドレスの匿名化（学校ドメイン以外）
  filtered = filtered.replace(PII_PATTERNS.email, (match) => {
    if (match.endsWith('@seig-boys.jp') || match.endsWith('@itoksk.com')) {
      return match; // 学校ドメインはそのまま
    }
    return '[メールアドレス]';
  });

  // 住所の匿名化
  filtered = filtered.replace(PII_PATTERNS.address, '[住所]');

  return filtered;
}

// 相談分析（リトライ機能付き）
export async function analyzeConsultationWithRetry(
  params: { theme: string; details: string },
  maxRetries = 3
) {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const filteredDetails = filterPII(params.details);
      const prompt = generateAnalysisPrompt();

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: `テーマ: ${params.theme}\n詳細: ${filteredDetails}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 800,
      });

      return JSON.parse(response.choices[0].message.content || '{}');
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
