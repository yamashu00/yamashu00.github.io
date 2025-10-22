import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 認証チェック
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as any;

  // 教員/TAのみ実行可能
  if (user.role !== 'teacher' && user.role !== 'ta') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { resolved } = await req.json();
    const { id } = params;

    if (typeof resolved !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Firestoreのドキュメントを更新
    await db.collection('consultations').doc(id).update({
      resolved,
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, resolved });
  } catch (error: any) {
    console.error('Error updating consultation status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update status' },
      { status: 500 }
    );
  }
}
