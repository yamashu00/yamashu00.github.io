import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { consultationId, resolved } = await request.json();

    if (!consultationId || typeof resolved !== 'boolean') {
      return NextResponse.json(
        { error: '無効なリクエストです' },
        { status: 400 }
      );
    }

    // 相談を取得して、ユーザーが所有者か確認
    const consultationRef = db.collection('consultations').doc(consultationId);
    const consultationDoc = await consultationRef.get();

    if (!consultationDoc.exists) {
      return NextResponse.json(
        { error: '相談が見つかりません' },
        { status: 404 }
      );
    }

    const consultationData = consultationDoc.data();

    // セキュリティチェック：自分の相談のみ更新可能
    if (consultationData?.studentId !== session.user.email) {
      return NextResponse.json(
        { error: 'この相談を更新する権限がありません' },
        { status: 403 }
      );
    }

    // ステータスを更新
    await consultationRef.update({
      resolved,
      updatedAt: new Date(),
    });

    return NextResponse.json(
      { success: true, resolved },
      { status: 200 }
    );
  } catch (error) {
    console.error('ステータス更新エラー:', error);
    return NextResponse.json(
      { error: 'ステータスの更新に失敗しました' },
      { status: 500 }
    );
  }
}
