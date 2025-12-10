import express from 'express';
import supabase from '../supabase.js';

const router = express.Router();

router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, name, email')
      .eq('token', token)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ error: 'Invalid or expired link' });
    }

    const { data: submission } = await supabase
      .from('submissions')
      .select('id')
      .eq('student_id', student.id)
      .single();

    if (submission) {
      return res.status(403).json({ error: 'Quiz already submitted' });
    }

    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('id, title')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (quizError || !quizData) {
        return res.status(404).json({ error: 'No quiz active' });
    }

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, question_text, options, time_seconds')
      .eq('quiz_id', quizData.id);

    if (questionsError) throw questionsError;

    res.json({
        student: student,
        quiz: quizData,
        questions: questions
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server validation error' });
  }
});

router.post('/submit', async (req, res) => {
  try {
    const { token, answers } = req.body;

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('token', token)
      .single();

    if (studentError || !student) {
        return res.status(403).json({ error: 'Invalid user' });
    }

    const { data: existingSub } = await supabase
        .from('submissions')
        .select('id')
        .eq('student_id', student.id)
        .single();

    if (existingSub) return res.status(400).json({ error: 'Already submitted' });

    const questionIds = Object.keys(answers);
    if (questionIds.length === 0) {
        await supabase.from('submissions').insert({ student_id: student.id, score: 0, answers: {} });
        return res.json({ score: 0, total: 0 });
    }

    const { data: dbQuestions } = await supabase
        .from('questions')
        .select('id, correct_index, time_seconds')
        .in('id', questionIds);

    let totalScore = 0;

    dbQuestions.forEach(q => {
        const studentAns = answers[q.id];
        if (!studentAns) return;

        if (studentAns.selectedIndex === q.correct_index) {
            let questionScore = 10;
            const timeLimit = q.time_seconds;
            const taken = studentAns.timeTaken || timeLimit;
            const diff = Math.max(0, timeLimit - taken);
            questionScore += diff;
            totalScore += questionScore;
        }
    });

    await supabase.from('submissions').insert({
        student_id: student.id,
        score: totalScore,
        answers: answers
    });

    res.json({ success: true, score: totalScore });

  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Submission failed' });
  }
});

export default router;
