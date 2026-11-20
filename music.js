
/* ============================================================
   MUSIC PAGE
   YouTube再生リストから動画を自動取得
   ============================================================ */

const MUSIC_API_URL =
  'https://script.google.com/macros/s/AKfycbzmdOeYL9qFCVwjYp9jEEiOPeVQS5h7De0ZwYjNWnkLbnlUfPs-KG_NQ5ZoTgd8GYs/exec';

// ============================================================
// JSONPでGASからデータ取得
// ============================================================

function loadMusicVideos() {
  const callbackName =
    'musicListCallback_' + Date.now() + '_' +
    Math.random().toString(36).slice(2);

  const script = document.createElement('script');

  let completed = false;

  function cleanup() {
    delete window[callbackName];
    script.remove();
  }

  window[callbackName] = function(response) {
    completed = true;

    try {
      if (!response || response.success !== true) {
        throw new Error(
          response?.message || '動画データを取得できませんでした。'
        );
      }

      renderMusicVideos(
        'cover-videos',
        response.covers || []
      );

      renderMusicVideos(
        'collaboration-videos',
        response.collaborations || []
      );

    } catch (error) {
      console.error('MUSIC API Error:', error);

      showMusicError('cover-videos');
      showMusicError('collaboration-videos');

    } finally {
      cleanup();
    }
  };

  script.onerror = function() {
    if (completed) return;

    cleanup();

    showMusicError('cover-videos');
    showMusicError('collaboration-videos');
  };

  script.src =
    MUSIC_API_URL +
    '?callback=' + encodeURIComponent(callbackName) +
    '&_=' + Date.now();

  document.head.appendChild(script);
}

// ============================================================
// 動画一覧表示
// ============================================================

function renderMusicVideos(containerId, videos) {
  const container = document.getElementById(containerId);

  if (!container) return;

  container.replaceChildren();

  if (!Array.isArray(videos) || videos.length === 0) {
    const message = document.createElement('p');
    message.className = 'music-empty';
    message.textContent = '現在表示できる動画はありません。';

    container.appendChild(message);
    return;
  }

  videos.forEach(video => {
    if (!video.videoId) return;

    const link = document.createElement('a');
    link.className = 'music-video-item';
    link.href = video.url ||
      'https://www.youtube.com/watch?v=' + video.videoId;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    // サムネイル
    const thumbnail = document.createElement('div');
    thumbnail.className = 'music-video-thumb';

    const image = document.createElement('img');
    image.src = video.thumbnail ||
      'https://img.youtube.com/vi/' +
      video.videoId + '/hqdefault.jpg';

    image.alt = video.title || 'YouTube video';
    image.loading = 'lazy';

    thumbnail.appendChild(image);

    // 動画タイトル
    const title = document.createElement('b');
    title.textContent = video.title || 'Untitled';

    // YouTubeリンク表記
    const textLink = document.createElement('span');
    textLink.className = 'text-link';
    textLink.textContent = 'WATCH ON YOUTUBE ↗';

    link.append(
      thumbnail,
      title,
      textLink
    );

    container.appendChild(link);
  });
}

// ============================================================
// エラー表示
// ============================================================

function showMusicError(containerId) {
  const container = document.getElementById(containerId);

  if (!container) return;

  container.replaceChildren();

  const message = document.createElement('p');
  message.className = 'music-error';
  message.textContent =
    '動画を読み込めませんでした。時間をおいて再読み込みしてください。';

  container.appendChild(message);
}

// ============================================================
// 起動
// ============================================================

loadMusicVideos();
