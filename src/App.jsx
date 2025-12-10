import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Admin from './components/Admin'
import Quiz from './components/Quiz'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="p-4"><h1>Quiz App</h1><p>Welcome! Please use your personalized link to enter.</p><a href="/admin">Admin Portal</a></div>} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/quiz/:token" element={<Quiz />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
