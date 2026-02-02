import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  // 認証チェック
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { theme, details, aiResponse, selfEvaluation } = await req.json();

    if (!theme || !details || !aiResponse || !selfEvaluation) {
      return NextResponse.json(
        { error: '必須フィールドが不足しています' },
        { status: 400 }
      );
    }

    // Firestoreドキュメント参照を作成（自動生成ID）
    const docRef = db.collection('consultations').doc();
    const consultationId = docRef.id;

    // Firestoreに保存
    const consultationData = {
      consultationId,
      studentId: session.user.email,
      timestamp: Timestamp.now(),
      lessonNumber: 0, // TODO: 実際の授業回を設定
      theme,
      details, // 既にPIIフィルタ済み（OpenAI呼び出し時に実施）
      aiResponse,
      selfEvaluation,
      status: 'completed',
      tags: aiResponse.tags || [],
      resolved: false, // デフォルトは未解決
      recommendedResources: aiResponse.recommendedResources || [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await docRef.set(consultationData);

    // ユーザー統計を更新
    const userRef = db.collection('users').doc(session.user.email);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const currentStats = userDoc.data()?.stats || { totalConsultations: 0, resolvedCount: 0 };
      await userRef.update({
        'stats.totalConsultations': currentStats.totalConsultations + 1,
        'stats.lastConsultation': Timestamp.now(),
      });
    }

    return NextResponse.json({
      success: true,
      consultationId,
    });
  } catch (error: any) {
    console.error('Firestore Save Error:', error);
    return NextResponse.json(
      { error: error.message || '保存中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
