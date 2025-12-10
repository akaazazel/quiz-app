import { useState } from 'react';
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

  // Helper to send auth header
  const getAuthHeader = () => ({ headers: { 'x-admin-password': password } });

  const handleLogin = async () => {
      setLoading(true);
      try {
          // Just test a route or call a specific login route
          await axios.post('/api/admin/login', {}, getAuthHeader());
          setAuthenticated(true);
          setMessage('');
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
            setGeneratedLinks(res.data.students);
            setMessage('Students uploaded and links generated!');
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
          setGeneratedLinks([]);
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
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1>Admin Dashboard</h1>
        <div className="flex gap-2">
            <button onClick={handleExport} className="bg-green-600 hover:bg-green-700">Export Results</button>
            <button onClick={handleReset} className="bg-red-600 hover:bg-red-700">Reset Database</button>
        </div>
      </div>

      {message && <div className="p-3 mb-4 bg-blue-100 text-blue-800 rounded">{message}</div>}

      <div className="mb-8 p-6 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">1. Upload Quiz (JSON)</h2>
        <div className="flex gap-2">
            <input type="file" accept=".json" onChange={handleJsonChange} />
            <button onClick={uploadQuestions} disabled={loading}>
                {loading ? 'Uploading...' : 'Upload Questions'}
            </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
            JSON format: <code>{`{ "title": "...", "questions": [...] }`}</code>
        </p>
      </div>

      <div className="mb-8 p-6 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">2. Upload Students (CSV)</h2>
        <div className="flex gap-2">
            <input type="file" accept=".csv" onChange={handleCsvChange} />
            <button onClick={uploadStudents} disabled={loading}>
                {loading ? 'Processing...' : 'Generate Links'}
            </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
            CSV format: <code>name,email</code>
        </p>
      </div>

      {generatedLinks.length > 0 && (
        <div className="p-6 bg-white rounded shadow">
            <h2 className="text-xl font-bold mb-4">Generated Links</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                    <thead>
                        <tr className="border-b">
                            <th className="p-2">Name</th>
                            <th className="p-2">Email</th>
                            <th className="p-2">Link</th>
                        </tr>
                    </thead>
                    <tbody>
                        {generatedLinks.map((s) => (
                            <tr key={s.id} className="border-b">
                                <td className="p-2">{s.name}</td>
                                <td className="p-2">{s.email}</td>
                                <td className="p-2">
                                    <a href={s.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                        {window.location.origin}{s.link}
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
