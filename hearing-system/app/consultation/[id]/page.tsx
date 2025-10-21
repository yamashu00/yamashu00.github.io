import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import MarkResolvedButton from './MarkResolvedButton';

export default async function ConsultationDetail({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const user = session.user as any;
  const { id } = params;

  // Firestoreから相談を取得
  const consultationRef = db.collection('consultations').doc(id);
  const consultationDoc = await consultationRef.get();

  if (!consultationDoc.exists) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-4">相談が見つかりません</h1>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            ダッシュボードに戻る
          </Link>
        </div>
      </div>
    );
  }

  const consultation = consultationDoc.data();

  // アクセス権限チェック: 自分の相談または教員/TA
  const canView =
    consultation?.studentId === user.email ||
    user.role === 'teacher' ||
    user.role === 'ta';

  if (!canView) {
    redirect('/dashboard');
  }

  const canMarkResolved = user.role === 'teacher' || user.role === 'ta';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">相談詳細</h1>
          <Link
            href="/dashboard"
            className="text-gray-700 hover:text-gray-900 text-sm"
          >
            ← ダッシュボード
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 基本情報 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {consultation?.theme}
              </h2>
              <p className="text-sm text-gray-700">
                投稿者: {consultation?.studentId?.split('@')[0]}
              </p>
              <p className="text-sm text-gray-700">
                日時: {consultation?.timestamp?.toDate().toLocaleString('ja-JP')}
              </p>
            </div>
            <div>
              <span
                className={`px-3 py-1 rounded text-sm font-medium ${
                  consultation?.resolved
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                {consultation?.resolved ? '解決済み' : '未解決'}
              </span>
            </div>
          </div>

          {canMarkResolved && (
            <MarkResolvedButton
              consultationId={id}
              currentStatus={consultation?.resolved || false}
            />
          )}
        </div>

        {/* 相談内容 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">📝 相談内容</h3>
          <p className="text-gray-900 whitespace-pre-wrap">{consultation?.details}</p>
        </div>

        {/* AI分析結果 */}
        {consultation?.aiResponse && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">🤖 AI分析結果</h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">要約</h4>
                <p className="text-gray-900">{consultation.aiResponse.summary}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">カテゴリ / 難易度</h4>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {consultation.aiResponse.category}
                  </span>
                  <span
                    className={`px-3 py-1 rounded text-sm ${
                      consultation.aiResponse.difficulty === 'high'
                        ? 'bg-red-100 text-red-800'
                        : consultation.aiResponse.difficulty === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {consultation.aiResponse.difficulty}
                  </span>
                </div>
              </div>

              {consultation.aiResponse.keyIssues && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">主な問題点</h4>
                  <ul className="list-disc list-inside text-gray-900">
                    {consultation.aiResponse.keyIssues.map((issue: string, index: number) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">解決案</h4>
                <p className="text-gray-900">{consultation.aiResponse.suggestedSolution}</p>
              </div>

              {consultation.aiResponse.nextSteps && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">次にすべきこと</h4>
                  <ol className="list-decimal list-inside text-gray-900">
                    {consultation.aiResponse.nextSteps.map((step: string, index: number) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {consultation.aiResponse.recommendedResources && consultation.aiResponse.recommendedResources.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">💡 推奨リソース</h4>
                  <ul className="space-y-2">
                    {consultation.aiResponse.recommendedResources.map((resource: any, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        <div>
                          <a
                            href="https://yamashu00.github.io/#section3"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {resource.id}
                          </a>
                          <span className="text-gray-900"> - {resource.reason}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">推定解決時間</h4>
                <p className="text-gray-900">{consultation.aiResponse.estimatedTime}</p>
              </div>

              {consultation.aiResponse.tags && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">タグ</h4>
                  <div className="flex flex-wrap gap-2">
                    {consultation.aiResponse.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-200 text-gray-900 rounded text-sm font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 振り返り */}
        {consultation?.selfEvaluation && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">📊 振り返り</h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">成功したこと</h4>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {consultation.selfEvaluation.success}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">課題・まだわからないこと</h4>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {consultation.selfEvaluation.challenges}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-1">次にやること</h4>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {consultation.selfEvaluation.nextSteps}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
