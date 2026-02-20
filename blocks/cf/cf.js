/*
 * CF (Content Fragment) Block
 * Fetches Content Fragment JSON and displays the data.
 */

import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Ensures Universal Editor can select the block by moving instrumentation to the block element.
 * @param {Element} block The block element
 */
function preserveBlockInstrumentation(block) {
  const source = block.querySelector('[data-aue-resource]');
  if (source && source !== block) {
    moveInstrumentation(source, block);
  }
}

/**
 * Renders a value (string, number, boolean, or object) as text or HTML.
 * @param {*} value Value to render
 * @returns {string} Safe text or HTML string
 */
function renderValue(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(renderValue).join(', ');
  if (typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([k, v]) => `${k}: ${renderValue(v)}`)
      .join('; ');
    return entries || '';
  }
  return String(value);
}

/**
 * Builds the CF JSON URL from productID, path, or full URL.
 * @param {string} productIdOrPath productID, path (e.g. /content/fragments/xxx), or full URL
 * @returns {string} URL to fetch
 */
function getCfJsonUrl(productIdOrPath) {
  const raw = (productIdOrPath || '').trim();
  if (!raw) return null;
  // Strip query string and hash for path building
  let path = raw.split('?')[0].split('#')[0].replace(/\/+$/, '');
  // Remove .model.json if already present
  if (path.endsWith('.model.json')) return path;
  if (path.toLowerCase().endsWith('.html')) path = path.slice(0, -5);
  else if (path.toLowerCase().endsWith('.plain.html')) path = path.slice(0, -11);
  return `${path}.model.json`;
}

/**
 * Fetches JSON and returns the fragment data (handles AEM-style wrapper if present).
 * @param {string} url URL to fetch
 * @returns {Promise<{ data: object|null, error?: string }>} Fragment data and optional error message
 */
async function fetchCfData(url) {
  const resolvedUrl = url.startsWith('http') ? url : new URL(url, window.location.origin).href;
  try {
    const resp = await fetch(resolvedUrl);
    if (!resp.ok) {
      const err = `HTTP ${resp.status} (${resolvedUrl})`;
      // eslint-disable-next-line no-console
      console.warn('CF block:', err);
      return { data: null, error: err };
    }
    const data = await resp.json();
    if (data && typeof data === 'object') {
      const payload = data.model ?? data.elements ?? data;
      const obj = typeof payload === 'object' && payload !== null ? payload : data;
      if (Object.keys(obj).length > 0) return { data: obj };
    }
    return { data: null, error: 'レスポンスが空です' };
  } catch (e) {
    const err = e?.message || String(e);
    // eslint-disable-next-line no-console
    console.warn('CF block fetch failed:', resolvedUrl, err);
    return { data: null, error: `取得エラー: ${err}` };
  }
}

/**
 * Renders CF data as a definition list.
 * @param {Element} container Parent element
 * @param {object} data Key-value data
 */
function renderCfData(container, data) {
  const dl = document.createElement('dl');
  dl.className = 'cf-data';

  Object.entries(data).forEach(([key, value]) => {
    const text = renderValue(value);
    if (text === '') return;

    const dt = document.createElement('dt');
    dt.className = 'cf-data-key';
    dt.textContent = key;

    const dd = document.createElement('dd');
    dd.className = 'cf-data-value';
    if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('/'))) {
      const a = document.createElement('a');
      a.href = value;
      a.textContent = value;
      dd.appendChild(a);
    } else {
      dd.textContent = text;
    }

    dl.appendChild(dt);
    dl.appendChild(dd);
  });

  container.appendChild(dl);
}

/**
 * Decorates the CF block: reads productID (or path/URL) from first cell, fetches JSON, displays data.
 * @param {Element} block The cf block element
 */
export default async function decorate(block) {
  preserveBlockInstrumentation(block);

  const firstCell = block.querySelector('div');
  const link = block.querySelector('a');
  const productID = link ? link.getAttribute('href') : (firstCell?.textContent?.trim() || '');
  const url = getCfJsonUrl(productID);

  block.textContent = '';

  if (!url) {
    block.classList.add('cf-empty');
    const msg = document.createElement('p');
    msg.textContent = 'productID（またはCFパス・URL）を入力してください';
    block.appendChild(msg);
    return;
  }

  const result = await fetchCfData(url);
  const data = result.data;

  if (!data || Object.keys(data).length === 0) {
    block.classList.add('cf-error');
    const msg = document.createElement('p');
    msg.textContent = 'CFデータを取得できませんでした。productIDを確認してください。';
    block.appendChild(msg);
    const detail = document.createElement('p');
    detail.className = 'cf-error-detail';
    detail.textContent = result.error ? `（${result.error}）` : '';
    if (result.error) block.appendChild(detail);
    const urlHint = document.createElement('p');
    urlHint.className = 'cf-error-url';
    urlHint.textContent = `URL: ${url.startsWith('http') ? url : new URL(url, window.location.origin).href}`;
    block.appendChild(urlHint);
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'cf-content';
  renderCfData(wrapper, data);
  block.appendChild(wrapper);
}
