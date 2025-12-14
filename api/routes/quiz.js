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
      .select('id, title, is_active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (quizError || !quizData) {
        return res.status(404).json({ error: 'No quiz active' });
    }

    if (quizData.is_active === false) {
        return res.status(403).json({ error: 'Quiz is currently inactive' });
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


router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      institution_type,
      institution_name,
      class_grade,
      course,
      branch,
      semester
    } = req.body;

    // Basic validation
    if (!name || !email || !phone || !institution_type || !institution_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (institution_type === 'school' && !class_grade) {
         return res.status(400).json({ error: 'Class is required for school students' });
    }

    if (institution_type === 'college' && (!course || !branch || !semester)) {
         return res.status(400).json({ error: 'Course, branch, and semester are required for college students' });
    }

    // Check if email already exists
    const { data: existingStudent } = await supabase
        .from('students')
        .select('id, token')
        .eq('email', email)
        .single();

    if (existingStudent) {
        // If they exist, deciding to just return their existing token so they can continue
        // Or we could error. Let's return the token for smoother UX.
        return res.json({ token: existingStudent.token, message: 'Welcome back!' });
    }

    const { data, error } = await supabase
      .from('students')
      .insert({
        name,
        email,
        phone,
        institution_type,
        institution_name,
        class_grade,
        course,
        branch,
        semester
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ token: data.token });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
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
