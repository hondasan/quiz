/**
 * クエリパラメータを取得するためのユーティリティ関数
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

/**
 * 配列をシャッフルする関数（フィッシャー–イェーツ）
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1));
    [array[i], array[r]] = [array[r], array[i]];
  }
  return array;
}

document.addEventListener('DOMContentLoaded', async () => {
  // クエリパラメータの取得
  const { genre, count, time } = getQueryParams();
  const questionCount = parseInt(count, 10) || 5;
  const isTimeAttack = time === '1';

  // JSONファイルから問題データを取得
  // 例：data/general.json, data/math.json, data/science.json
  let allQuestions = [];
  try {
    const response = await fetch(`data/${genre}.json`);
    allQuestions = await response.json();
  } catch (error) {
    console.error('問題データの読み込みに失敗しました:', error);
    alert('問題データの読み込みに失敗しました。');
    return;
  }

  // ランダムにシャッフルして指定数だけ抽出
  shuffleArray(allQuestions);
  const selectedQuestions = allQuestions.slice(0, questionCount);

  // クイズ進行状況を管理する変数
  let currentIndex = 0;
  let correctCount = 0;
  let score = 0;

  // タイマー関連
  let timerId = null;
  const timeLimit = 10; // タイムアタックの1問あたり時間

  // 要素の参照
  const progressEl = document.getElementById('progress');
  const timerEl = document.getElementById('timer');
  const timeLeftEl = document.getElementById('time-left');
  const questionContainerEl = document.getElementById('question-container');
  const feedbackEl = document.getElementById('feedback');

  // 最初の問題を表示
  showQuestion(currentIndex);

  /**
   * 問題を表示する関数
   */
  function showQuestion(index) {
    const q = selectedQuestions[index];

    // 進捗表示
    progressEl.textContent = `第 ${index + 1} 問 / 全 ${questionCount} 問`;

    // 問題文と選択肢を生成
    const questionHtml = `
      <p class="question-text">${q.question}</p>
      <ul class="choices">
        ${q.choices.map((choice, i) =>
          `<li><button class="choice-btn" data-choice-index="${i}">${choice}</button></li>`
        ).join('')}
      </ul>
    `;
    questionContainerEl.innerHTML = questionHtml;

    // フィードバック領域をリセット
    feedbackEl.textContent = '';

    // タイムアタックモードならタイマー開始
    if (isTimeAttack) {
      timerEl.style.display = 'block';
      startTimer();
    } else {
      timerEl.style.display = 'none';
    }

    // 選択肢ボタンにイベントを紐付け
    const choiceButtons = questionContainerEl.querySelectorAll('.choice-btn');
    choiceButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        // タイマー停止
        if (isTimeAttack) {
          clearInterval(timerId);
        }
        const userAnswer = parseInt(e.target.dataset.choiceIndex, 10);
        handleAnswer(userAnswer);
      });
    });
  }

  /**
   * 回答処理
   */
  function handleAnswer(userAnswer) {
    const q = selectedQuestions[currentIndex];
    const correctAnswer = q.answer;

    // 正解判定
    if (userAnswer === correctAnswer) {
      correctCount++;
      // タイムボーナスの例：残り秒数 × 2点
      let remaining = 0;
      if (isTimeAttack) {
        remaining = parseInt(timeLeftEl.textContent, 10) || 0;
      }
      const timeBonus = remaining * 2;
      score += 10 + timeBonus; // 基本10点 + タイムボーナス
      feedbackEl.style.color = 'green';
      feedbackEl.textContent = '正解！';
    } else {
      feedbackEl.style.color = 'red';
      feedbackEl.textContent = '不正解...';
    }

    // 解説表示（数秒間表示する、またはすぐ次へ行っても良い）
    // 今回は 1.5 秒程度待ってから次へ行く
    setTimeout(() => {
      // 次の問題へ or 終了判定
      currentIndex++;
      if (currentIndex < questionCount) {
        showQuestion(currentIndex);
      } else {
        // クイズ終了
        goToResult();
      }
    }, 1500);
  }

  /**
   * タイマーをスタートする
   */
  function startTimer() {
    let timeLeft = timeLimit;
    timeLeftEl.textContent = timeLeft;

    timerId = setInterval(() => {
      timeLeft--;
      timeLeftEl.textContent = timeLeft;
      if (timeLeft <= 0) {
        // タイムオーバー
        clearInterval(timerId);
        feedbackEl.style.color = 'red';
        feedbackEl.textContent = '時間切れ...';
        setTimeout(() => {
          currentIndex++;
          if (currentIndex < questionCount) {
            showQuestion(currentIndex);
          } else {
            goToResult();
          }
        }, 1500);
      }
    }, 1000);
  }

  /**
   * 結果画面へ移動
   */
  function goToResult() {
    // URLクエリパラメータで受け渡す場合
    // スコア、正解数、問題数を渡す（正確にはLocalStorageの方が容量安心）
    const url = `result.html?score=${score}&correct=${correctCount}&total=${questionCount}`;
    window.location.href = url;
  }
});
