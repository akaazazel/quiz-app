import { useState, useEffect } from 'react';
import axios from 'axios';

const Admin = () => {
  // Auth State
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  // App State
  const [jsonFile, setJsonFile] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [message, setMessage] = useState('');
  const [generatedLinks, setGeneratedLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentList, setStudentList] = useState([]);

  // Fetch students function
  const fetchStudents = async () => {
      try {
          const res = await axios.get('/api/admin/students', getAuthHeader());
          setStudentList(res.data.students);
      } catch (err) {
          console.error('Failed to fetch students', err);
      }
  };

  // Load students when authenticated
  useEffect(() => {
    if (authenticated) {
      fetchStudents();
    }
  }, [authenticated]);

  // Helper to send auth header
  const getAuthHeader = () => ({ headers: { 'x-admin-password': password } });

  const handleLogin = async () => {
      setLoading(true);
      try {
          // Just test a route or call a specific login route
          await axios.post('/api/admin/login', {}, getAuthHeader());
          setAuthenticated(true);
          setMessage('');
          fetchStudents(); // Fetch immediately
      } catch (err) {
          setMessage('Invalid Password');
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
      setMessage('Please select a JSON file first.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonContent = JSON.parse(e.target.result);
        setLoading(true);
        let payload = {};
        if (Array.isArray(jsonContent)) {
            payload = { title: "Uploaded Quiz", questions: jsonContent };
        } else {
            payload = jsonContent;
        }

        await axios.post('/api/admin/questions', payload, getAuthHeader());
        setMessage('Questions uploaded successfully!');
      } catch (err) {
        console.error(err);
        setMessage('Error uploading questions: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(jsonFile);
  };

  const uploadStudents = async () => {
    if (!csvFile) {
        setMessage('Please select a CSV file first.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            setLoading(true);
            const csvContent = e.target.result;
            const res = await axios.post('/api/admin/students', { csvContent }, getAuthHeader());
            setMessage('Students uploaded and links generated!');
            fetchStudents(); // Refresh list
        } catch (err) {
            console.error(err);
            setMessage('Error uploading students: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };
    reader.readAsText(csvFile);
  };

  const handleReset = async () => {
      if (!confirm('ARE YOU SURE? This will delete ALL data (students, quizzes, submissions).')) return;

      setLoading(true);
      try {
          await axios.delete('/api/admin/reset', getAuthHeader());
          setMessage('Database reset successfully.');
          setStudentList([]); // Clear list
      } catch (err) {
          setMessage('Reset failed: ' + err.message);
      } finally {
          setLoading(false);
      }
  };

  const handleExport = async () => {
      try {
          const res = await axios.get('/api/admin/export', {
              ...getAuthHeader(),
              responseType: 'blob'
          });
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', 'results.csv');
          document.body.appendChild(link);
          link.click();
      } catch (err) {
          setMessage('Export failed: ' + err.message);
      }
  };

  const handleExportLinks = async () => {
      try {
          const res = await axios.get('/api/admin/export-links', {
              ...getAuthHeader(),
              responseType: 'blob'
          });
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', 'student_links.csv');
          document.body.appendChild(link);
          link.click();
      } catch (err) {
          setMessage('Export links failed: ' + err.message);
      }
  };

  if (!authenticated) {
      return (
          <div className="p-4 max-w-md mx-auto mt-20 bg-white shadow rounded">
              <h1 className="text-xl font-bold mb-4">Admin Login</h1>
              <input
                type="password"
                placeholder="Enter Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mb-4"
              />
              <button onClick={handleLogin} disabled={loading} className="w-full">
                  {loading ? 'Checking...' : 'Login'}
              </button>
              {message && <p className="text-red-500 mt-2">{message}</p>}
          </div>
      );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1>Admin Dashboard</h1>
        <div className="flex gap-2">
            <button onClick={() => fetchStudents()} className="bg-gray-500 hover:bg-gray-600">Refresh</button>
            <button onClick={handleExport} className="bg-green-600 hover:bg-green-700">Export Results</button>
            <button onClick={handleExportLinks} className="bg-blue-600 hover:bg-blue-700">Export Links</button>
            <button onClick={handleReset} className="bg-red-600 hover:bg-red-700">Reset Database</button>
        </div>
      </div>

      {message && <div className="p-3 mb-4 bg-blue-100 text-blue-800 rounded">{message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4">1. Upload Quiz (JSON)</h2>
            <div className="flex gap-2">
                <input type="file" accept=".json" onChange={handleJsonChange} />
                <button onClick={uploadQuestions} disabled={loading}>
                    {loading ? 'Uploading...' : 'Upload'}
                </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">Format: <code>{`{ "title": "...", "questions": [...] }`}</code></p>
        </div>

        <div className="p-6 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4">2. Upload Students (CSV)</h2>
            <div className="flex gap-2">
                <input type="file" accept=".csv" onChange={handleCsvChange} />
                <button onClick={uploadStudents} disabled={loading}>
                    {loading ? 'Processing...' : 'Upload'}
                </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">Format: <code>name,email</code></p>
        </div>
      </div>

      <div className="p-6 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">Student List & Progress</h2>
        <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
                <thead>
                    <tr className="border-b bg-gray-50">
                        <th className="p-3">Name</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Score</th>
                        <th className="p-3">Link</th>
                    </tr>
                </thead>
                <tbody>
                    {studentList.length === 0 ? (
                        <tr><td colSpan="5" className="p-4 text-center text-gray-500">No students found.</td></tr>
                    ) : (
                        studentList.map((s) => (
                            <tr key={s.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 font-medium">{s.name}</td>
                                <td className="p-3">{s.email}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs text-white ${s.status === 'Submitted' ? 'bg-green-500' : 'bg-yellow-500'}`}>
                                        {s.status}
                                    </span>
                                </td>
                                <td className="p-3 font-bold">{s.score}</td>
                                <td className="p-3">
                                    <a href={s.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                        Link
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
