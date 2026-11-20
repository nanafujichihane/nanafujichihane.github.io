
/* ============================================================
   SONG LIST
   検索・DAM絞り込み・並び替え・アーカイブ表示
   ============================================================ */

const SONG_API_URL =
  'https://script.google.com/macros/s/AKfycbxzgXV8DrskM4JYprZ5O1V-2zfHKWJLNPDDUeOlyZZQytJZ8d134ys8fIW3StdHcyvi/exec';

const songSearch = document.getElementById('song-search');
const songBody = document.getElementById('song-rows');
const songStatus = document.getElementById('song-status');
const excludeDam = document.getElementById('exclude-dam');

let songData = [];

let sortState = {
  key: 'title',
  ascending: true
};

// ============================================================
// データ取得
// ============================================================

function loadSongs() {
  showStatus('曲データを読み込んでいます…');

  const callbackName =
    'songListCallback_' + Date.now() + '_' +
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
      if (
        !response ||
        response.success !== true ||
        !Array.isArray(response.songs)
      ) {
        throw new Error('曲データの形式が正しくありません。');
      }

      songData = response.songs;
      renderSongs();

    } catch (error) {
      showStatus('読み込みエラー：' + error.message);
    } finally {
      cleanup();
    }
  };

  script.onerror = function() {
    if (completed) return;

    cleanup();
    showStatus('曲データを取得できませんでした。');
  };

  script.src =
    SONG_API_URL +
    (SONG_API_URL.includes('?') ? '&' : '?') +
    'callback=' + encodeURIComponent(callbackName) +
    '&_=' + Date.now();

  document.head.appendChild(script);
}

// ============================================================
// 表示
// ============================================================

function showStatus(message) {
  if (songStatus) {
    songStatus.textContent = message;
  }
}

// 読み仮名の比較用整形
function normalizeReading(value) {
  return String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase('ja')
    .replace(/[ 　\t\r\n]/g, '');
}

function renderSongs() {
  if (!songBody) return;

  const query = (songSearch?.value || '')
    .trim()
    .toLocaleLowerCase('ja');

  const hideDam = excludeDam?.checked || false;

  // 検索・DAM絞り込み
  const filtered = songData.filter(song => {
    const title = String(song.title || '');
    const artist = String(song.artist || '');

    const searchable =
      (title + ' ' + artist).toLocaleLowerCase('ja');

    const matchesSearch = searchable.includes(query);
    const matchesDam = !hideDam || !song.isDamOnly;

    return matchesSearch && matchesDam;
  });

  // 並び替え
  filtered.sort(compareSongs);

  // テーブルを再描画
  songBody.replaceChildren();

  filtered.forEach(song => {
    const row = document.createElement('tr');

    // 曲名
    const titleCell = document.createElement('td');
    titleCell.textContent = song.title || '';

    // アーティスト
    const artistCell = document.createElement('td');
    artistCell.textContent = song.artist || '';

    // 歌唱回数
    const countCell = document.createElement('td');
    countCell.textContent = String(Number(song.count || 0));

    // 音源区分
    const typeCell = document.createElement('td');

    if (song.isDamOnly) {
      const badge = document.createElement('span');
      badge.className = 'song-badge-dam';
      badge.textContent = 'DAM';
      typeCell.appendChild(badge);
    } else {
      typeCell.textContent = 'YouTube';
    }

    // アーカイブ
    const archiveCell = document.createElement('td');

    if (song.url && song.archiveDate) {
      const link = document.createElement('a');

      link.href = song.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = song.archiveDate;
      link.title = song.videoTitle || '';

      archiveCell.appendChild(link);
    } else {
      archiveCell.textContent = '—';
    }

    row.append(
      titleCell,
      artistCell,
      countCell,
      typeCell,
      archiveCell
    );

    songBody.appendChild(row);
  });

  if (filtered.length === 0) {
    showStatus(
      query
        ? '検索結果がありません。'
        : '表示できる曲がありません。'
    );
  } else {
    showStatus(filtered.length + '曲を表示中');
  }

  updateSortIndicators();
}

// ============================================================
// 並び替え
// ============================================================

function compareSongs(a, b) {
  let result = 0;

  switch (sortState.key) {

    case 'title': {
      // 曲名よみを優先。未登録なら曲名を使用
      const aValue = normalizeReading(
        a.titleReading || a.title
      );

      const bValue = normalizeReading(
        b.titleReading || b.title
      );

      result = aValue.localeCompare(
        bValue,
        'ja',
        { sensitivity: 'base', numeric: true }
      );

      break;
    }

    case 'artist': {
      // アーティストよみを優先
      const aValue = normalizeReading(
        a.artistReading || a.artist
      );

      const bValue = normalizeReading(
        b.artistReading || b.artist
      );

      result = aValue.localeCompare(
        bValue,
        'ja',
        { sensitivity: 'base', numeric: true }
      );

      break;
    }

    case 'count': {
      result =
        Number(a.count || 0) -
        Number(b.count || 0);

      break;
    }

    case 'archiveDate': {
      const aDate = parseArchiveDate(a.archiveDate);
      const bDate = parseArchiveDate(b.archiveDate);

      // 日付がない曲は常に最後
      if (aDate === null && bDate === null) {
        result = 0;
      } else if (aDate === null) {
        return 1;
      } else if (bDate === null) {
        return -1;
      } else {
        result = aDate - bDate;
      }

      break;
    }
  }

  return sortState.ascending ? result : -result;
}

// ============================================================
// アーカイブ日付変換
// ============================================================

function parseArchiveDate(value) {
  if (!value) return null;

  const match = String(value).match(
    /^(\d{4})\.(\d{1,2})\.(\d{1,2})$/
  );

  if (!match) return null;

  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  ).getTime();
}

// ============================================================
// 並び替えボタン
// ============================================================

document
  .querySelectorAll('.song-table th[data-sort]')
  .forEach(th => {

    th.style.cursor = 'pointer';

    th.addEventListener('click', () => {
      const key = th.dataset.sort;

      if (sortState.key === key) {
        sortState.ascending = !sortState.ascending;
      } else {
        sortState.key = key;
        sortState.ascending = true;
      }

      renderSongs();
    });
  });

function updateSortIndicators() {
  document
    .querySelectorAll('.song-table th[data-sort]')
    .forEach(th => {
      const key = th.dataset.sort;

      const label = th.dataset.originalLabel ||
        th.textContent.replace(/[↕↑↓]/g, '').trim();

      th.dataset.originalLabel = label;

      if (sortState.key === key) {
        th.textContent =
          label + (sortState.ascending ? ' ↑' : ' ↓');
      } else {
        th.textContent = label + ' ↕';
      }
    });
}

// ============================================================
// 検索・DAM絞り込み
// ============================================================

if (songSearch) {
  songSearch.addEventListener('input', renderSongs);
}

if (excludeDam) {
  excludeDam.addEventListener('change', renderSongs);
}

// ============================================================
// 起動
// ============================================================

loadSongs();
