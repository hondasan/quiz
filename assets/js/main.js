document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('start-quiz');
  startBtn.addEventListener('click', () => {
    const genre = document.getElementById('genre-select').value;
    const count = document.getElementById('question-count').value;
    const isTimeAttack = document.getElementById('time-attack').checked;

    // クエリパラメータで引き継ぐ
    // 例: quiz.html?genre=math&count=5&time=1
    const url = `quiz.html?genre=${genre}&count=${count}&time=${isTimeAttack ? 1 : 0}`;
    window.location.href = url;
  });
});
