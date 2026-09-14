// frontend/src/pages/Register.jsx
import React, {useState} from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';

export default function Register(){
  const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [role,setRole]=useState('student'); const [photo,setPhoto]=useState(null);
  const [err,setErr]=useState(null);
  const nav = useNavigate();

  async function submit(){
    try{
      const fd = new FormData();
      fd.append('name', name); fd.append('email', email); fd.append('password', password); fd.append('role', role);
      if (photo) fd.append('photo', photo);
      await API.post('/auth/register', fd, { headers: { 'Content-Type': 'multipart/form-data' }});
      alert('Registered. Login now.');
      nav('/login');
    }catch(e){ setErr(e.response?.data?.error || e.message); }
  }

  return <div className="min-h-screen flex items-center justify-center">
    <div className="card w-full max-w-lg">
      <h2 className="text-2xl font-bold text-center mb-4">Create Account</h2>
      <div className="bg-gradient-to-r from-orange-500 to-orange-300 text-center py-3 rounded mb-4 text-lg font-bold">Create Account</div>
      <input className="w-full p-2 rounded mb-2 text-black" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />
      <input className="w-full p-2 rounded mb-2 text-black" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input type="password" className="w-full p-2 rounded mb-2 text-black" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
      <select className="w-full p-2 rounded mb-2 text-black" value={role} onChange={e=>setRole(e.target.value)}>
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
      </select>
      <input type="file" className="mb-2" onChange={e=>setPhoto(e.target.files[0])} />
      <button className="button-blue w-full" onClick={submit}>Register</button>
      {err && <div className="mt-2 text-red-400">{err}</div>}
    </div>
  </div>
}
