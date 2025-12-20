import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Registration() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        institution_type: "college", // default
        institution_name: "",
        class_grade: "",
        course: "",
        branch: "",
        semester: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || "/api";

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await axios.post(`${API_URL}/quiz/register`, formData);
            if (res.data.token) {
                navigate(`/quiz/${res.data.token}`);
            }
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.error ||
                    "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="container center"
            style={{ marginTop: "2rem", marginBottom: "4rem" }}
        >
            <div className="card" style={{ maxWidth: "600px", width: "100%" }}>
                <h1 style={{ marginBottom: "1.5rem", textAlign: "center" }}>
                    Registration
                </h1>
                <p style={{ textAlign: "center" }}>
                    Enter the same details if you have registered for the quiz
                </p>

                {error && (
                    <div
                        style={{
                            backgroundColor: "#fee2e2",
                            color: "#dc2626",
                            padding: "1rem",
                            borderRadius: "0.5rem",
                            marginBottom: "1rem",
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="stack">
                    <div className="form-group">
                        <label htmlFor="name" className="label">
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            className="input"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="eg: Eren Yeager"
                        />
                    </div>

                    <div
                        className="grid"
                        style={{ gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
                    >
                        <div className="form-group">
                            <label htmlFor="email" className="label">
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="input"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="eg: erenyeager@gmail.com"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="phone" className="label">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                className="input"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                placeholder="eg: 0246967670"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">I am a student at:</label>
                        <div
                            style={{
                                display: "flex",
                                gap: "1rem",
                                marginTop: "0.5rem",
                            }}
                        >
                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    cursor: "pointer",
                                }}
                            >
                                <input
                                    type="radio"
                                    name="institution_type"
                                    value="school"
                                    checked={
                                        formData.institution_type === "school"
                                    }
                                    onChange={handleChange}
                                />
                                School
                            </label>
                            <label
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    cursor: "pointer",
                                }}
                            >
                                <input
                                    type="radio"
                                    name="institution_type"
                                    value="college"
                                    checked={
                                        formData.institution_type === "college"
                                    }
                                    onChange={handleChange}
                                />
                                College
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="institution_name" className="label">
                            {formData.institution_type === "school"
                                ? "School Name"
                                : "College Name"}
                        </label>
                        <input
                            type="text"
                            id="institution_name"
                            name="institution_name"
                            className="input"
                            placeholder={
                                formData.institution_type === "school"
                                    ? ""
                                    : "eg: College of Engineering Paradis"
                            }
                            value={formData.institution_name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {formData.institution_type === "school" && (
                        <div className="form-group">
                            <label htmlFor="class_grade" className="label">
                                Class / Grade
                            </label>
                            <input
                                type="text"
                                id="class_grade"
                                name="class_grade"
                                className="input"
                                value={formData.class_grade}
                                onChange={handleChange}
                                required
                                placeholder="eg: 12th"
                            />
                        </div>
                    )}

                    {formData.institution_type === "college" && (
                        <div className="stack">
                            <div
                                className="grid"
                                style={{
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "1rem",
                                }}
                            >
                                <div className="form-group">
                                    <label htmlFor="course" className="label">
                                        Course
                                    </label>
                                    <input
                                        type="text"
                                        id="course"
                                        name="course"
                                        className="input"
                                        value={formData.course}
                                        onChange={handleChange}
                                        required
                                        placeholder="eg: B.Tech, MCA"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="branch" className="label">
                                        Branch
                                    </label>
                                    <input
                                        type="text"
                                        id="branch"
                                        name="branch"
                                        className="input"
                                        value={formData.branch}
                                        onChange={handleChange}
                                        required
                                        placeholder="eg: Computer Science"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="semester" className="label">
                                    Semester
                                </label>
                                <input
                                    type="text"
                                    id="semester"
                                    name="semester"
                                    className="input"
                                    value={formData.semester}
                                    onChange={handleChange}
                                    required
                                    placeholder="eg: 1, 5"
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={loading}
                        style={{ marginTop: "1rem" }}
                    >
                        {loading ? "Registering..." : "Start Quiz"}
                    </button>
                </form>
            </div>
        </div>
    );
}
