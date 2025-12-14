import express from "express";
import { parse } from "csv-parse";
import { stringify } from "csv-stringify";
import supabase from "../supabase.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// Apply middleware to all routes in this router
router.use(authMiddleware);

// POST /api/admin/login (Check password validity)
router.post("/login", (req, res) => {
    // If middleware passed, password is good.
    res.json({ success: true });
});

router.post("/questions", async (req, res) => {
    try {
        const { title, questions } = req.body;

        if (!questions || !Array.isArray(questions)) {
            return res.status(400).json({ error: "Invalid questions format" });
        }

        const { data: quiz, error: quizError } = await supabase
            .from("quizzes")
            .insert([
                { title: title || "Untitled Quiz " + new Date().toISOString() },
            ])
            .select()
            .single();

        if (quizError) throw quizError;

        const formattedQuestions = questions.map((q) => {
            let correctIndex = q.correctIndex;
            if (correctIndex === undefined && q.correctAnswer) {
                correctIndex = q.options.indexOf(q.correctAnswer);
            }
            if (correctIndex === -1 || correctIndex === undefined)
                correctIndex = 0;

            return {
                quiz_id: quiz.id,
                question_text: q.question,
                options: q.options,
                correct_index: correctIndex,
                time_seconds: q.time || 30,
            };
        });

        const { error: questionsError } = await supabase
            .from("questions")
            .insert(formattedQuestions);

        if (questionsError) throw questionsError;

        res.json({
            success: true,
            quizId: quiz.id,
            message: "Quiz created successfully",
        });
    } catch (err) {
        console.error("Error uploading questions:", err);
        res.status(500).json({ error: err.message });
    }
});

router.post("/students", async (req, res) => {
    try {
        const { csvContent } = req.body;
        if (!csvContent)
            return res.status(400).json({ error: "No CSV content provided" });

        parse(
            csvContent,
            { columns: true, trim: true },
            async (err, records) => {
                if (err) {
                    return res
                        .status(400)
                        .json({ error: "Invalid CSV format" });
                }

                const studentsToInsert = records.map((r) => ({
                    name: r.name || r.Name,
                    email: r.email || r.Email,
                }));

                const { data: createdStudents, error } = await supabase
                    .from("students")
                    .insert(studentsToInsert)
                    .select();

                if (error) throw error;

                const studentsWithLinks = createdStudents.map((s) => ({
                    ...s,
                    link: `/quiz/${s.token}`,
                }));

                res.json({ success: true, students: studentsWithLinks });
            }
        );
    } catch (err) {
        console.error("Error processing students:", err);
        res.status(500).json({ error: err.message });
    }
});
// DELETE /api/admin/students - Bulk delete
router.delete("/students", async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: "Invalid IDs" });
        }

        // Delete submissions first (FK constraint)
        const { error: subError } = await supabase
            .from("submissions")
            .delete()
            .in("student_id", ids);

        if (subError) throw subError;

        // Delete students
        const { error: studentError } = await supabase
            .from("students")
            .delete()
            .in("id", ids);

        if (studentError) throw studentError;

        res.json({ success: true, message: "Students deleted" });

    } catch (err) {
        console.error("Bulk delete error:", err);
        res.status(500).json({ error: "Failed to delete students" });
    }
});


// DELETE /api/admin/quiz - Delete Quiz and Questions only
router.delete("/quiz", async (req, res) => {
    try {
        // Delete questions first (FK constraint)
        await supabase
            .from("questions")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");

        // Delete quizzes
        await supabase
            .from("quizzes")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000");

        res.json({ success: true, message: "Quiz deleted successfully. Students and submissions preserved." });
    } catch (err) {
        console.error("Delete quiz error:", err);
        res.status(500).json({ error: "Failed to delete quiz" });
    }
});

// GET /api/admin/export
router.get("/export", async (req, res) => {
    try {
        // Fetch all submissions with DETAILED student info
        const { data: submissions, error } = await supabase.from("submissions")
            .select(`
                score,
                answers,
                submitted_at,
                students (
                    name,
                    email,
                    phone,
                    institution_type,
                    institution_name,
                    class_grade,
                    course,
                    branch,
                    semester
                )
            `);

        if (error) throw error;

        // Flatten data
        const records = submissions.map((sub) => {
            const s = sub.students;
            return {
                Name: s.name,
                Email: s.email,
                Phone: s.phone || '',
                Type: s.institution_type || '',
                Institution: s.institution_name || '',
                Class: s.class_grade || '',
                Course: s.course || '',
                Branch: s.branch || '',
                Semester: s.semester || '',
                Score: sub.score,
                SubmittedAt: new Date(sub.submitted_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            };
        });

        stringify(records, { header: true }, (err, output) => {
            if (err) return res.status(500).json({ error: "CSV gen error" });

            res.setHeader("Content-Type", "text/csv");
            res.setHeader(
                "Content-Disposition",
                'attachment; filename="results.csv"'
            );
            res.status(200).send(output);
        });
    } catch (err) {
        console.error("Export error:", err);
        res.status(500).json({ error: "Failed to export results" });
    }
});

router.get("/quiz-status", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('quizzes')
            .select('id, is_active')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is no rows
            throw error;
        }

        if (!data) {
            return res.json({ available: false });
        }

        res.json({ available: true, id: data.id, isActive: data.is_active });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch status" });
    }
});

router.post("/toggle-quiz", async (req, res) => {
    try {
        const { id, isActive } = req.body;

        const { error } = await supabase
            .from('quizzes')
            .update({ is_active: isActive })
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true, isActive });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Update failed" });
    }
});

// GET /api/admin/export-links
router.get("/export-links", async (req, res) => {
    try {
        const { data: students, error } = await supabase
            .from("students")
            .select("*");

        if (error) throw error;

        const records = students.map((s) => ({
            Name: s.name,
            Email: s.email,
            Link: `https://quiz-app-sage-ten-31.vercel.app/quiz/${s.token}`,
        }));

        stringify(records, { header: true }, (err, output) => {
            if (err) return res.status(500).json({ error: "CSV gen error" });

            res.setHeader("Content-Type", "text/csv");
            res.setHeader(
                "Content-Disposition",
                'attachment; filename="student_links.csv"'
            );
            res.status(200).send(output);
        });
    } catch (err) {
        console.error("Export links error:", err);
        res.status(500).json({ error: "Failed to export links" });
    }
});

// GET /api/admin/students - Fetch all students with submission status
router.get("/students", async (req, res) => {
    try {
        const { data: students, error } = await supabase
            .from("students")
            .select(
                `
                *,
                submissions (
                    score,
                    submitted_at
                )
            `
            )
            .order("created_at", { ascending: false });

        if (error) throw error;

        // Process data
        const detailedStudents = students.map((s) => {
            const sub =
                s.submissions && s.submissions.length > 0
                    ? s.submissions[0]
                    : null;
            return {
                id: s.id,
                name: s.name,
                email: s.email,
                token: s.token,
                link: `/quiz/${s.token}`,
                status: sub ? "Submitted" : "Pending",
                score: sub ? sub.score : "-",
                submittedAt: sub ? new Date(sub.submitted_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : null,
            };
        });

        res.json({ students: detailedStudents });
    } catch (err) {
        console.error("Fetch students error:", err);
        res.status(500).json({ error: "Failed to fetch students" });
    }
});

export default router;
