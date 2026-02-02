'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ConsultationCardProps {
  consultation: any;
}

export default function ConsultationCard({ consultation }: ConsultationCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  const handleToggleResolved = async () => {
    setIsUpdating(true);

    try {
      const response = await fetch('/api/consultation/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultationId: consultation.id,
          resolved: !consultation.resolved,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'ステータスの更新に失敗しました');
        return;
      }

      // 成功したらページをリロード
      router.refresh();
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      alert('ステータスの更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {consultation.theme}
          </h3>
          <p className="text-sm text-gray-500">
            {new Date(consultation.timestamp).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
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
        <button
          onClick={handleToggleResolved}
          disabled={isUpdating}
          className={`px-4 py-2 rounded text-sm font-medium transition disabled:opacity-50 ${
            consultation.resolved
              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {isUpdating
            ? '更新中...'
            : consultation.resolved
            ? '未解決に戻す'
            : '解決済みにする'}
        </button>
        <Link
          href={`/consultation/${consultation.id}`}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium px-4 py-2"
        >
          詳細を見る →
        </Link>
      </div>
    </div>
  );
}
