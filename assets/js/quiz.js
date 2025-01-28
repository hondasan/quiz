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
  let allQuestions = [];
  if (genre === 'all') {
    // 全ジャンルからまとめて取得
    // data/general.json, data/math.json, data/science.json をまとめる例
    const urls = ['data/general.json', 'data/math.json', 'data/science.json'];
    for (const url of urls) {
      try {
        const response = await fetch(url);
        const questions = await response.json();
        allQuestions = allQuestions.concat(questions);
      } catch (error) {
        console.error(`${url}の読み込みに失敗:`, error);
      }
    }
    if (allQuestions.length === 0) {
      alert('問題データの読み込みに失敗しました。');
      return;
    }
  } else {
    // 指定ジャンルのみ
    try {
      const response = await fetch(`data/${genre}.json`);
      allQuestions = await response.json();
    } catch (error) {
      console.error('問題データの読み込みに失敗しました:', error);
      alert('問題データの読み込みに失敗しました。');
      return;
    }
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
  const timeLimit = 10; // タイムアタックの1問あたりの時間

  // 要素の参照
  const progressEl = document.getElementById('progress');
  const timerEl = document.getElementById('timer');
  const timeLeftEl = document.getElementById('time-left');
  const questionContainerEl = document.getElementById('question-container');
  const feedbackEl = document.getElementById('feedback');
  const explanationEl = document.getElementById('explanation-container');
  const nextBtn = document.getElementById('next-btn');
  const backToTopBtn = document.getElementById('back-to-top');

  // 「トップへ戻る」ボタン
  backToTopBtn.addEventListener('click', () => {
    if (confirm('クイズを中断してトップに戻りますか？')) {
      window.location.href = 'index.html';
    }
  });

  // ボタンの押下時、次の問題へ進む
  nextBtn.addEventListener('click', () => {
    nextBtn.style.display = 'none';         // 次へボタンを再度非表示
    explanationEl.style.display = 'none';   // 解説エリアを非表示
    feedbackEl.textContent = '';            // フィードバック消去

    // 次の問題へ or 終了判定
    currentIndex++;
    if (currentIndex < questionCount) {
      showQuestion(currentIndex);
    } else {
      // クイズ終了
      goToResult();
    }
  });

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

    // タイマー表示のリセット
    if (isTimeAttack) {
      timerEl.style.display = 'block';
      startTimer();
    } else {
      timerEl.style.display = 'none';
    }
  }

  /**
   * 選択肢をクリックした際の処理
   * （イベントリスナーは表示後に付与する）
   */
  document.addEventListener('click', (e) => {
    if (!e.target.classList.contains('choice-btn')) return;

    // タイマー停止
    if (isTimeAttack) {
      clearInterval(timerId);
    }

    const userAnswer = parseInt(e.target.dataset.choiceIndex, 10);
    handleAnswer(userAnswer);
  });

  /**
   * 回答処理
   */
  function handleAnswer(userAnswer) {
    const q = selectedQuestions[currentIndex];
    const correctAnswer = q.answer;

    // 正解判定
    let isCorrect = false;
    if (userAnswer === correctAnswer) {
      isCorrect = true;
      correctCount++;
      // タイムボーナスの例：残り秒数 × 2点
      let remaining = 0;
      if (isTimeAttack) {
        remaining = parseInt(timeLeftEl.textContent, 10) || 0;
      }
      const timeBonus = remaining * 2;
      score += 10 + timeBonus; // 基本10点 + タイムボーナス
    }

    showExplanation(q, isCorrect);
  }

  /**
   * 正解・不正解にかかわらず解説を表示し、「次へ」ボタンを出す
   */
  function showExplanation(question, isCorrect) {
    if (isCorrect) {
      feedbackEl.style.color = 'green';
      feedbackEl.textContent = '正解！';
    } else {
      feedbackEl.style.color = 'red';
      feedbackEl.textContent = '不正解...';
    }

    // 解説を表示
    explanationEl.innerHTML = `
      <p><strong>解説：</strong>${question.explanation || '解説はありません。'}</p>
    `;
    explanationEl.style.display = 'block';

    // 「次へ」ボタンを表示
    nextBtn.style.display = 'inline-block';
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
        // タイムオーバー → 不正解扱い
        clearInterval(timerId);
        feedbackEl.style.color = 'red';
        feedbackEl.textContent = '時間切れ...';

        const q = selectedQuestions[currentIndex];
        // 解説表示（不正解扱い）
        showExplanation(q, false);
      }
    }, 1000);
  }

  /**
   * 結果画面へ移動
   */
  function goToResult() {
    const url = `result.html?score=${score}&correct=${correctCount}&total=${questionCount}`;
    window.location.href = url;
  }
});
