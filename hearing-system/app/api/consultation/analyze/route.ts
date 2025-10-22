import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyzeConsultationWithRetry } from '@/lib/openai';

export async function POST(req: NextRequest) {
  // 認証チェック
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // リクエストボディ取得
  try {
    const { theme, details } = await req.json();

    if (!theme || !details) {
      return NextResponse.json(
        { error: 'テーマと詳細は必須です' },
        { status: 400 }
      );
    }

    if (details.length < 20) {
      return NextResponse.json(
        { error: '詳細は20文字以上入力してください' },
        { status: 400 }
      );
    }

    if (details.length > 5000) {
      return NextResponse.json(
        { error: '詳細は5000文字以内で入力してください' },
        { status: 400 }
      );
    }

    // OpenAI API呼び出し
    const analysis = await analyzeConsultationWithRetry({ theme, details });

    return NextResponse.json({
      analysis,
    });
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    return NextResponse.json(
      { error: error.message || 'AI分析中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
