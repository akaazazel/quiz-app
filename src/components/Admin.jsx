import { useState } from 'react';
import axios from 'axios';

const Admin = () => {
  const [jsonFile, setJsonFile] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [message, setMessage] = useState('');
  const [generatedLinks, setGeneratedLinks] = useState([]);
  const [loading, setLoading] = useState(false);

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
        // Assuming title is inside JSON or we send a generic one
        // The backend expects { title, questions }
        // If the JSON is just an array of questions, we wrap it.
        let payload = {};
        if (Array.isArray(jsonContent)) {
            payload = { title: "Uploaded Quiz", questions: jsonContent };
        } else {
            payload = jsonContent;
        }

        await axios.post('/api/admin/questions', payload);
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
            const res = await axios.post('/api/admin/students', { csvContent });
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

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1>Admin Dashboard</h1>
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
