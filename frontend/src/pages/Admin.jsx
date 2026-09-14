// frontend/src/pages/Admin.jsx
import React, { useEffect, useState } from 'react';
import API from '../api';
import Avatar from '../components/Avatar';

export default function Admin() {
  const [stats, setStats] = useState({ teachers:0, students:0, appointments:0 });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const t = await API.get('/admin/stats');
        const u = await API.get('/admin/users');
        setStats(t.data);
        setUsers(u.data);
      } catch (err) {
        console.error(err);
        alert('Unauthorized or error');
      }
    })();
  }, []);

  return (
    <div className="p-8">
      <div className="bg-gradient-to-r from-orange-500 to-orange-300 text-center py-6 rounded text-3xl font-bold mb-6">Admin Dashboard</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card text-center py-6"><div className="text-3xl font-bold">{stats.teachers}</div><div>Teachers</div></div>
        <div className="card text-center py-6"><div className="text-3xl font-bold">{stats.students}</div><div>Students</div></div>
        <div className="card text-center py-6"><div className="text-3xl font-bold">{stats.appointments}</div><div>Appointments</div></div>
      </div>

      <div className="card">
        <h3 className="text-xl font-semibold mb-3">All Users</h3>
        <table className="w-full text-left">
          <thead><tr><th>Photo</th><th>Name</th><th>Email</th><th>Role</th></tr></thead>
          <tbody>
            {users.map(u => <tr key={u.user_id} className="border-t border-gray-800">
              <td className="p-2"><Avatar src={u.photo_path} name={u.name} size={48} /></td>
              <td className="p-2">{u.name}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.role}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
