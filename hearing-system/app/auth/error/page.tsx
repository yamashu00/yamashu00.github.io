'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: { [key: string]: string } = {
    Configuration: 'サーバーの設定に問題があります。管理者に連絡してください。',
    AccessDenied: '許可されていないドメインからのログイン試行です。',
    Verification: '認証に失敗しました。再度お試しください。',
    Default: '予期しないエラーが発生しました。',
  };

  const message = errorMessages[error || 'Default'] || errorMessages.Default;

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
      <div className="text-center">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-4">ログインエラー</h1>
        <p className="text-gray-700 mb-6">{message}</p>

        <Link
          href="/auth/signin"
          className="inline-block bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition"
        >
          ログイン画面に戻る
        </Link>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Suspense fallback={
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-gray-400 text-5xl mb-4">⏳</div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      }>
        <ErrorContent />
      </Suspense>
    </div>
  );
}
