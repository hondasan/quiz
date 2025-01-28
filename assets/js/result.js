/**
 * クエリパラメータを取得するユーティリティ関数
 */
function getQueryParams() {
  const params = {};
  const query = location.search.substring(1);
  if (!query) return params;
  const pairs = query.split('&');
  pairs.forEach(pair => {
    const [key, value] = pair.split('=');
    params[key] = decodeURIComponent(value || '');
  });
  return params;
}

document.addEventListener('DOMContentLoaded', () => {
  const params = getQueryParams();
  const score = parseInt(params.score, 10) || 0;
  const correct = parseInt(params.correct, 10) || 0;
  const total = parseInt(params.total, 10) || 0;

  const resultContainer = document.getElementById('result-container');

  // 正解率
  const percentage = total > 0 ? ((correct / total) * 100).toFixed(1) : 0;

  // 結果表示
  resultContainer.innerHTML = `
    <p>正解数：${correct} / ${total}</p>
    <p>正解率：${percentage}%</p>
    <p>スコア：${score}</p>
  `;

  // スコアをローカルストレージに保存し、ランキングを表示
  saveScoreToLocalStorage(score);
  showRanking();

  // シェアボタン
  const shareTwitterBtn = document.getElementById('share-twitter');
  shareTwitterBtn.addEventListener('click', () => {
    // Twitterシェア用URL
    const text = `クイズのスコアは ${score} 点でした！`;
    const hashtags = 'MyQuizApp';
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&hashtags=${hashtags}`;
    window.open(url, '_blank');
  });
});

/**
 * スコアをローカルストレージに保存
 */
function saveScoreToLocalStorage(score) {
  const date = new Date().toLocaleString();
  // 既存の履歴を取得
  let history = JSON.parse(localStorage.getItem('quizHistory')) || [];
  // 今回のスコアを保存
  history.push({ score, date });
  // ハイスコア順にソート
  history.sort((a, b) => b.score - a.score);

  // 必要に応じて上位N件のみ保持 (例: 上位10件)
  // history = history.slice(0, 10);

  // 更新
  localStorage.setItem('quizHistory', JSON.stringify(history));
}

/**
 * ランキング表示
 */
function showRanking() {
  const history = JSON.parse(localStorage.getItem('quizHistory')) || [];
  if (history.length === 0) return;

  let html = '<h2>ランキング</h2><ol>';
  history.forEach((record, index) => {
    html += `<li>${index + 1}位：${record.score} 点 (${record.date})</li>`;
  });
  html += '</ol>';

  const container = document.getElementById('result-container');
  container.insertAdjacentHTML('beforeend', html);
}
