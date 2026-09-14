// frontend/src/pages/Login.jsx
import React, {useState} from 'react'
import API from '../api';
import { useNavigate } from 'react-router-dom';

export default function Login(){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [err,setErr]=useState(null);
  const nav = useNavigate();
  async function submit(){
    try{
      const r = await API.post('/auth/login', { email, password });
      localStorage.setItem('token', r.data.token);
      localStorage.setItem('user', JSON.stringify(r.data.user));
      if (r.data.user.role === 'teacher') nav('/teacher');
      else if (r.data.user.role === 'admin') nav('/admin');
      else nav('/student');
    }catch(e){ setErr(e.response?.data?.error || e.message); }
  }
  return <div className="min-h-screen flex items-center justify-center">
    <div className="card w-full max-w-md">
      <h1 className="text-3xl font-bold text-center text-white mb-4">Academic Connect</h1>
      <div className="bg-gradient-to-r from-orange-500 to-orange-300 text-center py-4 rounded mb-4 text-xl font-bold">Welcome</div>
      <input className="w-full p-2 rounded mb-2 text-black" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input type="password" className="w-full p-2 rounded mb-2 text-black" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button className="button-blue w-full" onClick={submit}>Login</button>
      <div className="mt-4 text-center"><a className="text-blue-300" href="/register">Register</a></div>
      {err && <div className="mt-2 text-red-400">{err}</div>}
    </div>
  </div>
}
