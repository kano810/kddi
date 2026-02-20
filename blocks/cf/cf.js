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
 * Builds the CF JSON URL from path or raw URL.
 * @param {string} pathOrUrl Path (e.g. /content/fragments/xxx) or full URL
 * @returns {string} URL to fetch
 */
function getCfJsonUrl(pathOrUrl) {
  const raw = (pathOrUrl || '').trim();
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  const path = raw.replace(/(\.model\.json)?\/?$/, '');
  return `${path}.model.json`;
}

/**
 * Fetches JSON and returns the fragment data (handles AEM-style wrapper if present).
 * @param {string} url URL to fetch
 * @returns {Promise<object|null>} Fragment data or null
 */
async function fetchCfData(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data && typeof data === 'object') {
      if (data.model) return data.model;
      if (data.elements) return data.elements;
      return data;
    }
    return null;
  } catch {
    return null;
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
 * Decorates the CF block: reads path/URL from first cell, fetches JSON, displays data.
 * @param {Element} block The cf block element
 */
export default async function decorate(block) {
  preserveBlockInstrumentation(block);

  const firstCell = block.querySelector('div');
  const link = block.querySelector('a');
  const pathOrUrl = link ? link.getAttribute('href') : (firstCell?.textContent?.trim() || '');
  const url = getCfJsonUrl(pathOrUrl);

  block.textContent = '';

  if (!url) {
    block.classList.add('cf-empty');
    const msg = document.createElement('p');
    msg.textContent = 'CFのパスまたはURLを入力してください（例: /content/fragments/xxx）';
    block.appendChild(msg);
    return;
  }

  const data = await fetchCfData(url);

  if (!data || Object.keys(data).length === 0) {
    block.classList.add('cf-error');
    const msg = document.createElement('p');
    msg.textContent = 'CFデータを取得できませんでした。パスまたはURLを確認してください。';
    block.appendChild(msg);
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'cf-content';
  renderCfData(wrapper, data);
  block.appendChild(wrapper);
}
