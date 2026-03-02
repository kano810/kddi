/**
 * Article CF List - EDS Block
 *
 * 記事API (/bin/articleindex.json) を利用してコンテンツフラグメント（記事）一覧を表示するブロック。
 * EDS またはスタンドアロンで使用可能。クライアント側で API を fetch し DOM を更新する。
 *
 * 使用例（HTML）:
 * <section class="block article-cf-list" data-api-origin="https://your-aem-host" data-ck-lang="ja" data-ck-limit="10">
 *   <div class="article-cf-list-title">記事一覧</div>
 *   <a href="/blocks/article-cf-list/article-cf-list.js">Load</a>
 * </section>
 *
 * data 属性:
 *   - data-api-origin: AEM のオリジン（記事APIのベースURL）。未指定時は同一オリジン
 *   - data-api-path: 記事APIのパス（未指定時は /bin/articleindex.json）
 *   - data-ck-article-site: サイト（ck_article-site）
 *   - data-ck-lang: 言語（ck_lang, 例: ja, en）
 *   - data-ck-offset: オフセット（ck_offset）
 *   - data-ck-limit: 件数（ck_limit, 最大1000）
 *   - data-ck-industry: 業種フィルタ（ck_industry, カンマ区切り）
 *   - data-ck-category: カテゴリフィルタ（ck_category, カンマ区切り）
 *   - data-ck-root-path: ルートパス（ck_rootPath, 事例API用。例: /content/kddi-com/usecase）
 *   - data-layout: 表示レイアウト "cards" | "list"（省略時: cards）
 *
 * 事例API（casestudyindex.json）利用例:
 *   data-api-origin="https://biz.kddi.com" data-api-path="/bin/kddi-com/casestudyindex.json"
 *   data-ck-lang="ja" data-ck-root-path="/content/kddi-com/usecase" data-ck-limit="10"
 */

/** 記事APIのデフォルトパス。data-api-path で上書き可能 */
const ARTICLE_INDEX_PATH = '/bin/articleindex.json';

/**
 * ブロックの data 属性から API クエリパラメータを組み立てる
 * @param {Element} block
 * @returns {URLSearchParams}
 */
function getApiParams(block) {
  const params = new URLSearchParams();
  const origin = block.dataset.apiOrigin || '';
  const site = block.dataset.ckArticleSite;
  const lang = block.dataset.ckLang;
  const offset = block.dataset.ckOffset;
  const limit = block.dataset.ckLimit;
  const industry = block.dataset.ckIndustry;
  const category = block.dataset.ckCategory;
  const rootPath = block.dataset.ckRootPath;

  if (site) params.set('ck_article-site', site);
  if (lang) params.set('ck_lang', lang);
  if (offset !== undefined && offset !== '') params.set('ck_offset', offset);
  if (limit !== undefined && limit !== '') params.set('ck_limit', limit);
  if (industry) params.set('ck_industry', industry);
  if (category) params.set('ck_category', category);
  if (rootPath) params.set('ck_rootPath', rootPath);

  return { params, origin };
}

/**
 * 記事APIのURLを返す
 * @param {Element} block
 * @returns {string}
 */
function getArticleIndexUrl(block) {
  const { params, origin } = getApiParams(block);
  let path = (block.dataset.apiPath || ARTICLE_INDEX_PATH).trim();
  if (!path.startsWith('/')) path = `/${path}`;
  const base = origin ? origin.replace(/\/$/, '') : '';
  const query = params.toString();
  return `${base}${path}${query ? `?${query}` : ''}`;
}

/**
 * API から一覧を取得（記事API または 事例API）
 * @param {string} url
 * @returns {Promise<unknown>}
 */
async function fetchArticleList(url) {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/**
 * 事例API（casestudyindex.json）の 1 件をカード/リスト用の共通形に正規化
 * @param {Object} row - list[i]
 * @returns {{ url: string, title: string, description: string, date: string, thumbsURL: string, tags: string[] }}
 */
function normalizeCaseStudyItem(row) {
  const dto = row.caseStudyInfoDto || {};
  const pubDate = row.publicationDate; // 数値 YYYYMMDD
  const dateStr =
    typeof pubDate === 'number'
      ? `${String(pubDate).slice(0, 4)}-${String(pubDate).slice(4, 6)}-${String(pubDate).slice(6, 8)}`
      : dto.publicationDate || '';
  const tags = [];
  if (row.industry?.label) tags.push(row.industry.label);
  (row.service || []).slice(0, 2).forEach((s) => { if (s?.label) tags.push(s.label); });
  return {
    url: dto.detailPage || '#',
    title: dto.caseStudyName || '',
    description: stripHtml(dto.overview || ''),
    date: dateStr,
    thumbsURL: dto.indexImage || '',
    tags,
  };
}

function stripHtml(html) {
  if (html == null) return '';
  const div = typeof document !== 'undefined' && document.createElement('div');
  if (div) {
    div.innerHTML = String(html);
    return (div.textContent || div.innerText || '').trim();
  }
  return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * API レスポンスをカード/リスト用の配列に正規化（記事API 配列 or 事例API の list）
 * @param {unknown} data
 * @returns {Array<{ url: string, title: string, description?: string, date?: string, thumbsURL?: string, tags?: string[] }>}
 */
function normalizeApiResponse(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray(data.list)) {
    return data.list.map((row) => normalizeCaseStudyItem(row));
  }
  return [];
}

/**
 * 1件の記事をカード用 HTML に変換
 * @param {Object} item - ArticleIndexDto 相当
 * @returns {string}
 */
function renderCard(item) {
  const url = item.url || '#';
  const title = item.title || '';
  const description = item.description || '';
  const date = item.date || '';
  const thumb = item.thumbsURL || '';
  const tags = (item.tags || []).slice(0, 3);

  const tagsHtml = tags.length
    ? `<ul class="article-cf-list__card-tags">${tags.map((t) => `<li class="article-cf-list__card-tag">${escapeHtml(t)}</li>`).join('')}</ul>`
    : '';

  return `
    <li class="article-cf-list__card">
      <a class="article-cf-list__card-link" href="${escapeAttr(url)}">
        ${thumb ? `<figure class="article-cf-list__card-figure"><img class="article-cf-list__card-image" src="${escapeAttr(thumb)}" alt="" width="400" height="223" loading="lazy"></figure>` : ''}
        <div class="article-cf-list__card-body">
          ${date ? `<time class="article-cf-list__card-date" datetime="${escapeAttr(date)}">${escapeHtml(formatDate(date))}</time>` : ''}
          <h3 class="article-cf-list__card-title">${escapeHtml(title)}</h3>
          ${description ? `<p class="article-cf-list__card-description">${escapeHtml(truncate(description, 100))}</p>` : ''}
          ${tagsHtml}
        </div>
      </a>
    </li>`;
}

/**
 * 1件の記事をリスト行用 HTML に変換
 * @param {Object} item
 * @returns {string}
 */
function renderListItem(item) {
  const url = item.url || '#';
  const title = item.title || '';
  const date = item.date || '';

  return `
    <li class="article-cf-list__list-item">
      <a class="article-cf-list__list-link" href="${escapeAttr(url)}">
        ${date ? `<time class="article-cf-list__list-date" datetime="${escapeAttr(date)}">${escapeHtml(formatDate(date))}</time>` : ''}
        <span class="article-cf-list__list-title">${escapeHtml(title)}</span>
      </a>
    </li>`;
}

function escapeAttr(str) {
  if (str == null) return '';
  const s = String(str);
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtml(str) {
  if (str == null) return '';
  const s = String(str);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function truncate(str, maxLen) {
  if (str == null) return '';
  const s = String(str);
  return s.length <= maxLen ? s : `${s.slice(0, maxLen)}…`;
}

function formatDate(isoDate) {
  if (!isoDate) return '';
  try {
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return isoDate;
  }
}

/**
 * ブロック内の既存の見出し要素を取得（オプション）
 * @param {Element} block
 * @returns {Element|null}
 */
function getTitleElement(block) {
  const titleClass = 'article-cf-list-title';
  let el = block.querySelector(`.${titleClass}`);
  if (!el) {
    const first = block.querySelector('h2, h3, .title');
    if (first) el = first;
  }
  return el;
}

/**
 * ローディング表示を出す
 * @param {Element} container
 */
function showLoading(container) {
  container.innerHTML = '<div class="article-cf-list__loading" aria-busy="true">読み込み中…</div>';
}

/**
 * エラー表示
 * @param {Element} container
 * @param {string} message
 */
function showError(container, message) {
  container.innerHTML = `<div class="article-cf-list__error" role="alert">${escapeHtml(message)}</div>`;
}

/**
 * 空のときの表示
 * @param {Element} container
 */
function showEmpty(container) {
  container.innerHTML = '<div class="article-cf-list__empty">記事がありません。</div>';
}

/**
 * EDS 標準の decorate エントリポイント
 * @param {Element} block - ブロックの section 要素
 */
export default async function decorate(block) {
  const layout = (block.dataset.layout || 'cards').toLowerCase();
  const isList = layout === 'list';

  const titleEl = getTitleElement(block);
  const container = document.createElement('div');
  container.className = 'article-cf-list__container';
  block.appendChild(container);

  if (titleEl) {
    titleEl.classList.add('article-cf-list__heading');
    block.insertBefore(titleEl, container);
  }

  const url = getArticleIndexUrl(block);
  showLoading(container);

  try {
    const raw = await fetchArticleList(url);
    const items = normalizeApiResponse(raw);

    if (!items || items.length === 0) {
      showEmpty(container);
      return;
    }

    const tag = 'ul';
    const className = isList ? 'article-cf-list__list' : 'article-cf-list__cards';
    const rowHtml = items.map((item) => (isList ? renderListItem(item) : renderCard(item))).join('');

    container.innerHTML = `<${tag} class="${className}">${rowHtml}</${tag}>`;
  } catch (err) {
    showError(container, err.message || '記事の取得に失敗しました。');
  }
}
