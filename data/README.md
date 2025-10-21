# 教材リソースJSONデータ

## 概要
このディレクトリには、授業ハブサイトで使用する教材・リンク・Gemツールのメタデータが格納されています。

## ファイル構成

### resources-schema.json
教材リソースのJSONスキーマ定義ファイル。すべてのリソースデータはこのスキーマに準拠します。

**主要なプロパティ:**
- `id`: 一意のリソースID（例: resource-001, gem-001, code-001, theme-001）
- `title`: リソースのタイトル
- `description`: 説明文
- `type`: リソースタイプ（external-link, code-snippet, gem-tool, theme等）
- `category`: 主要カテゴリ（unity-basics, programming, math-game等）
- `tags`: タグ配列（primary, secondary, meta, level含む）
- `priority`: 公開優先度（A: 最優先, B: 優先, C: 通常）
- `level`: 対象レベル（beginner, intermediate, advanced）

### resources.json
実際の教材リソースデータ。以下のリソースが含まれます：

**Gemツール（6件）:**
1. `gem-001`: unity-debug-mentor
2. `gem-002`: vector-math-coach
3. `gem-003`: asset-handbook
4. `gem-004`: lesson-scheduler
5. `gem-005`: unity-install-help
6. `gem-006`: hearing-reporter

**外部リンク・参考資料（9件）:**
- Unity基礎: resource-001, resource-002, resource-003
- 素材: resource-004, resource-005
- 数学B×Unity: resource-006, resource-007, resource-008, resource-009

**コードスニペット（3件）:**
- code-001: PlayerController
- code-002: EnemyChaser
- code-003: ItemDropper

**学習テーマ（3件）:**
- theme-001: 数列 × レベルアップ
- theme-002: 確率 × ガチャ
- theme-003: ベクトル × 敵の追尾

**ドキュメント（2件）:**
- doc-001: プロジェクト概要
- doc-002: 授業スケジュール

## 使用方法

### 1. データの読み込み（JavaScript）
```javascript
fetch('/data/resources.json')
  .then(response => response.json())
  .then(data => {
    console.log('リソース数:', data.resources.length);
    console.log('バージョン:', data.version);
  });
```

### 2. タグでフィルタリング
```javascript
// 優先度Aのリソースのみ
const priorityA = data.resources.filter(r => r.priority === 'A');

// Gemツールのみ
const gems = data.resources.filter(r => r.type === 'gem-tool');

// 初心者向けリソース
const beginnerResources = data.resources.filter(r => r.level === 'beginner');

// 特定タグを含むリソース
const unityBasics = data.resources.filter(r =>
  r.tags.includes('unity-basics')
);
```

### 3. カテゴリ別グループ化
```javascript
const byCategory = data.resources.reduce((acc, resource) => {
  if (!acc[resource.category]) {
    acc[resource.category] = [];
  }
  acc[resource.category].push(resource);
  return acc;
}, {});

console.log('Unity基礎:', byCategory['unity-basics']);
console.log('Gemツール:', byCategory['gem-tools']);
```

### 4. 関連リソースの取得
```javascript
function getRelatedResources(resourceId, allResources) {
  const resource = allResources.find(r => r.id === resourceId);
  if (!resource || !resource.relatedResources) return [];

  return resource.relatedResources.map(relatedId =>
    allResources.find(r => r.id === relatedId)
  );
}

// 使用例
const relatedToGem001 = getRelatedResources('gem-001', data.resources);
```

## タグ体系

### Primary Tags
- `unity-basics`: Unity基礎
- `programming`: プログラミング
- `math-game`: 数学B × ゲーム開発
- `assets`: 素材・アセット
- `design`: デザイン
- `game-design`: ゲームデザイン
- `ip-law`: 知的財産・著作権
- `gem-tools`: Gemツール

### Secondary Tags（抜粋）
- `installation`, `physics`, `ui-system`, `prefab`, `animation`
- `csharp-basics`, `script-example`, `debugging`
- `sequence`, `probability`, `vector`, `curve`
- `player-control`, `enemy-ai`, `item-system`, `level-system`, `gacha`

### Meta Tags
- `tutorial`: チュートリアル
- `reference`: リファレンス
- `code-snippet`: コードスニペット
- `external-link`: 外部リンク
- `official`: 公式資料
- `partner`: パートナー提供資料

### Level Tags
- `beginner`: 初級
- `intermediate`: 中級
- `advanced`: 上級

## 優先度

- **A (最優先)**: 授業開始時から必須、初心者が最初にアクセスすべき
- **B (優先)**: 授業中盤で活用、特定テーマの理解に必要
- **C (通常)**: 発展内容、興味のある生徒向け

## 更新方法

1. `resources.json`に新しいリソースを追加
2. スキーマに準拠していることを確認
3. `version`と`lastUpdated`を更新
4. 関連リソース（`relatedResources`）のリンクを設定

## バリデーション

JSONスキーマに準拠しているか確認するには、以下のツールを使用できます：

```bash
# npmでajvをインストール
npm install -g ajv-cli

# バリデーション実行
ajv validate -s resources-schema.json -d resources.json
```

## GitHub Pages配信

このJSONファイルは以下のURLでアクセス可能です：
```
https://yamashu00.github.io/data/resources.json
https://yamashu00.github.io/data/resources-schema.json
```

サイト側でfetchして使用してください。
