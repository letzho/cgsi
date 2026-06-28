import { useState } from 'react';
import { useGamification } from '../../../context/GamificationContext';
import { QUIZ_QUESTIONS } from '../../../data/quizQuestions';
import { POINT_VALUES } from '../../../utils/gamification';
import './ESGQuizGame.css';

export default function ESGQuizGame({ onComplete }) {
  const { earnPoints } = useGamification();
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [finished, setFinished] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const question = QUIZ_QUESTIONS[index];

  const handleAnswer = (optIdx) => {
    if (selected !== null) return;
    setSelected(optIdx);
    setShowResult(true);
    const correct = optIdx === question.answer;
    const newScore = correct ? score + 1 : score;
    if (correct) setScore(newScore);

    setTimeout(() => {
      if (index + 1 >= QUIZ_QUESTIONS.length) {
        const pts = newScore * POINT_VALUES.quizCorrect;
        const bonus = newScore === QUIZ_QUESTIONS.length ? POINT_VALUES.quizPerfectBonus : 0;
        setFinalScore(newScore);
        earnPoints(pts + bonus, `ESG Quiz: ${newScore}/${QUIZ_QUESTIONS.length}`, {
          gamePlayed: true,
          perfectQuiz: newScore === QUIZ_QUESTIONS.length,
        });
        setFinished(true);
        onComplete?.(pts + bonus);
      } else {
        setIndex((i) => i + 1);
        setSelected(null);
        setShowResult(false);
      }
    }, 1200);
  };

  const restart = () => {
    setIndex(0);
    setScore(0);
    setSelected(null);
    setFinished(false);
    setShowResult(false);
    setFinalScore(0);
  };

  if (finished) {
    return (
      <div className="quiz-game quiz-game--done">
        <div className="quiz-game__trophy">🧠</div>
        <h3>Quiz Complete!</h3>
        <p>
          You scored {finalScore}/{QUIZ_QUESTIONS.length}
        </p>
        <button className="quiz-game__btn" onClick={restart}>
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-game">
      <div className="quiz-game__progress">
        {QUIZ_QUESTIONS.map((_, i) => (
          <span key={i} className={`quiz-game__dot ${i <= index ? 'quiz-game__dot--active' : ''}`} />
        ))}
      </div>
      <div className="quiz-game__counter">
        Question {index + 1} / {QUIZ_QUESTIONS.length}
      </div>
      <h3 className="quiz-game__question">{question.q}</h3>
      <div className="quiz-game__options">
        {question.options.map((opt, i) => {
          let cls = 'quiz-game__option';
          if (showResult && i === question.answer) cls += ' quiz-game__option--correct';
          else if (showResult && i === selected && i !== question.answer)
            cls += ' quiz-game__option--wrong';
          else if (selected === i) cls += ' quiz-game__option--selected';

          return (
            <button key={i} className={cls} onClick={() => handleAnswer(i)}>
              {opt}
            </button>
          );
        })}
      </div>
      <div className="quiz-game__reward-hint">+{POINT_VALUES.quizCorrect} pts per correct answer</div>
    </div>
  );
}
