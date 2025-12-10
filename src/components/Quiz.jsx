import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const Quiz = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizData, setQuizData] = useState(null); // { student, quiz, questions }
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: { selectedIndex, timeTaken } }
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  useEffect(() => {
    fetchQuiz();
  }, [token]);

  const fetchQuiz = async () => {
    try {
      const res = await axios.get(`/api/quiz/${token}`);
      setQuizData(res.data);
      setLoading(false);
      // Start
      setQuizStartTime(Date.now());
      setQuestionStartTime(Date.now());
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
    if (submitted || !quizData || loading) return;

    if (timeLeft === 0) {
      handleNext(null, true); // Timeout
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted, quizData, loading]);

  const handleNext = (selectedIndex, isTimeout = false) => {
    const currentQ = quizData.questions[currentQuestionIndex];
    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);

    const newAnswers = {
        ...answers,
        [currentQ.id]: {
            selectedIndex: selectedIndex, // null if timeout and no selection
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

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (submitted) return (
    <div className="p-4 max-w-xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">Quiz Completed!</h1>
        <div className="text-6xl font-bold text-blue-600 mb-4">{score}</div>
        <p>Total Score (including time bonuses)</p>
    </div>
  );

  const currentQ = quizData.questions[currentQuestionIndex];

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-xl font-bold">{quizData.quiz.title}</h2>
            <p className="text-gray-600">Student: {quizData.student.name}</p>
        </div>
        <div className="text-right">
            <div className={`text-2xl font-bold ${timeLeft < 10 ? 'text-red-500' : 'text-gray-800'}`}>
                {timeLeft}s
            </div>
            <div className="text-xs text-gray-500">Question {currentQuestionIndex + 1} of {quizData.questions.length}</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow mb-6">
        <h3 className="text-lg font-medium mb-6">{currentQ.question_text}</h3>
        <div className="space-y-3">
            {currentQ.options.map((option, idx) => (
                <button
                    key={idx}
                    onClick={() => handleNext(idx)}
                    className="w-full text-left p-4 border rounded hover:bg-blue-50 hover:border-blue-400 transition-colors"
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
