# 教材棚卸し結果 (#DOC-001)

## 実施日: 2025-10-21

---

## 1. 既存リソースの分類

### 1.1 外部リンク・参考資料

#### カテゴリ: Unity基礎
| No | 資料名 | URL | 内容 | 更新頻度 | アクセス権 |
|----|--------|-----|------|----------|------------|
| 1 | Schoomy開発者の知見 on note | https://note.com/schoomy/n/n18d261804e89 | Unityのインストール・プロジェクト作成（画像付き解説） | 低 | 公開 |
| 2 | Unity公式ブログ 初心者向け記事一覧 | https://learning.unity3d.jp/tag/beginners/ | Unity公式の初心者向け記事まとめ | 中 | 公開 |
| 3 | Unity公式ラーニング 初心者向けチュートリアル | https://learn.unity.com/course/unity-tutorials-for-beginners-jp | Unity公式の初心者向けチュートリアルコース | 中 | 公開 |

#### カテゴリ: 素材・アセット
| No | 資料名 | URL | 内容 | 更新頻度 | アクセス権 |
|----|--------|-----|------|----------|------------|
| 4 | LOTTEキャラクター素材 | https://drive.google.com/drive/folders/1QBlIiFDMRzqVpPwk6aTZ7pUFpJEw-VWD?hl=ja | LOTTE提供の公式キャラクター素材 | 中 | 学校アカウント限定 |
| 5 | スクーミー情報誌 | https://schoomy-files.s3.ap-northeast-1.amazonaws.com/特別号7月刊行_すいかばマン情報Ⅱ.pdf | スクーミーが発行している情報誌（開発ヒント・作品紹介） | 低 | 公開 |

#### カテゴリ: 数学B×Unity
| No | 資料名 | URL | 内容 | 更新頻度 | アクセス権 |
|----|--------|-----|------|----------|------------|
| 6 | Unityで学ぶ数学 - グラフと曲線 | https://learning.unity3d.jp/3238/ | AnimationCurveなどグラフと曲線の解説 | 低 | 公開 |
| 7 | Unityで学ぶ数学 - 確率と乱数 | https://learning.unity3d.jp/3219/ | 確率と乱数の解説 | 低 | 公開 |
| 8 | Unity Physicsで使えるベクトル (YouTube) | https://youtu.be/aUrS2Wqo7-8?si=S_8KavdalBgzx1_o | ベクトルの物理演算への応用 | 低 | 公開 |
| 9 | Unityで学ぶ数学 - ベクトル | https://learning.unity3d.jp/3120/ | ベクトルの基礎と応用 | 低 | 公開 |

---

### 1.2 サンプルコード（コードスニペット）

| No | コード名 | 機能 | 関連する学習テーマ | 難易度 | 必要コンポーネント |
|----|---------|------|-------------------|--------|-------------------|
| 1 | PlayerController | キーボード入力でプレイヤーを動かす | Unity基礎、物理演算 | 初級 | Rigidbody |
| 2 | EnemyChaser | ターゲットを追いかける敵AI | ベクトル、Transform操作 | 初級 | - |
| 3 | ItemDropper | 確率でアイテムをドロップする | 確率、乱数 | 初級 | - |

---

### 1.3 解説コンテンツ（Unity開発のヒント）

| No | タイトル | 内容 | 対象レベル | 関連セクション |
|----|---------|------|-----------|--------------|
| 1 | Unityの基本構成 | ゲームオブジェクト、コンポーネントの概念 | 初級 | Unity基礎 |
| 2 | 物理演算の基礎 | Rigidbody、Colliderの役割と使い方 | 初級 | Unity基礎 |
| 3 | スクリプトの初歩 | Start()、Update()イベント関数の説明 | 初級 | Unity基礎 |
| 4 | プレハブ (Prefab) | プレハブの概念と作成方法 | 初級 | Unity基礎 |

---

### 1.4 学習テーマ（数学B × ゲーム開発）

| No | テーマ | 数学概念 | ゲーム要素 | 発展内容 | 外部リンク参照 |
|----|--------|---------|-----------|---------|--------------|
| 1 | 数列 × レベルアップ | 等比数列、漸化式 | 経験値システム | AnimationCurveでの調整 | リソース#6 |
| 2 | 確率 × ガチャ | 確率、乱数 | アイテムドロップ、ガチャ | 重み付き抽選（Loot Table） | リソース#7 |
| 3 | ベクトル × 敵の追尾 | 差ベクトル、正規化、内積 | 敵AI、追尾システム | 索敵範囲の実装 | リソース#8, #9 |

---

### 1.5 その他コンテンツ

| No | タイトル | 内容 | 更新頻度 |
|----|---------|------|----------|
| 1 | プロジェクト概要 | 目的と特徴、実施概要、チーム構成 | 低 |
| 2 | 授業スケジュール | 第1回～第7回の日程・内容・活動 | 低 |
| 3 | 協力機関 | 聖学院高校、スクーミー、開志専門職大学、LOTTE | 低 |

---

## 2. タグ体系の設計

### 2.1 主要タグ（Primary Tags）
各リソースに必ず1つ以上付与する大分類タグ

- **`unity-basics`** - Unity基礎（インストール、プロジェクト作成、基本操作）
- **`programming`** - プログラミング（C#、スクリプト、デバッグ）
- **`math-game`** - 数学B × ゲーム開発（数列、確率、ベクトル）
- **`assets`** - 素材・アセット（キャラクター、UI、サウンド）
- **`design`** - デザイン（UI/UX、グラフィック）
- **`game-design`** - ゲームデザイン（企画、バランス調整、レベルデザイン）
- **`ip-law`** - 知的財産・著作権

### 2.2 サブタグ（Secondary Tags）
詳細な分類のための補助タグ

#### Unity関連
- `installation` - インストール・環境構築
- `physics` - 物理演算
- `ui-system` - UIシステム
- `prefab` - プレハブ
- `animation` - アニメーション

#### プログラミング関連
- `csharp-basics` - C#基礎
- `script-example` - スクリプト例
- `debugging` - デバッグ

#### 数学関連
- `sequence` - 数列
- `probability` - 確率
- `vector` - ベクトル
- `curve` - 曲線・グラフ

#### ゲーム要素
- `player-control` - プレイヤー操作
- `enemy-ai` - 敵AI
- `item-system` - アイテムシステム
- `level-system` - レベルシステム
- `gacha` - ガチャシステム

### 2.3 メタタグ（Meta Tags）
リソースの性質を示すタグ

- `tutorial` - チュートリアル
- `reference` - リファレンス
- `code-snippet` - コードスニペット
- `external-link` - 外部リンク
- `official` - 公式資料
- `partner` - パートナー提供資料

### 2.4 対象レベルタグ
- `beginner` - 初級
- `intermediate` - 中級
- `advanced` - 上級

---

## 3. リソースへのタグ付け例

### 外部リンク・参考資料
| リソース名 | Primary Tags | Secondary Tags | Meta Tags | Level |
|----------|--------------|----------------|-----------|-------|
| Schoomy開発者の知見 on note | `unity-basics` | `installation` | `tutorial`, `external-link` | `beginner` |
| Unity公式ブログ | `unity-basics`, `programming` | - | `reference`, `official`, `external-link` | `beginner` |
| LOTTEキャラクター素材 | `assets` | - | `partner` | - |
| Unityで学ぶ数学 - ベクトル | `math-game`, `programming` | `vector`, `enemy-ai` | `tutorial`, `official`, `external-link` | `beginner` |

### コードスニペット
| コード名 | Primary Tags | Secondary Tags | Meta Tags | Level |
|---------|--------------|----------------|-----------|-------|
| PlayerController | `programming` | `player-control`, `physics` | `code-snippet`, `script-example` | `beginner` |
| EnemyChaser | `programming`, `math-game` | `enemy-ai`, `vector` | `code-snippet`, `script-example` | `beginner` |
| ItemDropper | `programming`, `math-game` | `item-system`, `probability` | `code-snippet`, `script-example` | `beginner` |

### 学習テーマ
| テーマ | Primary Tags | Secondary Tags | Meta Tags | Level |
|-------|--------------|----------------|-----------|-------|
| 数列 × レベルアップ | `math-game` | `sequence`, `level-system`, `curve` | `tutorial` | `beginner` |
| 確率 × ガチャ | `math-game` | `probability`, `item-system`, `gacha` | `tutorial` | `beginner` |
| ベクトル × 敵の追尾 | `math-game`, `programming` | `vector`, `enemy-ai` | `tutorial` | `beginner` |

---

## 4. 公開優先度の決定

優先度判定基準:
- **A (最優先)**: 授業開始時から必須、初心者が最初にアクセスすべき
- **B (優先)**: 授業中盤で活用、特定テーマの理解に必要
- **C (通常)**: 発展内容、興味のある生徒向け

### 優先度A（最優先）
| リソース | 理由 |
|---------|------|
| Schoomy開発者の知見 on note | 環境構築の第一歩、画像付きで分かりやすい |
| Unity公式ラーニング 初心者向けチュートリアル | 公式の体系的なチュートリアル |
| Unityの基本構成（解説） | Unity理解の基礎概念 |
| 物理演算の基礎（解説） | ゲーム開発で必須の知識 |
| スクリプトの初歩（解説） | プログラミングの出発点 |
| PlayerController（コード） | 最初に実装する基本機能 |
| 授業スケジュール | 全体の見通しを立てるために必須 |

### 優先度B（優先）
| リソース | 理由 |
|---------|------|
| LOTTEキャラクター素材 | 授業中盤で使用、素材提供元との連携 |
| EnemyChaser（コード） | 追尾AIの基本実装 |
| ItemDropper（コード） | ガチャ・ドロップシステムの基本 |
| 数列 × レベルアップ | 数学Bとの連携テーマ |
| 確率 × ガチャ | 数学Bとの連携テーマ |
| ベクトル × 敵の追尾 | 数学Bとの連携テーマ |
| プレハブ（解説） | 効率的な開発に必要 |
| Unity公式ブログ | より深い理解のための参考資料 |

### 優先度C（通常）
| リソース | 理由 |
|---------|------|
| スクーミー情報誌 | インスピレーション源、必須ではない |
| Unityで学ぶ数学 - グラフと曲線 | AnimationCurveの発展内容 |
| Unityで学ぶ数学 - 確率と乱数 | 確率の発展内容 |
| Unityで学ぶ数学 - ベクトル | ベクトルの発展内容 |
| Unity Physicsで使えるベクトル (YouTube) | 動画コンテンツ、補助教材 |

---

## 5. 今後の改善提案

### 5.1 追加すべきコンテンツ
1. **デバッグ・トラブルシューティングセクション**
   - よくあるエラーと解決方法（NullReferenceException、MissingReferenceExceptionなど）
   - Gemの `unity-debug-mentor` と連携

2. **GitHub Classroom課題リスト**
   - 各授業回ごとの課題と提出方法
   - サンプルリポジトリへのリンク

3. **知的財産・著作権ガイド**
   - LOTTEキャラクターの利用規約
   - クレジット表記の方法
   - 二次創作の範囲

4. **Gemスイート案内ページ**
   - 各Gemの役割と使い方
   - アクセス方法とカスタム指示の説明

5. **更新情報セクション（/updates）**
   - サイト更新履歴
   - Gemリリースノート
   - 教材追加情報

### 5.2 タグ体系の拡張
- `troubleshooting` - トラブルシューティング
- `classroom` - GitHub Classroom課題
- `credits` - クレジット・ライセンス情報
- `gem-tool` - Gemツール関連

### 5.3 JSONメタデータの整備
各教材に以下のメタデータを付与し、JSON形式で配信：
```json
{
  "id": "resource-001",
  "title": "Schoomy開発者の知見 on note",
  "url": "https://note.com/schoomy/n/n18d261804e89",
  "type": "external-link",
  "category": "unity-basics",
  "tags": ["unity-basics", "installation", "tutorial", "beginner"],
  "priority": "A",
  "lastUpdated": "2024-09-01",
  "access": "public"
}
```

---

## 6. 次のアクションアイテム

- [ ] タグ体系をもとに、教材メタデータのJSONスキーマを定義する（#SITE-002）
- [ ] 不足コンテンツ（デバッグガイド、知財ガイドなど）のドラフトを作成
- [ ] 各Gemのカスタム指示にタグ体系を反映する（#GEM-001）
- [ ] index.htmlに検索・フィルタ機能を実装し、タグで絞り込めるようにする（#SITE-001）
- [ ] 更新情報セクション（/updates）の構成案を策定する（#SITE-003）

---

## 付録: 完全なタグ一覧

### Primary Tags
- `unity-basics`, `programming`, `math-game`, `assets`, `design`, `game-design`, `ip-law`

### Secondary Tags
- `installation`, `physics`, `ui-system`, `prefab`, `animation`
- `csharp-basics`, `script-example`, `debugging`
- `sequence`, `probability`, `vector`, `curve`
- `player-control`, `enemy-ai`, `item-system`, `level-system`, `gacha`

### Meta Tags
- `tutorial`, `reference`, `code-snippet`, `external-link`, `official`, `partner`

### Level Tags
- `beginner`, `intermediate`, `advanced`
