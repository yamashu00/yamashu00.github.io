import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    // ログイン済みの場合、ダッシュボードにリダイレクト
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ヒアリングシステム
          </h1>
          <p className="text-gray-600">
            Unity学習をサポートする相談システム
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/auth/signin"
            className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition text-center font-medium"
          >
            ログイン
          </Link>

          <div className="text-center text-sm text-gray-600">
            <p>@seig-boys.jp または @itoksk.com</p>
            <p>のアカウントでログインしてください</p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">
            主な機能
          </h2>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• AI による相談内容の分析</li>
            <li>• 個別レポート生成（PDF/Markdown/JSON）</li>
            <li>• 教員ダッシュボード</li>
            <li>• 推奨リソースの自動提示</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
