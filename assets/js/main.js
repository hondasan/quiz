document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('start-quiz');
  startBtn.addEventListener('click', () => {
    let genre = document.getElementById('genre-select').value;
    const count = document.getElementById('question-count').value;
    const isTimeAttack = document.getElementById('time-attack').checked;

    // ジャンル未選択（value=""）の場合は "all" とみなす
    if (!genre) {
      genre = 'all';
    }

    // クエリパラメータで引き継ぐ
    // 例: quiz.html?genre=math&count=5&time=1
    const url = `quiz.html?genre=${genre}&count=${count}&time=${isTimeAttack ? 1 : 0}`;
    window.location.href = url;
  });
});
