'use client';

import { useState } from 'react';
import { jsPDF } from 'jspdf';

interface ExportPdfButtonProps {
  consultation: any;
}

export default function ExportPdfButton({ consultation }: ExportPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExportPdf = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;
      let yPos = 20;

      // タイトル
      doc.setFontSize(16);
      doc.text('相談レポート', margin, yPos);
      yPos += 15;

      // 基本情報
      doc.setFontSize(12);
      doc.text(`テーマ: ${consultation.theme}`, margin, yPos);
      yPos += 10;
      doc.text(`投稿者: ${consultation.studentId?.split('@')[0]}`, margin, yPos);
      yPos += 10;
      doc.text(`日時: ${consultation.timestamp?.toDate().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`, margin, yPos);
      yPos += 10;
      doc.text(`ステータス: ${consultation.resolved ? '解決済み' : '未解決'}`, margin, yPos);
      yPos += 15;

      // 相談内容
      doc.setFontSize(14);
      doc.text('相談内容', margin, yPos);
      yPos += 10;
      doc.setFontSize(10);
      const detailsLines = doc.splitTextToSize(consultation.details, maxWidth);
      doc.text(detailsLines, margin, yPos);
      yPos += detailsLines.length * 5 + 10;

      // AI分析結果
      if (consultation.aiResponse) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.text('AI分析結果', margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.text(`要約: ${consultation.aiResponse.summary}`, margin, yPos);
        yPos += 10;
        doc.text(`カテゴリ: ${consultation.aiResponse.category}`, margin, yPos);
        yPos += 10;
        doc.text(`難易度: ${consultation.aiResponse.difficulty}`, margin, yPos);
        yPos += 15;

        if (consultation.aiResponse.keyIssues) {
          doc.text('主な問題点:', margin, yPos);
          yPos += 7;
          consultation.aiResponse.keyIssues.forEach((issue: string) => {
            const issueLines = doc.splitTextToSize(`• ${issue}`, maxWidth - 5);
            doc.text(issueLines, margin + 5, yPos);
            yPos += issueLines.length * 5;
          });
          yPos += 5;
        }

        if (consultation.aiResponse.suggestedSolution) {
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }
          doc.text('解決案:', margin, yPos);
          yPos += 7;
          const solutionLines = doc.splitTextToSize(consultation.aiResponse.suggestedSolution, maxWidth);
          doc.text(solutionLines, margin, yPos);
          yPos += solutionLines.length * 5 + 10;
        }

        if (consultation.aiResponse.nextSteps) {
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }
          doc.text('次にすべきこと:', margin, yPos);
          yPos += 7;
          consultation.aiResponse.nextSteps.forEach((step: string, index: number) => {
            const stepLines = doc.splitTextToSize(`${index + 1}. ${step}`, maxWidth - 5);
            doc.text(stepLines, margin + 5, yPos);
            yPos += stepLines.length * 5;
          });
        }
      }

      // 振り返り
      if (consultation.selfEvaluation) {
        if (yPos > 220) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.text('振り返り', margin, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.text('成功したこと:', margin, yPos);
        yPos += 7;
        const successLines = doc.splitTextToSize(consultation.selfEvaluation.success, maxWidth);
        doc.text(successLines, margin, yPos);
        yPos += successLines.length * 5 + 10;

        doc.text('課題・まだわからないこと:', margin, yPos);
        yPos += 7;
        const challengesLines = doc.splitTextToSize(consultation.selfEvaluation.challenges, maxWidth);
        doc.text(challengesLines, margin, yPos);
        yPos += challengesLines.length * 5 + 10;

        doc.text('次にやること:', margin, yPos);
        yPos += 7;
        const nextStepsLines = doc.splitTextToSize(consultation.selfEvaluation.nextSteps, maxWidth);
        doc.text(nextStepsLines, margin, yPos);
      }

      // PDF保存
      const filename = `相談レポート_${consultation.studentId?.split('@')[0]}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error('PDF生成エラー:', error);
      alert('PDF生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleExportPdf}
      disabled={isGenerating}
      className="px-6 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isGenerating ? 'PDF生成中...' : 'PDFでダウンロード'}
    </button>
  );
}
