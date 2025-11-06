import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import ConsultationCard from './ConsultationCard';
import Header from '@/app/components/Header';

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
      <Header
        title="相談履歴"
        links={[
          { href: '/dashboard', label: '🏠 ダッシュボードに戻る', position: 'right' }
        ]}
      />

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
              <ConsultationCard key={consultation.id} consultation={consultation} />
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
