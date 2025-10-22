import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const user = session.user as any;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            ヒアリングシステム
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">
              {user.displayName || user.email}
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                {user.role === 'student' && '生徒'}
                {user.role === 'teacher' && '教員'}
                {user.role === 'ta' && 'TA'}
                {user.role === 'external-instructor' && '外部講師'}
              </span>
            </span>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 生徒・教員・TAのみ表示 */}
          {(user.role === 'student' ||
            user.role === 'teacher' ||
            user.role === 'ta') && (
            <Link
              href="/consultation/intro"
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition"
            >
              <div className="text-blue-600 mb-2">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                新しい相談
              </h2>
              <p className="text-sm text-gray-700">
                相談内容を入力してAI分析を受ける
              </p>
            </Link>
          )}

          {/* 生徒のみ表示 */}
          {user.role === 'student' && (
            <Link
              href="/consultation/history"
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition"
            >
              <div className="text-green-600 mb-2">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                相談履歴
              </h2>
              <p className="text-sm text-gray-700">
                過去の相談とレポートを確認
              </p>
            </Link>
          )}

          {/* 教員・TAのみ表示 */}
          {(user.role === 'teacher' || user.role === 'ta') && (
            <>
              <Link
                href="/teacher/consultations"
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition"
              >
                <div className="text-purple-600 mb-2">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  相談ダッシュボード
                </h2>
                <p className="text-sm text-gray-700">
                  全生徒の相談を閲覧・分析
                </p>
              </Link>

              <Link
                href="/teacher/analytics"
                className="bg-white p-6 rounded-lg shadow hover:shadow-md transition"
              >
                <div className="text-orange-600 mb-2">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  統計・分析
                </h2>
                <p className="text-sm text-gray-700">
                  よくある質問と傾向分析
                </p>
              </Link>
            </>
          )}
        </div>

        {/* 最近の統計（全ユーザー） */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            あなたの統計
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-700">総相談回数</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
            <div>
              <p className="text-sm text-gray-700">解決済み</p>
              <p className="text-2xl font-bold text-green-600">-</p>
            </div>
            <div>
              <p className="text-sm text-gray-700">未解決</p>
              <p className="text-2xl font-bold text-orange-600">-</p>
            </div>
            <div>
              <p className="text-sm text-gray-700">最終相談</p>
              <p className="text-sm font-medium text-gray-900">-</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
