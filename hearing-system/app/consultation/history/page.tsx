import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase';
import Link from 'next/link';

export default async function ConsultationHistory() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  // Firestoreから相談履歴を取得
  const consultationsRef = db.collection('consultations');
  const snapshot = await consultationsRef
    .where('studentId', '==', session.user.email)
    .orderBy('timestamp', 'desc')
    .limit(50)
    .get();

  const consultations = snapshot.docs.map((doc) => {
    const rawData = doc.data();
    return JSON.parse(JSON.stringify({
      id: doc.id,
      ...rawData,
      timestamp: rawData.timestamp?.toDate?.()?.toISOString() || rawData.timestamp,
      createdAt: rawData.createdAt?.toDate?.()?.toISOString() || rawData.createdAt,
    }));
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">相談履歴</h1>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← ダッシュボード
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {consultations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-700 mb-4">まだ相談がありません</p>
            <Link
              href="/consultation/new"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              新しい相談を始める
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {consultations.map((consultation: any) => (
              <div key={consultation.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {consultation.theme}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(consultation.timestamp).toLocaleString('ja-JP')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`px-3 py-1 rounded text-sm ${
                        consultation.resolved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {consultation.resolved ? '解決済み' : '未解決'}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                      {consultation.aiResponse?.category || 'その他'}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">要約</h4>
                  <p className="text-gray-700 text-sm">
                    {consultation.aiResponse?.summary || '要約なし'}
                  </p>
                </div>

                {consultation.tags && consultation.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {consultation.tags.map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Link
                    href={`/consultation/${consultation.id}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    詳細を見る →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {consultations.length > 0 && (
          <div className="mt-6 text-center">
            <Link
              href="/consultation/new"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              新しい相談を始める
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
