import express from 'express';
import { parse } from 'csv-parse';
import supabase from '../supabase.js';

const router = express.Router();

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

export default router;
