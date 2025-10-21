import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase';
import Link from 'next/link';

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const user = session.user as any;

  // 教員・TAのみアクセス可能
  if (user.role !== 'teacher' && user.role !== 'ta') {
    redirect('/dashboard');
  }

  // 全ての相談を取得
  const consultationsRef = db.collection('consultations');
  const snapshot = await consultationsRef.orderBy('timestamp', 'desc').get();

  const consultations = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate().toISOString(),
  })) as any[];

  // 統計データの計算
  const totalConsultations = consultations.length;
  const resolvedConsultations = consultations.filter((c) => c.resolved).length;
  const unresolvedConsultations = totalConsultations - resolvedConsultations;

  // カテゴリ別集計
  const categoryCounts: Record<string, number> = {};
  consultations.forEach((c) => {
    const category = c.aiResponse?.category || '未分類';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  // 難易度別集計
  const difficultyCounts = {
    low: consultations.filter((c) => c.aiResponse?.difficulty === 'low').length,
    medium: consultations.filter((c) => c.aiResponse?.difficulty === 'medium')
      .length,
    high: consultations.filter((c) => c.aiResponse?.difficulty === 'high')
      .length,
  };

  // よくある質問トップ10（カテゴリ別）
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">統計・分析</h1>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← ダッシュボード
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 全体統計 */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            全体統計
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-700">総相談件数</p>
              <p className="text-3xl font-bold text-gray-900">
                {totalConsultations}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-700">解決済み</p>
              <p className="text-3xl font-bold text-green-600">
                {resolvedConsultations}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-700">未解決</p>
              <p className="text-3xl font-bold text-orange-600">
                {unresolvedConsultations}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-700">解決率</p>
              <p className="text-3xl font-bold text-blue-600">
                {totalConsultations > 0
                  ? Math.round(
                      (resolvedConsultations / totalConsultations) * 100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* カテゴリ別分析 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              よくあるカテゴリ（トップ10）
            </h2>
            {topCategories.length > 0 ? (
              <div className="space-y-3">
                {topCategories.map(([category, count], index) => (
                  <div key={category} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 w-8">
                      {index + 1}.
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {category}
                        </span>
                        <span className="text-sm text-gray-700">
                          {count}件
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(count / totalConsultations) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-700">データがありません</p>
            )}
          </div>

          {/* 難易度別分析 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              難易度別相談件数
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-500 rounded" />
                  <span className="text-sm font-medium text-gray-900">
                    低（Low）
                  </span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {difficultyCounts.low}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded" />
                  <span className="text-sm font-medium text-gray-900">
                    中（Medium）
                  </span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {difficultyCounts.medium}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-red-500 rounded" />
                  <span className="text-sm font-medium text-gray-900">
                    高（High）
                  </span>
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {difficultyCounts.high}
                </span>
              </div>

              {/* 難易度別グラフ */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="space-y-3">
                  {difficultyCounts.low > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-700">低</span>
                        <span className="text-xs text-gray-700">
                          {totalConsultations > 0
                            ? Math.round(
                                (difficultyCounts.low / totalConsultations) *
                                  100
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${
                              totalConsultations > 0
                                ? (difficultyCounts.low / totalConsultations) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {difficultyCounts.medium > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-700">中</span>
                        <span className="text-xs text-gray-700">
                          {totalConsultations > 0
                            ? Math.round(
                                (difficultyCounts.medium /
                                  totalConsultations) *
                                  100
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{
                            width: `${
                              totalConsultations > 0
                                ? (difficultyCounts.medium /
                                    totalConsultations) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {difficultyCounts.high > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-700">高</span>
                        <span className="text-xs text-gray-700">
                          {totalConsultations > 0
                            ? Math.round(
                                (difficultyCounts.high / totalConsultations) *
                                  100
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{
                            width: `${
                              totalConsultations > 0
                                ? (difficultyCounts.high / totalConsultations) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 最近の相談トレンド */}
        <div className="bg-white p-6 rounded-lg shadow mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            最近の相談（最新10件）
          </h2>
          {consultations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      日時
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      カテゴリ
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      難易度
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      状態
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {consultations.slice(0, 10).map((consultation) => (
                    <tr key={consultation.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(
                          consultation.timestamp
                        ).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {consultation.aiResponse?.category || '未分類'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            consultation.aiResponse?.difficulty === 'low'
                              ? 'bg-green-100 text-green-800'
                              : consultation.aiResponse?.difficulty === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {consultation.aiResponse?.difficulty === 'low'
                            ? '低'
                            : consultation.aiResponse?.difficulty === 'medium'
                            ? '中'
                            : '高'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            consultation.resolved
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {consultation.resolved ? '解決済み' : '未解決'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-700">データがありません</p>
          )}
        </div>
      </main>
    </div>
  );
}
