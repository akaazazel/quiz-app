import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Admin from './components/Admin';
import Quiz from './components/Quiz';

function Landing() {
  return (
    <div className="container center" style={{ minHeight: '80vh' }}>
      <div className="card text-center" style={{ maxWidth: '400px' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Quiz App</h1>
        <p className="text-subtle mb-8">
          A simple, powerful platform for conducting quizzes.
        </p>
        <div className="stack">
            <Link to="/admin" className="btn btn-primary w-full">Admin Dashboard</Link>
        </div>
        <div style={{ marginTop: '2rem' }}>
          <p className="text-sm text-subtle">
            Students: Please check your email for your unique quiz link.
          </p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div style={{ padding: '2rem 0' }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/quiz/:token" element={<Quiz />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
