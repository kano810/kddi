/**
 * Usecase Detail - 導入事例詳細ページブロック
 *
 * 事例詳細ページ（biz.kddi.com/usecase/case_314/ 等）のレイアウトとスタイルを提供。
 * ブロック内の行を順に以下のセクションとして扱う:
 *   Row 0: ヒーロー（会社名）
 *   Row 1: 概要・導入サービス
 *   Row 2: 会社情報 + PDFダウンロードCTA
 *   Row 3: お客さまインタビュー
 *   Row 4: 担当からのメッセージ
 *   Row 5: 関連サービス
 *   Row 6: お問い合わせ・事例DL CTA
 *   Row 7（任意）: 同じサービスの導入事例
 */

const SECTION_CLASSES = [
  'usecase-detail__hero',
  'usecase-detail__overview',
  'usecase-detail__company-cta',
  'usecase-detail__interview',
  'usecase-detail__message',
  'usecase-detail__related',
  'usecase-detail__cta',
  'usecase-detail__same-cases',
];

/**
 * 行をセクションラッパーで包み、クラスを付与する
 * @param {Element} row
 * @param {string} sectionClass
 */
function wrapSection(row, sectionClass) {
  const section = document.createElement('div');
  section.className = sectionClass;
  section.append(...row.children);
  row.replaceWith(section);
}

/**
 * 概要セクション内の「導入サービス」リストを装飾する
 * @param {Element} section
 */
function decorateOverviewSection(section) {
  const list = section.querySelector('ul, ol');
  if (list) list.classList.add('usecase-detail__services');
}

/**
 * 会社情報 + CTA セクションを key-value とボタンに分離
 * @param {Element} section
 */
function decorateCompanyCtaSection(section) {
  const dl = section.querySelector('dl');
  if (dl) {
    dl.className = 'usecase-detail__company-info';
  }
  const buttons = section.querySelectorAll('a[href*="form"], a.button');
  if (buttons.length) {
    const ctaWrap = document.createElement('div');
    ctaWrap.className = 'usecase-detail__download-cta';
    buttons.forEach((a) => {
      a.classList.add('button', 'button--primary');
      ctaWrap.append(a);
    });
    section.append(ctaWrap);
  }
}

/**
 * インタビュー内の見出しと課題・解決策ブロックを装飾
 * @param {Element} section
 */
function decorateInterviewSection(section) {
  section.querySelectorAll('h2, h3').forEach((h) => {
    h.classList.add('usecase-detail__interview-heading');
  });
  section.querySelectorAll('h4').forEach((h) => {
    h.classList.add('usecase-detail__interview-subheading');
  });
}

/**
 * 関連サービスセクションにグリッド用クラスを付与（スタイルはCSSで適用）
 * @param {Element} section
 */
function decorateRelatedSection(section) {
  section.classList.add('usecase-detail__related--grid');
  section.querySelectorAll('a[href*="service"], a[href*="biz.kddi.com"]').forEach((a) => {
    a.classList.add('usecase-detail__related-link');
  });
}

export default function decorate(block) {
  const rows = [...block.children].filter((el) => el.tagName === 'DIV');
  rows.forEach((row, index) => {
    const sectionClass = SECTION_CLASSES[index] || 'usecase-detail__section';
    wrapSection(row, sectionClass);
  });

  const hero = block.querySelector('.usecase-detail__hero');
  if (hero) {
    const h1 = hero.querySelector('h1') || hero.querySelector('h2');
    if (h1) h1.classList.add('usecase-detail__title');
  }

  const overview = block.querySelector('.usecase-detail__overview');
  if (overview) {
    const firstH = overview.querySelector('h4, h3');
    if (firstH) firstH.classList.add('usecase-detail__overview-heading');
    decorateOverviewSection(overview);
  }

  const companyCta = block.querySelector('.usecase-detail__company-cta');
  if (companyCta) decorateCompanyCtaSection(companyCta);

  const interview = block.querySelector('.usecase-detail__interview');
  if (interview) decorateInterviewSection(interview);

  const message = block.querySelector('.usecase-detail__message');
  if (message) {
    const inner = document.createElement('div');
    inner.className = 'usecase-detail__message-inner';
    inner.append(...message.childNodes);
    message.append(inner);
    inner.querySelectorAll('p').forEach((p, i) => {
      if (i === 0 && p.textContent.trim().length < 50) p.classList.add('usecase-detail__message-name');
      else p.classList.add('usecase-detail__message-body');
    });
  }

  const related = block.querySelector('.usecase-detail__related');
  if (related) decorateRelatedSection(related);

  const cta = block.querySelector('.usecase-detail__cta');
  if (cta) {
    cta.querySelectorAll('a[href*="form"], a[href*="estimation"], a[href*="dl-usecase"]').forEach((a) => {
      a.classList.add('button', 'button--primary');
    });
  }
}
