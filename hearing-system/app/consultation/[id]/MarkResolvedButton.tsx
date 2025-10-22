'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface MarkResolvedButtonProps {
  consultationId: string;
  currentStatus: boolean;
}

export default function MarkResolvedButton({
  consultationId,
  currentStatus,
}: MarkResolvedButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleToggleResolved = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/consultation/${consultationId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // ページをリロードして最新の状態を取得
      router.refresh();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('ステータスの更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleResolved}
      disabled={isLoading}
      className={`px-6 py-2 rounded font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${
        currentStatus
          ? 'border-2 border-gray-700 text-gray-900 hover:bg-gray-100'
          : 'bg-green-600 text-white hover:bg-green-700'
      }`}
    >
      {isLoading
        ? '更新中...'
        : currentStatus
        ? '未解決に戻す'
        : '解決済みにマークする'}
    </button>
  );
}
