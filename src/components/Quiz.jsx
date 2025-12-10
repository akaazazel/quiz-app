import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const Quiz = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [token]);

  const fetchQuiz = async () => {
    try {
      const res = await axios.get(`/api/quiz/${token}`);
      setQuizData(res.data);
      setLoading(false);
      // Start logic handles timers
      if (res.data.questions.length > 0) {
        setTimeLeft(res.data.questions[0].time_seconds);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to load quiz');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (submitted || !quizData || loading || !hasStarted) return;

    if (timeLeft === 0) {
      handleNext(null, true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted, quizData, loading, hasStarted]);

  const handleNext = (selectedIndex, isTimeout = false) => {
    const currentQ = quizData.questions[currentQuestionIndex];
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);

    const newAnswers = {
        ...answers,
        [currentQ.id]: {
            selectedIndex: selectedIndex,
            timeTaken: isTimeout ? currentQ.time_seconds : timeTaken
        }
    };
    setAnswers(newAnswers);

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < quizData.questions.length) {
        setCurrentQuestionIndex(nextIndex);
        setQuestionStartTime(Date.now());
        setTimeLeft(quizData.questions[nextIndex].time_seconds);
    } else {
        submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (finalAnswers) => {
    setSubmitted(true);
    setLoading(true);
    try {
        const res = await axios.post('/api/quiz/submit', {
            token,
            answers: finalAnswers
        });
        setScore(res.data.score);
    } catch (err) {
        setError('Submission failed: ' + (err.response?.data?.error || err.message));
    } finally {
        setLoading(false);
    }
  };

  const handleStart = () => {
      setHasStarted(true);
      setQuizStartTime(Date.now());
      setQuestionStartTime(Date.now());
      if (quizData.questions.length > 0) {
        setTimeLeft(quizData.questions[0].time_seconds);
      }
  };

  if (loading) return <div className="container center" style={{ marginTop: '20vh' }}>Loading...</div>;
  if (error) return <div className="container center text-error" style={{ marginTop: '20vh' }}>{error}</div>;

  if (submitted) return (
    <div className="container center" style={{ minHeight: '80vh' }}>
      <div className="card text-center" style={{ maxWidth: '500px' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{score}</h1>
          <p className="text-subtle mb-8">Total Score</p>
          <div className="badge badge-success" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>Quiz Completed</div>
      </div>
    </div>
  );

  if (!hasStarted) {
      return (
          <div className="container center" style={{ minHeight: '80vh' }}>
              <div className="card text-center" style={{ maxWidth: '600px' }}>
                  <h1 className="mb-4">Welcome, {quizData.student.name}</h1>
                  <p className="text-subtle mb-8" style={{ fontSize: '1.25rem' }}>{quizData.quiz.title}</p>

                  <div className="text-left mb-8 p-4" style={{ background: 'var(--accents-1)', borderRadius: 'var(--radius)' }}>
                      <h3 className="mb-4" style={{ fontSize: '1rem' }}>Instructions</h3>
                      <ul style={{ paddingLeft: '1.5rem', color: 'var(--accents-6)' }}>
                          <li>There are <strong>{quizData.questions.length} questions</strong>.</li>
                          <li>Each question has a strict time limit.</li>
                          <li>Speed bonus points are awarded for fast answers.</li>
                          <li>Once started, you cannot go back.</li>
                      </ul>
                  </div>

                  <button onClick={handleStart} className="btn btn-primary btn-lg" style={{ width: '100%', height: '50px', fontSize: '1.1rem' }}>
                      Start Quiz
                  </button>
              </div>
          </div>
      );
  }

  const currentQ = quizData.questions[currentQuestionIndex];

  return (
    <div className="container" style={{ maxWidth: '700px', marginTop: '5vh' }}>
      <div className="row justify-between mb-8" style={{ alignItems: 'flex-end' }}>
        <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{quizData.quiz.title}</h2>
            <p className="text-subtle text-sm">Question {currentQuestionIndex + 1} of {quizData.questions.length}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
            <div style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: timeLeft < 10 ? 'var(--error)' : 'var(--geist-foreground)',
                fontVariantNumeric: 'tabular-nums'
            }}>
                {timeLeft}s
            </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>{currentQ.question_text}</h3>
        <div className="stack">
            {currentQ.options.map((option, idx) => (
                <button
                    key={idx}
                    onClick={() => handleNext(idx)}
                    className="btn btn-secondary"
                    style={{
                        justifyContent: 'flex-start',
                        height: 'auto',
                        padding: '1rem',
                        fontSize: '1.1rem',
                        textAlign: 'left'
                    }}
                >
                    {option}
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
