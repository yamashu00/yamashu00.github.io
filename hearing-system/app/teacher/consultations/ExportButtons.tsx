'use client';

import { useState } from 'react';

interface Consultation {
  id: string;
  timestamp: string;
  studentId: string;
  theme: string;
  aiResponse?: {
    category?: string;
    difficulty?: string;
  };
  resolved: boolean;
}

interface ExportButtonsProps {
  consultations: Consultation[];
}

export default function ExportButtons({ consultations }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCSVExport = () => {
    setIsExporting(true);
    try {
      // CSVヘッダー
      const headers = [
        '日時',
        '生徒',
        'テーマ',
        'カテゴリ',
        '難易度',
        '状態',
      ];

      // CSVデータ
      const rows = consultations.map((c) => [
        c.timestamp
          ? new Date(c.timestamp).toLocaleString('ja-JP')
          : '-',
        c.studentId?.split('@')[0] || '-',
        `"${c.theme?.replace(/"/g, '""') || '-'}"`, // CSV エスケープ
        c.aiResponse?.category || 'その他',
        c.aiResponse?.difficulty || 'low',
        c.resolved ? '解決済み' : '未解決',
      ]);

      // CSV文字列を生成
      const csvContent =
        '\uFEFF' + // BOM for Excel
        [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

      // ダウンロード
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `consultations_${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('CSVエクスポートエラー:', error);
      alert('CSVエクスポートに失敗しました');
    } finally {
      setIsExporting(false);
    }
  };

  const handleReportGeneration = () => {
    setIsGenerating(true);
    try {
      // 統計情報を計算
      const totalConsultations = consultations.length;
      const resolvedCount = consultations.filter((c) => c.resolved).length;
      const unresolvedCount = totalConsultations - resolvedCount;
      const resolvedRate =
        totalConsultations > 0
          ? Math.round((resolvedCount / totalConsultations) * 100)
          : 0;

      // カテゴリ別集計
      const categoryCount: { [key: string]: number } = {};
      consultations.forEach((c) => {
        const category = c.aiResponse?.category || 'other';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      // レポートHTML生成
      const reportHTML = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>相談レポート - ${new Date().toLocaleDateString('ja-JP')}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #f9fafb;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        h1 {
            color: #1f2937;
            margin-bottom: 10px;
        }
        .date {
            color: #6b7280;
            font-size: 14px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: white;
            padding: 24px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .stat-label {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 8px;
        }
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #1f2937;
        }
        .section {
            background: white;
            padding: 24px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        h2 {
            color: #1f2937;
            margin-bottom: 20px;
            font-size: 18px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        th {
            background: #f9fafb;
            font-weight: 600;
            color: #374151;
            font-size: 12px;
            text-transform: uppercase;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }
        .badge-resolved {
            background: #d1fae5;
            color: #065f46;
        }
        .badge-unresolved {
            background: #fed7aa;
            color: #92400e;
        }
        @media print {
            body {
                background: white;
            }
            .stat-card, .section {
                box-shadow: none;
                border: 1px solid #e5e7eb;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>相談ダッシュボード レポート</h1>
        <div class="date">生成日時: ${new Date().toLocaleString('ja-JP')}</div>
    </div>

    <div class="stats">
        <div class="stat-card">
            <div class="stat-label">総相談件数</div>
            <div class="stat-value">${totalConsultations}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">解決済み</div>
            <div class="stat-value" style="color: #059669">${resolvedCount}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">未解決</div>
            <div class="stat-value" style="color: #d97706">${unresolvedCount}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">解決率</div>
            <div class="stat-value" style="color: #2563eb">${resolvedRate}%</div>
        </div>
    </div>

    <div class="section">
        <h2>カテゴリ別集計</h2>
        <table>
            <thead>
                <tr>
                    <th>カテゴリ</th>
                    <th>件数</th>
                    <th>割合</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(categoryCount)
                  .sort((a, b) => b[1] - a[1])
                  .map(
                    ([category, count]) => `
                <tr>
                    <td>${category}</td>
                    <td>${count}</td>
                    <td>${Math.round((count / totalConsultations) * 100)}%</td>
                </tr>
                `
                  )
                  .join('')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>相談一覧（最新10件）</h2>
        <table>
            <thead>
                <tr>
                    <th>日時</th>
                    <th>生徒</th>
                    <th>テーマ</th>
                    <th>カテゴリ</th>
                    <th>状態</th>
                </tr>
            </thead>
            <tbody>
                ${consultations
                  .slice(0, 10)
                  .map(
                    (c) => `
                <tr>
                    <td>${new Date(c.timestamp).toLocaleString('ja-JP')}</td>
                    <td>${c.studentId?.split('@')[0] || '-'}</td>
                    <td>${c.theme}</td>
                    <td>${c.aiResponse?.category || 'その他'}</td>
                    <td>
                        <span class="badge ${c.resolved ? 'badge-resolved' : 'badge-unresolved'}">
                            ${c.resolved ? '解決済み' : '未解決'}
                        </span>
                    </td>
                </tr>
                `
                  )
                  .join('')}
            </tbody>
        </table>
    </div>
</body>
</html>
      `;

      // レポートをダウンロード
      const blob = new Blob([reportHTML], { type: 'text/html;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `report_${new Date().toISOString().split('T')[0]}.html`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('レポート生成エラー:', error);
      alert('レポート生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mt-6 flex justify-end gap-4">
      <button
        onClick={handleCSVExport}
        disabled={isExporting}
        className="px-6 py-2 border-2 border-gray-700 text-gray-900 font-medium rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {isExporting ? 'エクスポート中...' : 'CSVエクスポート'}
      </button>
      <button
        onClick={handleReportGeneration}
        disabled={isGenerating}
        className="px-6 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {isGenerating ? '生成中...' : 'レポート生成'}
      </button>
    </div>
  );
}
