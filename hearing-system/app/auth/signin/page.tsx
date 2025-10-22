'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SignInContent() {
  const [activeTab, setActiveTab] = useState<'teacher' | 'student'>('student');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 登録完了後のリダイレクトを検出
    if (searchParams.get('registered') === 'true') {
      setSuccess('登録が完了しました。ログインしてください。');
    }
  }, [searchParams]);

  // 生徒用フォーム
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (err) {
      setError('ログインに失敗しました。再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentEmail || !studentPassword) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await signIn('student-credentials', {
        email: studentEmail,
        password: studentPassword,
        redirect: false,
      });

      if (result?.error) {
        setError('メールアドレスまたはパスワードが正しくありません');
      } else if (result?.ok) {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('ログインに失敗しました。再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">
          ヒアリングシステム
        </h1>

        {/* タブ */}
        <div className="flex mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('student')}
            className={`flex-1 py-2 text-center font-medium transition ${
              activeTab === 'student'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            生徒ログイン
          </button>
          <button
            onClick={() => setActiveTab('teacher')}
            className={`flex-1 py-2 text-center font-medium transition ${
              activeTab === 'teacher'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            教師・TAログイン
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded mb-4 text-sm">
            {success}
          </div>
        )}

        {/* 教師・TAログイン */}
        {activeTab === 'teacher' && (
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-700 text-gray-900 font-medium rounded-lg px-4 py-3 hover:bg-gray-100 transition disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? 'ログイン中...' : 'Googleアカウントでログイン'}
            </button>
            <p className="text-sm text-gray-700 text-center">
              教師・TAの方は許可されたドメインのGoogleアカウントでログインしてください
            </p>
          </div>
        )}

        {/* 生徒ログイン */}
        {activeTab === 'student' && (
          <div>
            <form onSubmit={handleStudentSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="your-name@seig-boys.jp"
                  className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  パスワード
                </label>
                <input
                  type="password"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  placeholder="パスワード"
                  className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-900"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white font-medium rounded-lg px-4 py-3 hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'ログイン中...' : 'ログイン'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <Link
                href="/auth/register"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                初めての方はこちら（新規登録）
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center text-gray-700">読み込み中...</div>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
