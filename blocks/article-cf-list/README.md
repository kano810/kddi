# Article CF List（記事一覧）EDS ブロック

記事API（`/bin/articleindex.json`）を利用して、コンテンツフラグメント（CF）の記事一覧を表示する EDS ブロックです。

## 概要

- **データソース**: 既存の記事インデックス API（`ArticleIndexServlet`）
- **表示**: クライアント側で API を fetch し、取得した JSON で DOM を更新
- **レイアウト**: カード形式（`cards`）またはリスト形式（`list`）を選択可能

## 必要な条件

EDS から AEM の API を呼ぶ場合は、以下を満たしてください。

1. **CORS**: AEM 側で EDS のオリジン（例: `*.aem.live`）を許可
2. **Referrer フィルター**: `ReferrerFilter` で EDS ホストを許可
3. 記事 API は認証なしで公開してよいデータに限定

詳細は [EDSブロック置き換え調査 - 既存APIのEDSでの活用可否](../../docs/features/eds-block-migration-survey.md#5-既存apiのedsでの活用可否) を参照。

## 使い方

### EDS ドキュメントでの記述例

```html
<section class="block article-cf-list" data-ck-lang="ja" data-ck-limit="10">
  <div class="article-cf-list-title">お知らせ・記事</div>
</section>
```

### データ属性（data 属性）

| 属性 | 説明 | API パラメータ |
|------|------|----------------|
| `data-api-origin` | AEM のベース URL（別オリジンで API を呼ぶ場合） | - |
| `data-api-path` | 記事 API のパス（未指定時は `/bin/articleindex.json`） | - |
| `data-ck-article-site` | サイト | `ck_article-site` |
| `data-ck-lang` | 言語（例: ja, en） | `ck_lang` |
| `data-ck-offset` | オフセット | `ck_offset` |
| `data-ck-limit` | 表示件数（最大 1000） | `ck_limit` |
| `data-ck-industry` | 業種（カンマ区切り） | `ck_industry` |
| `data-ck-category` | カテゴリ（カンマ区切り） | `ck_category` |
| `data-ck-root-path` | ルートパス（事例API用） | `ck_rootPath` |
| `data-layout` | `cards` または `list` | - |

### 事例API（biz.kddi.com の casestudyindex.json）で使う場合

```html
<section class="block article-cf-list"
  data-api-origin="https://biz.kddi.com"
  data-api-path="/bin/kddi-com/casestudyindex.json"
  data-ck-lang="ja"
  data-ck-root-path="/content/kddi-com/usecase"
  data-ck-limit="10"
  data-layout="cards">
  <h2>導入事例一覧</h2>
</section>
```

### 同一オリジンで使う場合

```html
<section class="block article-cf-list" data-ck-lang="ja" data-ck-limit="6" data-layout="cards">
  <h2>記事一覧</h2>
</section>
```

### 別オリジンの AEM API を指定する場合

```html
<section
  class="block article-cf-list"
  data-api-origin="https://publish.example.com"
  data-ck-lang="ja"
  data-ck-limit="10"
  data-layout="list">
  <div class="article-cf-list-title">記事</div>
</section>
```

## API レスポンス形式

`/bin/articleindex.json` は次の形式のオブジェクトの配列を返します（`ArticleIndexDto` 相当）。

- `site`: サイト
- `date`: 公開日（yyyy-MM-dd）
- `category`: カテゴリ配列（`{ id, label }`）
- `tags`: タグラベル配列
- `title`: タイトル
- `description`: 概要（255 文字まで）
- `thumbsURL`: サムネイル URL
- `thumbsURLOrg`: サムネイル元 URL
- `url`: 記事ページ URL
- `industry`: 業種配列（`{ id, label }`）

## ファイル構成

```
blocks/article-cf-list/
├── article-cf-list.js   # ブロックロジック（decorate）
├── article-cf-list.css # スタイル
├── article-cf-list.json # ブロックメタデータ（オーサリング用）
└── README.md
```
