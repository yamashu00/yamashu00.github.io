'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

type Step = 1 | 2 | 3 | 4 | 5;

export default function NewConsultation() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/auth/signin');
    },
  });

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [theme, setTheme] = useState('');
  const [customTheme, setCustomTheme] = useState('');
  const [details, setDetails] = useState('');
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [selfEvaluation, setSelfEvaluation] = useState({
    success: '',
    challenges: '',
    nextSteps: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presetThemes = [
    { value: 'unity-error', label: 'Unityエラー' },
    { value: 'vector-math', label: 'ベクトル・数学' },
    { value: 'asset-usage', label: '素材の使い方' },
    { value: 'game-design', label: 'ゲーム設計' },
    { value: 'custom', label: 'その他（カスタム）' },
  ];

  const handleStep1Next = () => {
    if (!theme) {
      setError('テーマを選択してください');
      return;
    }
    if (theme === 'custom' && !customTheme.trim()) {
      setError('カスタムテーマを入力してください');
      return;
    }
    setError(null);
    setCurrentStep(2);
  };

  const handleStep2Next = () => {
    if (!details.trim()) {
      setError('相談内容を入力してください');
      return;
    }
    if (details.length < 20) {
      setError('相談内容は20文字以上入力してください');
      return;
    }
    setError(null);
    handleAnalyze();
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/consultation/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: theme === 'custom' ? customTheme : theme,
          details,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI分析中にエラーが発生しました');
      }

      const data = await response.json();
      setAiResponse(data.analysis);
      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Next = () => {
    setCurrentStep(4);
  };

  const handleStep4Next = () => {
    if (
      !selfEvaluation.success.trim() ||
      !selfEvaluation.challenges.trim() ||
      !selfEvaluation.nextSteps.trim()
    ) {
      setError('全ての項目を入力してください');
      return;
    }
    setError(null);
    handleSaveConsultation();
  };

  const handleSaveConsultation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/consultation/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: theme === 'custom' ? customTheme : theme,
          details,
          aiResponse,
          selfEvaluation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '保存中にエラーが発生しました');
      }

      const data = await response.json();
      setCurrentStep(5);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">新しい相談</h1>
        </div>
      </header>

      {/* プログレスバー */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step < currentStep
                      ? 'bg-green-500 text-white'
                      : step === currentStep
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {step}
                </div>
                {step < 5 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      step < currentStep ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm text-gray-900 text-center font-medium">
            {currentStep === 1 && 'ステップ 1/5: 相談テーマを選択'}
            {currentStep === 2 && 'ステップ 2/5: 詳細を入力'}
            {currentStep === 3 && 'ステップ 3/5: AI回答'}
            {currentStep === 4 && 'ステップ 4/5: 振り返り'}
            {currentStep === 5 && 'ステップ 5/5: 完了'}
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* ステップ1: テーマ選択 */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">相談テーマを選択</h2>

            <div className="space-y-3">
              {presetThemes.map((preset) => (
                <label
                  key={preset.value}
                  className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="theme"
                    value={preset.value}
                    checked={theme === preset.value}
                    onChange={(e) => setTheme(e.target.value)}
                    className="mr-3"
                  />
                  <span className="font-medium text-gray-900">{preset.label}</span>
                </label>
              ))}
            </div>

            {theme === 'custom' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  カスタムテーマ
                </label>
                <input
                  type="text"
                  value={customTheme}
                  onChange={(e) => setCustomTheme(e.target.value)}
                  placeholder="例: プレイヤーの移動が遅い"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleStep1Next}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                次へ
              </button>
            </div>
          </div>
        )}

        {/* ステップ2: 詳細入力 */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">相談内容を入力</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                選択したテーマ
              </label>
              <div className="px-4 py-2 bg-gray-100 rounded font-medium text-gray-900">
                {theme === 'custom' ? customTheme : presetThemes.find((t) => t.value === theme)?.label}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                相談内容 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={10}
                placeholder="具体的に記入してください...&#10;&#10;💡 ヒント:&#10;- どんな問題が起きていますか？&#10;- どこまで試しましたか？&#10;- エラーメッセージがあれば貼り付けてください"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
              <p className="mt-1 text-sm text-gray-700 font-medium">
                {details.length}/5000文字（最低20文字）
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2 border-2 border-gray-700 text-gray-900 font-medium rounded hover:bg-gray-100"
              >
                戻る
              </button>
              <button
                onClick={handleStep2Next}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'AI分析中...' : 'AIに相談'}
              </button>
            </div>
          </div>
        )}

        {/* ステップ3: AI回答 */}
        {currentStep === 3 && aiResponse && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">🤖 AI分析結果</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">要約</h3>
                <p className="text-gray-900">{aiResponse.summary}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">カテゴリ</h3>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {aiResponse.category}
                </span>
                <span className="ml-2 inline-block px-3 py-1 bg-orange-100 text-orange-800 rounded text-sm">
                  難易度: {aiResponse.difficulty}
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">主な問題点</h3>
                <ul className="list-disc list-inside text-gray-900">
                  {aiResponse.keyIssues?.map((issue: string, index: number) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">解決案</h3>
                <p className="text-gray-900">{aiResponse.suggestedSolution}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">次にすべきこと</h3>
                <ol className="list-decimal list-inside text-gray-900">
                  {aiResponse.nextSteps?.map((step: string, index: number) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>

              {aiResponse.recommendedResources && aiResponse.recommendedResources.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900">💡 推奨リソース</h3>
                  <ul className="space-y-2">
                    {aiResponse.recommendedResources.map((resource: any, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        <div>
                          <a
                            href="/index.html#section3"
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
                <h3 className="font-semibold text-gray-900">推定解決時間</h3>
                <p className="text-gray-900">{aiResponse.estimatedTime}</p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900">タグ</h3>
                <div className="flex flex-wrap gap-2">
                  {aiResponse.tags?.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-200 text-gray-900 rounded text-sm font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded">
              <p className="text-sm text-blue-800">
                この回答は役に立ちましたか？次のステップで振り返りを記入してください。
              </p>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2 border-2 border-gray-700 text-gray-900 font-medium rounded hover:bg-gray-100"
              >
                戻る
              </button>
              <button
                onClick={handleStep3Next}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                次へ
              </button>
            </div>
          </div>
        )}

        {/* ステップ4: 振り返り */}
        {currentStep === 4 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">振り返り</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  成功したこと <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs text-gray-700 font-medium">
                    💡 例: エラーメッセージの意味を理解できた
                  </span>
                </label>
                <textarea
                  value={selfEvaluation.success}
                  onChange={(e) =>
                    setSelfEvaluation({ ...selfEvaluation, success: e.target.value })
                  }
                  rows={3}
                  placeholder="具体的に記入してください（30文字以上推奨）"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  課題・まだわからないこと <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={selfEvaluation.challenges}
                  onChange={(e) =>
                    setSelfEvaluation({ ...selfEvaluation, challenges: e.target.value })
                  }
                  rows={3}
                  placeholder="具体的に記入してください"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  次にやること <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={selfEvaluation.nextSteps}
                  onChange={(e) =>
                    setSelfEvaluation({ ...selfEvaluation, nextSteps: e.target.value })
                  }
                  rows={3}
                  placeholder="具体的に記入してください"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2 border-2 border-gray-700 text-gray-900 font-medium rounded hover:bg-gray-100"
              >
                戻る
              </button>
              <button
                onClick={handleStep4Next}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? '保存中...' : 'レポート作成'}
              </button>
            </div>
          </div>
        )}

        {/* ステップ5: 完了 */}
        {currentStep === 5 && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              相談レポートが作成されました！
            </h2>
            <p className="text-gray-900 mb-6">
              レポートは保存されました。相談履歴から確認できます。
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => router.push('/consultation/history')}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                相談履歴を見る
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                ダッシュボードに戻る
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
