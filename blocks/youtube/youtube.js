/*
 * YouTube Block
 * Embeds a YouTube video from a URL.
 */

import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Extracts YouTube video ID from URL.
 * Supports: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
 * @param {string} url YouTube URL or video ID
 * @returns {string|null} Video ID or null
 */
function getYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const ytMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return ytMatch ? ytMatch[1] : null;
  } catch {
    return null;
  }
}

/**
 * Decorates the YouTube block: reads URL from first cell and renders iframe embed.
 * @param {Element} block The youtube block element
 */
export default function decorate(block) {
  const firstCell = block.querySelector('div');
  const link = block.querySelector('a');
  const url = link ? link.getAttribute('href') : (firstCell?.textContent?.trim() || '');
  const videoId = getYouTubeVideoId(url);

  block.textContent = '';

  if (!videoId) {
    block.classList.add('youtube-empty');
    const msg = document.createElement('p');
    msg.textContent = 'YouTubeのURLを入力してください';
    block.appendChild(msg);
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'youtube-embed-wrapper';

  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube.com/embed/${videoId}`;
  iframe.title = 'YouTube video';
  iframe.loading = 'lazy';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  iframe.allowFullscreen = true;

  if (link) {
    moveInstrumentation(link, iframe);
  }

  wrapper.appendChild(iframe);
  block.appendChild(wrapper);
}
