# 運用ドキュメント (#OPS-002)

## 実施日: 2025-10-21

---

## ヒアリングシステム 運用ガイド

本ドキュメントは、ヒアリングシステムの日常運用、トラブルシューティング、メンテナンスに関する手順をまとめたものです。

---

## 目次

1. [日常運用](#1-日常運用)
2. [問い合わせ対応](#2-問い合わせ対応)
3. [トラブルシューティング](#3-トラブルシューティング)
4. [定期メンテナンス](#4-定期メンテナンス)
5. [バージョン更新手順](#5-バージョン更新手順)
6. [緊急時対応](#6-緊急時対応)
7. [データ管理](#7-データ管理)
8. [運用チェックリスト](#8-運用チェックリスト)

---

## 1. 日常運用

### 1.1 アクセス監視

**毎日確認すべき項目:**

- [ ] Vercel Dashboardでエラー率を確認（< 1%が正常）
- [ ] OpenAI API使用量を確認（月間予算内か）
- [ ] Firebase使用量を確認（無料枠内か）
- [ ] 未解決の相談がないか確認

**確認方法:**

```bash
# Vercel Dashboard
https://vercel.com/dashboard

# OpenAI Usage
https://platform.openai.com/usage

# Firebase Console
https://console.firebase.google.com/
```

---

### 1.2 毎日のルーチン（教員向け）

**朝（授業前）:**
1. ダッシュボードにログイン
2. 未解決の相談を確認（3件以上あれば要対応）
3. よくある質問を確認

**授業中:**
1. 生徒の相談をリアルタイムで確認
2. エラーが頻発している場合は授業で共有

**夕方（授業後）:**
1. 今日の相談件数を確認
2. 重要な相談にフォローアップ
3. 次回授業のトピック候補を抽出

---

### 1.3 週次レポート

**毎週金曜日に実施:**

1. 週間相談件数の集計
2. よくあるテーマTOP5の抽出
3. 解決率の算出
4. 来週の授業テーマへの反映

**レポートテンプレート:**

```
週間ヒアリングレポート（YYYY/MM/DD週）

【統計】
- 総相談件数: XX件
- 解決済み: XX件（解決率: XX%）
- 未解決: XX件

【よくあるテーマ】
1. xxxxxx (XX件)
2. xxxxxx (XX件)
3. xxxxxx (XX件)
4. xxxxxx (XX件)
5. xxxxxx (XX件)

【注目すべき相談】
- [生徒名]の相談: xxxxxx → 来週フォローアップ予定

【来週の授業への反映】
- xxxxxx について補足説明を追加
- xxxxxx のサンプルコードを共有
```

---

## 2. 問い合わせ対応

### 2.1 よくある問い合わせ

#### Q1: ログインできない

**回答:**
1. メールアドレスが @seig-boys.jp または @itoksk.com か確認
2. ブラウザのキャッシュをクリア
3. シークレットモードで試す
4. 別のブラウザで試す

**解決しない場合:**
- 教員に連絡し、Firebaseコンソールでアカウント状態を確認
- 必要に応じてアカウントを再作成

---

#### Q2: AI分析が遅い

**回答:**
1. OpenAI APIのレート制限に達している可能性
2. 1時間に10回までの制限を超えていないか確認
3. 10〜30秒程度は正常な待ち時間

**対処法:**
- 教員ダッシュボードでAPI使用状況を確認
- 必要に応じてレート制限を緩和（開発チームに依頼）

---

#### Q3: 相談が保存されない

**回答:**
1. 全ての項目を入力したか確認（振り返りも必須）
2. インターネット接続を確認
3. ブラウザのコンソールエラーを確認（F12 → Console）

**解決しない場合:**
- Firestoreのダウンタイム確認: https://status.firebase.google.com/
- Vercelのステータス確認: https://www.vercel-status.com/

---

#### Q4: レート制限エラー

**回答:**
「レート制限に達しました。1時間後に再試行してください。」

**対処法:**
1. 1時間待つ（正常な動作）
2. 緊急の場合は教員に相談し、手動で対応

---

### 2.2 問い合わせフロー

```
生徒 → 教員（第一次対応）
  ↓
  解決しない
  ↓
開発チーム（第二次対応）
  ↓
  Vercel / Firebase / OpenAI サポート
```

**連絡先:**
- **教員**: teacher@seig-boys.jp
- **開発チーム**: （内部連絡先）

---

## 3. トラブルシューティング

### 3.1 システム障害時の対応

#### レベル1: 一部機能の不具合

**症状:**
- 一部のページが遅い
- 特定の操作でエラーが発生

**対応:**
1. Vercel Logsでエラーを確認
2. Firebase Console でエラーログを確認
3. 問題箇所を特定し、開発チームに報告

**コマンド:**
```bash
# Vercel Logs確認
vercel logs --follow

# Firebaseログ確認
firebase functions:log
```

---

#### レベル2: システム全体の障害

**症状:**
- ログインできない
- 全てのページでエラーが発生

**対応:**
1. **即座に以下を確認:**
   - Vercelステータス: https://www.vercel-status.com/
   - Firebaseステータス: https://status.firebase.google.com/
   - OpenAIステータス: https://status.openai.com/

2. **緊急連絡:**
   - 開発チームに連絡
   - 生徒にSlack/メールで通知

3. **ロールバック検討:**
   - Vercel Dashboard → Deployments → 前のバージョンを "Promote to Production"

---

#### レベル3: データ消失・破損

**症状:**
- 相談データが消えた
- データが壊れている

**対応:**
1. **即座にバックアップから復元:**
   ```bash
   firebase firestore:restore gs://yamashu-hearing-backups/YYYY-MM-DD
   ```

2. **原因調査:**
   - Firestore Audit Logsを確認
   - 不正アクセスの可能性を確認

3. **再発防止策:**
   - Security Rulesの見直し
   - バックアップ頻度の見直し

---

### 3.2 エラーコード一覧

| エラーコード | 意味 | 対処法 |
|-------------|------|--------|
| 401 Unauthorized | 認証エラー | 再ログイン |
| 403 Forbidden | アクセス権限なし | ロールを確認 |
| 429 Too Many Requests | レート制限 | 1時間待つ |
| 500 Internal Server Error | サーバーエラー | 開発チームに連絡 |
| 503 Service Unavailable | サービス停止中 | ステータスページを確認 |

---

## 4. 定期メンテナンス

### 4.1 毎週のメンテナンス

**毎週日曜日午前2時（自動実行）:**

- [ ] データクリーンアップ（期限切れレポート削除）
- [ ] バックアップ実行
- [ ] ログローテーション

**確認項目:**
```bash
# バックアップ確認
firebase firestore:list-backups

# ログ確認
firebase functions:log --only dailyCleanup
firebase functions:log --only weeklyBackup
```

---

### 4.2 毎月のメンテナンス

**毎月第1日曜日:**

- [ ] 依存パッケージの更新チェック
  ```bash
  cd hearing-system
  npm outdated
  ```

- [ ] セキュリティアップデート
  ```bash
  npm audit
  npm audit fix
  ```

- [ ] Firestore使用量の確認（無料枠: 1GB/50K reads/20K writes per day）

- [ ] OpenAI API使用量の確認（予算内か）

- [ ] Upstash Redis使用量の確認

---

### 4.3 学期ごとのメンテナンス

**学期末:**

- [ ] 全相談データのバックアップ
- [ ] 統計レポートの生成
- [ ] 来学期の授業計画への反映

**学期開始前:**

- [ ] 新入生アカウントの準備
- [ ] 卒業生アカウントの無効化
- [ ] 外部講師アカウントの更新

---

## 5. バージョン更新手順

### 5.1 マイナーアップデート（機能追加）

**手順:**

1. **開発環境でテスト**
   ```bash
   cd hearing-system
   git pull origin main
   npm install
   npm run dev
   ```

2. **本番環境にデプロイ**
   ```bash
   git push origin main
   # → Vercelが自動デプロイ
   ```

3. **デプロイ後確認**
   - [ ] ログイン動作確認
   - [ ] 相談作成動作確認
   - [ ] 教員ダッシュボード動作確認

4. **ユーザーへの通知**
   - `/updates` ページに更新内容を記載
   - Slack/メールで通知

---

### 5.2 メジャーアップデート（大幅変更）

**手順:**

1. **告知（1週間前）**
   - 生徒・教員に事前通知
   - メンテナンス時間を設定

2. **バックアップ**
   ```bash
   firebase firestore:export gs://yamashu-hearing-backups/YYYY-MM-DD
   ```

3. **デプロイ**
   - 深夜帯（午前2〜3時）に実施
   - ダウンタイム最小化

4. **動作確認**
   - 全機能のテスト
   - エラーログ確認

5. **ロールバック準備**
   - 問題発生時は即座にロールバック

---

## 6. 緊急時対応

### 6.1 緊急連絡先

| 役割 | 担当者 | 連絡先 |
|------|--------|--------|
| システム管理者 | 教員A | teacher@seig-boys.jp |
| 開発責任者 | 開発者B | （内部連絡先） |
| Vercelサポート | - | https://vercel.com/support |
| Firebaseサポート | - | https://firebase.google.com/support |

---

### 6.2 緊急時フローチャート

```
障害発生
  ↓
レベル判定（1: 軽微 / 2: 重大 / 3: 致命的）
  ↓
【レベル1】
  → ログ確認 → 修正 → デプロイ

【レベル2】
  → 生徒に通知 → ロールバック → 原因調査 → 修正 → デプロイ

【レベル3】
  → 即座にロールバック → バックアップ復元 → 緊急会議 → 原因調査 → 対策実施
```

---

### 6.3 ロールバック手順

**Vercelデプロイメントロールバック:**

1. Vercel Dashboard → プロジェクト → Deployments
2. 前の正常なデプロイメントを選択
3. 「Promote to Production」をクリック
4. 数分で本番環境が前のバージョンに戻る

**Firestore Security Rulesロールバック:**

1. Firebase Console → Firestore → Rules
2. 以前のバージョンを選択
3. 「Publish」をクリック

---

## 7. データ管理

### 7.1 バックアップポリシー

| データ種別 | バックアップ頻度 | 保存期間 | 保存先 |
|-----------|----------------|---------|--------|
| Firestoreデータ | 毎週日曜日 | 3ヶ月 | Cloud Storage |
| 環境変数 | 変更時 | 無期限 | 暗号化ドキュメント |
| ソースコード | コミット時 | 無期限 | GitHub |

---

### 7.2 データエクスポート

**Firestore全データエクスポート:**

```bash
firebase firestore:export gs://yamashu-hearing-backups/$(date +%Y-%m-%d)
```

**特定コレクションのみエクスポート:**

```bash
firebase firestore:export gs://yamashu-hearing-backups/consultations-$(date +%Y-%m-%d) \
  --collection-ids consultations
```

**CSVエクスポート（教員ダッシュボードから）:**

1. 教員ダッシュボードにログイン
2. 「CSVエクスポート」ボタンをクリック
3. ファイルがダウンロードされる

---

### 7.3 データ削除ポリシー

**自動削除スケジュール:**

- **相談ログ**: 学期末後3ヶ月で自動削除
- **レポート**: 生成後3ヶ月で自動削除
- **ユーザーアカウント**: 卒業後1年で無効化

**手動削除手順:**

```bash
# 特定の相談を削除（Firebaseコンソールから）
1. Firebase Console → Firestore → consultations
2. 削除したいドキュメントを選択
3. 「Delete document」をクリック
```

---

## 8. 運用チェックリスト

### 8.1 日次チェックリスト

- [ ] Vercelエラー率 < 1%
- [ ] Firebase使用量が無料枠内
- [ ] OpenAI API使用量が予算内
- [ ] 未解決の相談確認

### 8.2 週次チェックリスト

- [ ] 週間レポート作成
- [ ] バックアップ実行確認
- [ ] よくある質問の更新

### 8.3 月次チェックリスト

- [ ] 依存パッケージの更新確認
- [ ] セキュリティアップデート
- [ ] 使用量レビュー
- [ ] 月次レポート作成

### 8.4 学期ごとチェックリスト

- [ ] 全データバックアップ
- [ ] アカウント棚卸し
- [ ] 統計レポート作成
- [ ] 来学期の授業計画反映

---

## 付録A: コマンドリファレンス

### Vercel

```bash
# ログ確認
vercel logs --follow

# デプロイ
vercel --prod

# 環境変数確認
vercel env ls
```

### Firebase

```bash
# Firestoreエクスポート
firebase firestore:export gs://yamashu-hearing-backups/$(date +%Y-%m-%d)

# Security Rulesデプロイ
firebase deploy --only firestore:rules

# ログ確認
firebase functions:log --only functionName
```

### npm

```bash
# 依存関係更新確認
npm outdated

# セキュリティ監査
npm audit
npm audit fix
```

---

## 付録B: ログファイル

### ログの場所

- **Vercel Logs**: https://vercel.com/dashboard → プロジェクト → Logs
- **Firebase Logs**: Firebase Console → Functions → Logs
- **ブラウザコンソール**: F12 → Console

### ログレベル

- **ERROR**: 即座に対応が必要
- **WARN**: 注意が必要（レート制限等）
- **INFO**: 情報（正常な動作）
- **DEBUG**: デバッグ用（開発時のみ）

---

**最終更新日**: 2025年10月21日
**バージョン**: 1.0
