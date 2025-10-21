'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function ConsultationIntro() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/auth/signin');
    },
  });

  const [agreed, setAgreed] = useState(false);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  const handleStart = () => {
    if (!agreed) {
      alert('利用規約に同意してください');
      return;
    }
    router.push('/consultation/new');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Unity学習ヒアリング</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-700 hover:text-gray-900 text-sm font-medium"
          >
            ← ダッシュボード
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ウェルカムセクション */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-8 mb-6 text-white">
          <div className="text-center">
            <div className="text-5xl mb-4">🤖</div>
            <h2 className="text-3xl font-bold mb-3">AIヒアリングシステム</h2>
            <p className="text-lg opacity-90">
              Unity学習の問題や疑問をAIと対話しながら整理しましょう
            </p>
          </div>
        </div>

        {/* このヒアリングについて */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start mb-4">
            <div className="text-3xl mr-4">📝</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">このヒアリングについて</h3>
              <p className="text-gray-900 leading-relaxed">
                Unity開発の問題や疑問をAIと対話しながら整理していただきます。
                AIが問題を分析し、解決のヒントや適切な学習リソースを提示します。
                自己振り返りを通じて、学習の定着を促進します。
              </p>
              <div className="mt-3 inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded font-medium">
                所要時間: 約10〜15分
              </div>
            </div>
          </div>
        </div>

        {/* プライバシーについて */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start mb-4">
            <div className="text-3xl mr-4">🔒</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">プライバシーについて</h3>
              <ul className="space-y-2 text-gray-900">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-bold">•</span>
                  <span>Googleアカウントでのログインが必要です</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-bold">•</span>
                  <span>相談内容は教師・TAが確認し、学習支援に活用します</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-bold">•</span>
                  <span>あなたの成長をサポートするためのデータとして大切に扱います</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2 font-bold">•</span>
                  <span>相談履歴はいつでも確認でき、PDFでダウンロード可能です</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 5ステップの流れ */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start mb-4">
            <div className="text-3xl mr-4">📋</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-4">5ステップの流れ</h3>

              <div className="space-y-4">
                {/* ステップ1 */}
                <div className="flex items-start border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">相談テーマを選択</h4>
                    <p className="text-gray-700 text-sm">Unityエラー、ベクトル・数学、素材の使い方など</p>
                  </div>
                </div>

                {/* ステップ2 */}
                <div className="flex items-start border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">詳細を入力</h4>
                    <p className="text-gray-700 text-sm">具体的な問題や状況を記入してください</p>
                  </div>
                </div>

                {/* ステップ3 */}
                <div className="flex items-start border-l-4 border-green-500 pl-4 py-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">AI分析結果</h4>
                    <p className="text-gray-700 text-sm">AIが問題を分析し、解決案と推奨リソースを提示します</p>
                  </div>
                </div>

                {/* ステップ4 */}
                <div className="flex items-start border-l-4 border-green-500 pl-4 py-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">振り返り</h4>
                    <p className="text-gray-700 text-sm">成功したこと、課題、次にやることを記入します</p>
                  </div>
                </div>

                {/* ステップ5 */}
                <div className="flex items-start border-l-4 border-purple-500 pl-4 py-2">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold mr-3">
                    5
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">レポート保存</h4>
                    <p className="text-gray-700 text-sm">相談履歴として保存され、いつでも確認可能です</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 期待できる効果 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start mb-4">
            <div className="text-3xl mr-4">✨</div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">期待できる効果</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <span className="text-green-600 mr-2 text-xl">✓</span>
                  <span className="text-gray-900">問題の整理と解決のヒント</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-2 text-xl">✓</span>
                  <span className="text-gray-900">適切な学習リソースの推薦</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-2 text-xl">✓</span>
                  <span className="text-gray-900">自己振り返りによる学習の定着</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-2 text-xl">✓</span>
                  <span className="text-gray-900">教師・TAからの的確なサポート</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 同意とスタートボタン */}
        <div className="bg-white rounded-lg shadow p-6">
          <label className="flex items-start cursor-pointer mb-6">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 mr-3 w-5 h-5"
            />
            <span className="text-gray-900">
              上記の内容を理解し、相談内容が教育目的で教師・TAに共有されることに同意します。
            </span>
          </label>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-8 py-3 border-2 border-gray-700 text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition"
            >
              キャンセル
            </button>
            <button
              onClick={handleStart}
              disabled={!agreed}
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
            >
              ヒアリングを開始
            </button>
          </div>
        </div>

        {/* フッター注意事項 */}
        <div className="mt-6 text-center text-sm text-gray-700">
          <p>困ったことがあれば、いつでも教師・TAに相談してください。</p>
        </div>
      </main>
    </div>
  );
}
