// frontend/src/main.jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './styles.css'
import Login from './pages/Login'
import Register from './pages/Register'
import Student from './pages/Student'
import Teacher from './pages/Teacher'
import Admin from './pages/Admin'

function App(){
  return <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to='/login' replace />} />
      <Route path="/login" element={<Login/>} />
      <Route path="/register" element={<Register/>} />
      <Route path="/student" element={<Student/>} />
      <Route path="/teacher" element={<Teacher/>} />
      <Route path="/admin" element={<Admin/>} />
    </Routes>
  </BrowserRouter>
}

createRoot(document.getElementById('root')).render(<App />)
