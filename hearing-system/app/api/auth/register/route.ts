import { NextResponse } from 'next/server';
import { db as firestore } from '@/lib/firebase';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password, displayName } = await request.json();

    // バリデーション
    if (!email || !password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードは必須です' },
        { status: 400 }
      );
    }

    // メールアドレスのドメインチェック
    const domain = email.split('@')[1];
    if (domain !== 'seig-boys.jp') {
      return NextResponse.json(
        { error: '聖学院高校のメールアドレス(@seig-boys.jp)のみ登録できます' },
        { status: 400 }
      );
    }

    // 既存ユーザーチェック
    const userRef = firestore.collection('users').doc(email);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 400 }
      );
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // ユーザー作成
    await userRef.set({
      email,
      password: hashedPassword,
      authType: 'credentials',
      role: 'student',
      displayName: displayName || email.split('@')[0],
      avatar: null,
      createdAt: new Date(),
      lastLogin: new Date(),
      active: true,
      preferences: {
        emailNotifications: false,
        theme: 'light',
        language: 'ja',
      },
      stats: {
        totalConsultations: 0,
        resolvedCount: 0,
      },
    });

    return NextResponse.json(
      { message: '登録が完了しました。ログインしてください。' },
      { status: 201 }
    );
  } catch (error) {
    console.error('登録エラー:', error);
    return NextResponse.json(
      { error: '登録中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
