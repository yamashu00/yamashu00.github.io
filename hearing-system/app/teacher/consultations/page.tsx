import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase';
import Link from 'next/link';

export default async function TeacherConsultations() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const user = session.user as any;

  // 教員・TAのみアクセス可能
  if (user.role !== 'teacher' && user.role !== 'ta') {
    redirect('/dashboard');
  }

  // Firestoreから全相談を取得
  const consultationsRef = db.collection('consultations');
  const snapshot = await consultationsRef
    .orderBy('timestamp', 'desc')
    .limit(100)
    .get();

  const consultations = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate().toISOString(),
  }));

  // 統計情報を計算
  const totalConsultations = consultations.length;
  const resolvedCount = consultations.filter((c: any) => c.resolved).length;
  const unresolvedCount = totalConsultations - resolvedCount;

  // カテゴリ別集計
  const categoryCount: { [key: string]: number } = {};
  consultations.forEach((c: any) => {
    const category = c.aiResponse?.category || 'other';
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });

  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">相談ダッシュボード</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/teacher/analytics"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              統計・分析 →
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-700 text-sm"
            >
              ← ダッシュボード
            </Link>
          </div>
        </div>
      </header>

      {/* 統計サマリー */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">総相談件数</p>
            <p className="text-3xl font-bold text-gray-900">{totalConsultations}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">解決済み</p>
            <p className="text-3xl font-bold text-green-600">{resolvedCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">未解決</p>
            <p className="text-3xl font-bold text-orange-600">{unresolvedCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">解決率</p>
            <p className="text-3xl font-bold text-blue-600">
              {totalConsultations > 0
                ? Math.round((resolvedCount / totalConsultations) * 100)
                : 0}
              %
            </p>
          </div>
        </div>

        {/* よくあるカテゴリ */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            よくあるカテゴリ
          </h2>
          <div className="space-y-2">
            {topCategories.map(([category, count]) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-gray-700">{category}</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                  {count}件
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 相談一覧 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">相談一覧</h2>
          </div>

          {consultations.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              相談がありません
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      日時
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      生徒
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      テーマ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      カテゴリ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      難易度
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状態
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      アクション
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {consultations.map((consultation: any) => (
                    <tr key={consultation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(consultation.timestamp).toLocaleDateString('ja-JP')}
                        <br />
                        <span className="text-xs text-gray-500">
                          {new Date(consultation.timestamp).toLocaleTimeString('ja-JP', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {consultation.studentId?.split('@')[0] || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={consultation.theme}>
                          {consultation.theme}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {consultation.aiResponse?.category || 'その他'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            consultation.aiResponse?.difficulty === 'high'
                              ? 'bg-red-100 text-red-800'
                              : consultation.aiResponse?.difficulty === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {consultation.aiResponse?.difficulty || 'low'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            consultation.resolved
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {consultation.resolved ? '解決済み' : '未解決'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/consultation/${consultation.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          詳細 →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="mt-6 flex justify-end gap-4">
          <button className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50">
            CSVエクスポート
          </button>
          <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            レポート生成
          </button>
        </div>
      </div>
    </div>
  );
}
