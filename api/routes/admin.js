import express from 'express';
import { parse } from 'csv-parse';
import { stringify } from 'csv-stringify';
import supabase from '../supabase.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Apply middleware to all routes in this router
router.use(authMiddleware);

// POST /api/admin/login (Check password validity)
router.post('/login', (req, res) => {
  // If middleware passed, password is good.
  res.json({ success: true });
});

router.post('/questions', async (req, res) => {
  try {
    const { title, questions } = req.body;

    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Invalid questions format' });
    }

    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert([{ title: title || 'Untitled Quiz ' + new Date().toISOString() }])
      .select()
      .single();

    if (quizError) throw quizError;

    const formattedQuestions = questions.map(q => {
      let correctIndex = q.correctIndex;
      if (correctIndex === undefined && q.correctAnswer) {
         correctIndex = q.options.indexOf(q.correctAnswer);
      }
      if (correctIndex === -1 || correctIndex === undefined) correctIndex = 0;

      return {
        quiz_id: quiz.id,
        question_text: q.question,
        options: q.options,
        correct_index: correctIndex,
        time_seconds: q.time || 30
      };
    });

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(formattedQuestions);

    if (questionsError) throw questionsError;

    res.json({ success: true, quizId: quiz.id, message: 'Quiz created successfully' });

  } catch (err) {
    console.error('Error uploading questions:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/students', async (req, res) => {
  try {
    const { csvContent } = req.body;
    if (!csvContent) return res.status(400).json({ error: 'No CSV content provided' });

    parse(csvContent, { columns: true, trim: true }, async (err, records) => {
      if (err) {
        return res.status(400).json({ error: 'Invalid CSV format' });
      }

      const studentsToInsert = records.map(r => ({
        name: r.name || r.Name,
        email: r.email || r.Email
      }));

      const { data: createdStudents, error } = await supabase
        .from('students')
        .insert(studentsToInsert)
        .select();

      if (error) throw error;

      const studentsWithLinks = createdStudents.map(s => ({
        ...s,
        link: `/quiz/${s.token}`
      }));

      res.json({ success: true, students: studentsWithLinks });
    });

  } catch (err) {
      console.error('Error processing students:', err);
      res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/reset
router.delete('/reset', async (req, res) => {
    try {
        // Delete in order of constraints
        // submissions -> questions -> students -> quizzes (cascade might handle it, but explicit is safer without cascade)
        // Actually our schema doesn't have cascades defined explicitly in the provided SQL.
        // Assuming no stringent FK checks preventing deletions if we do it in order:

        await supabase.from('submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        await supabase.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('quizzes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        res.json({ success: true, message: 'Database reset successfully' });
    } catch (err) {
        console.error('Reset error:', err);
        res.status(500).json({ error: 'Failed to reset database' });
    }
});

// GET /api/admin/export
router.get('/export', async (req, res) => {
    try {
        // Fetch all submissions with student info
        const { data: submissions, error } = await supabase
            .from('submissions')
            .select(`
                score,
                submitted_at,
                students ( name, email )
            `);

        if (error) throw error;

        // Flatten data
        const records = submissions.map(sub => ({
            Name: sub.students.name,
            Email: sub.students.email,
            Score: sub.score,
            SubmittedAt: new Date(sub.submitted_at).toLocaleString()
        }));

        stringify(records, { header: true }, (err, output) => {
            if (err) return res.status(500).json({ error: 'CSV gen error' });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="results.csv"');
            res.status(200).send(output);
        });

    } catch (err) {
        console.error('Export error:', err);
        res.status(500).json({ error: 'Failed to export results' });
    }
});

export default router;
