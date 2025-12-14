import { useState, useEffect } from "react";
import axios from "axios";

// Icons
import { RefreshCcw, Download, Upload, Trash, Loader2 } from "lucide-react";

const Admin = () => {
    // Auth State
    const [password, setPassword] = useState("");
    const [authenticated, setAuthenticated] = useState(false);

    // App State
    const [jsonFile, setJsonFile] = useState(null);
    const [csvFile, setCsvFile] = useState(null);
    const [message, setMessage] = useState("");
    const [studentList, setStudentList] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [quizActive, setQuizActive] = useState(null);
    const [quizId, setQuizId] = useState(null);

    // Helper to send auth header
    const getAuthHeader = () => ({ headers: { "x-admin-password": password } });

    const fetchStudents = async () => {
        try {
            const res = await axios.get("/api/admin/students", getAuthHeader());
            setStudentList(res.data.students);
        } catch (err) {
            console.error("Failed to fetch students", err);
        }
    };

    const fetchQuizStatus = async () => {
        try {
            const res = await axios.get(
                "/api/admin/quiz-status",
                getAuthHeader()
            );
            if (res.data.available) {
                setQuizId(res.data.id);
                setQuizActive(res.data.isActive);
            }
        } catch (err) {
            console.error("Failed to fetch quiz status", err);
        }
    };

    useEffect(() => {
        if (authenticated) {
            fetchStudents();
            fetchQuizStatus();
        }
    }, [authenticated]);

    const handleLogin = async () => {
        setLoading(true);
        try {
            await axios.post("/api/admin/login", {}, getAuthHeader());
            setAuthenticated(true);
            setMessage("");
        } catch (err) {
            setMessage("Invalid Password");
        } finally {
            setLoading(false);
        }
    };

    const handleJsonChange = (e) => {
        setJsonFile(e.target.files[0]);
    };

    const handleCsvChange = (e) => {
        setCsvFile(e.target.files[0]);
    };

    const uploadQuestions = async () => {
        if (!jsonFile) {
            setMessage("Please select a JSON file first.");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const jsonContent = JSON.parse(e.target.result);
                setLoading(true);
                let payload = {};
                if (Array.isArray(jsonContent)) {
                    payload = {
                        title: "Uploaded Quiz",
                        questions: jsonContent,
                    };
                } else {
                    payload = jsonContent;
                }

                await axios.post(
                    "/api/admin/questions",
                    payload,
                    getAuthHeader()
                );
                setMessage("Questions uploaded successfully!");
            } catch (err) {
                console.error(err);
                setMessage(
                    "Error uploading questions: " +
                        (err.response?.data?.error || err.message)
                );
            } finally {
                setLoading(false);
            }
        };
        reader.readAsText(jsonFile);
    };

    const uploadStudents = async () => {
        if (!csvFile) {
            setMessage("Please select a CSV file first.");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                setLoading(true);
                const csvContent = e.target.result;
                await axios.post(
                    "/api/admin/students",
                    { csvContent },
                    getAuthHeader()
                );
                setMessage("Students uploaded and links generated!");
                fetchStudents();
            } catch (err) {
                console.error(err);
                setMessage(
                    "Error uploading students: " +
                        (err.response?.data?.error || err.message)
                );
            } finally {
                setLoading(false);
            }
        };
        reader.readAsText(csvFile);
    };

    const handleDeleteQuiz = async () => {
        if (
            !confirm(
                "ARE YOU SURE? This will delete the active QUIZ and QUESTIONS. Students and Submissions will remain."
            )
        )
            return;

        setLoading(true);
        try {
            await axios.delete("/api/admin/quiz", getAuthHeader());
            setMessage("Quiz deleted successfully.");
            setQuizActive(false);
            setQuizId(null);
            fetchQuizStatus();
        } catch (err) {
            setMessage(
                "Delete failed: " + (err.response?.data?.error || err.message)
            );
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const res = await axios.get("/api/admin/export", {
                ...getAuthHeader(),
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "results.csv");
            document.body.appendChild(link);
            link.click();
        } catch (err) {
            setMessage("Export failed: " + err.message);
        }
    };

    const handleExportLinks = async () => {
        try {
            const res = await axios.get("/api/admin/export-links", {
                ...getAuthHeader(),
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "student_links.csv");
            document.body.appendChild(link);
            link.click();
        } catch (err) {
            setMessage("Export links failed: " + err.message);
        }
    };

    const handleToggleQuiz = async () => {
        if (!quizId) return;
        try {
            const newStatus = !quizActive;
            await axios.post(
                "/api/admin/toggle-quiz",
                { id: quizId, isActive: newStatus },
                getAuthHeader()
            );
            setQuizActive(newStatus);
            setMessage(`Quiz is now ${newStatus ? "ENABLED" : "DISABLED"}`);
        } catch (err) {
            console.error(err);
            setMessage("Failed to toggle quiz");
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(studentList.map((s) => s.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectStudent = (id) => {
        setSelectedIds((prev) => {
            if (prev.includes(id)) {
                return prev.filter((pid) => pid !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (
            !confirm(
                `Are you sure you want to delete ${selectedIds.length} students?`
            )
        )
            return;

        setLoading(true);
        try {
            // axios.delete with body requires 'data' key
            await axios.delete("/api/admin/students", {
                ...getAuthHeader(),
                data: { ids: selectedIds },
            });
            setMessage("Students deleted successfully.");
            setSelectedIds([]);
            fetchStudents();
        } catch (err) {
            console.error(err);
            setMessage("Delete failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!authenticated) {
        return (
            <div className="container center" style={{ marginTop: "10vh" }}>
                <div
                    className="card"
                    style={{ maxWidth: "400px", width: "100%" }}
                >
                    <h1 className="text-center" style={{ fontSize: "1.5rem" }}>
                        Admin Access
                    </h1>
                    <div className="stack">
                        <input
                            type="password"
                            placeholder="Enter Admin Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input"
                        />
                        <button
                            onClick={handleLogin}
                            disabled={loading}
                            className="btn btn-primary w-full"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                "Login"
                            )}
                        </button>
                        {message && (
                            <p className="text-error text-center text-sm">
                                {message}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="row justify-between mb-8">
                <h1>Admin Dashboard</h1>
                <div className="row">
                    <button
                        onClick={() => {
                            fetchStudents();
                            fetchQuizStatus();
                        }}
                        className="btn btn-secondary"
                        title="Refresh Data"
                    >
                        <RefreshCcw size={16} />
                    </button>
                    <button
                        onClick={handleExport}
                        className="btn btn-secondary"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                        }}
                    >
                        <Download size={16} /> {"Result"}
                    </button>
                    <button
                        onClick={handleExportLinks}
                        className="btn btn-secondary"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                        }}
                    >
                        <Download size={16} /> {"Links"}
                    </button>
                    <button
                        onClick={handleDeleteQuiz}
                        className="btn btn-danger"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                        }}
                        title="Delete Quiz Only"
                    >
                        <Trash size={16} /> {"Quiz"}
                    </button>
                </div>
            </div>

            {message && (
                <div
                    className="card mb-4"
                    style={{
                        backgroundColor: "var(--accents-1)",
                        border: "none",
                    }}
                >
                    {message}
                </div>
            )}

            {quizId && (
                <div
                    className="card mb-8"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div>
                        <h2 style={{ margin: 0, fontSize: "1.25rem" }}>
                            Quiz Status:{" "}
                            <span
                                style={{ color: quizActive ? "green" : "red" }}
                            >
                                {quizActive ? "ACTIVE" : "DISABLED"}
                            </span>
                        </h2>
                        <p
                            className="text-subtle text-sm"
                            style={{ margin: "0.5rem 0 0 0" }}
                        >
                            {quizActive
                                ? "Students can access and take the quiz."
                                : "The quiz is currently locked. Students cannot enter."}
                        </p>
                    </div>
                    <button
                        onClick={handleToggleQuiz}
                        className={`btn ${
                            quizActive ? "btn-danger" : "btn-primary"
                        }`}
                        style={{ padding: "0.75rem 1.5rem", fontSize: "1rem" }}
                    >
                        {quizActive ? "Disable" : "Enable"}
                    </button>
                </div>
            )}

            <div className="grid grid-2 mb-8">
                <div className="card">
                    <h2 style={{ fontSize: "1.25rem" }}>1. Upload Quiz</h2>
                    <p className="text-subtle text-sm mb-4">
                        Upload a JSON file containing the questions.
                    </p>
                    <div className="row">
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleJsonChange}
                            className="input"
                            style={{ flex: 1 }}
                        />
                        <button
                            onClick={uploadQuestions}
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                <Upload size={16} />
                            )}
                        </button>
                    </div>
                </div>

                <div className="card">
                    <h2 style={{ fontSize: "1.25rem" }}>2. Upload Students</h2>
                    <p className="text-subtle text-sm mb-4">
                        Upload a CSV file (name, email) to generate links.
                    </p>
                    <div className="row">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleCsvChange}
                            className="input"
                            style={{ flex: 1 }}
                        />
                        <button
                            onClick={uploadStudents}
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                <Upload size={16} />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="card">
                <div
                    className="card-header"
                    style={{ display: "flex", justifyContent: "space-between" }}
                >
                    <h2 className="mb-4" style={{ fontSize: "1.25rem" }}>
                        Student Progress
                    </h2>
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="btn btn-danger"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                            }}
                        >
                            <Trash size={16} /> ({selectedIds.length})
                        </button>
                    )}
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: "40px" }}>
                                    <input
                                        type="checkbox"
                                        onChange={handleSelectAll}
                                        checked={
                                            studentList.length > 0 &&
                                            selectedIds.length ===
                                                studentList.length
                                        }
                                    />
                                </th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Score</th>
                                <th>Link</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studentList.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="text-center text-subtle"
                                        style={{ padding: "2rem" }}
                                    >
                                        No data available. Upload students to
                                        begin.
                                    </td>
                                </tr>
                            ) : (
                                studentList.map((s) => (
                                    <tr key={s.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(
                                                    s.id
                                                )}
                                                onChange={() =>
                                                    handleSelectStudent(s.id)
                                                }
                                            />
                                        </td>
                                        <td>
                                            <strong>{s.name}</strong>
                                        </td>
                                        <td className="text-subtle">
                                            {s.email}
                                        </td>
                                        <td>
                                            <span
                                                className={`badge ${
                                                    s.status === "Submitted"
                                                        ? "badge-success"
                                                        : "badge-warning"
                                                }`}
                                            >
                                                {s.status}
                                            </span>
                                        </td>
                                        <td>{s.score}</td>
                                        <td>
                                            <a
                                                href={s.link}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                View Link
                                            </a>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Admin;
