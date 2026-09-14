// frontend/src/pages/Student.jsx
import React, { useEffect, useState } from 'react';
import API from '../api';
import Avatar from '../components/Avatar';
import SlotModal from '../components/SlotModal';
import { formatSlotDisplay } from '../utils/format';

export default function Student() {
  const [teachers, setTeachers] = useState([]);
  const [activeTeacher, setActiveTeacher] = useState(null);
  const [slots, setSlots] = useState([]);
  const [modalSlot, setModalSlot] = useState(null);
  const [myAppointments, setMyAppointments] = useState([]);

  useEffect(() => {
    loadTeachers();
    loadMyAppointments();
  }, []);

  async function loadTeachers() {
    try {
      const r = await API.get('/slots/teachers');
      setTeachers(r.data || []);
    } catch (err) {
      console.error('Failed to load teachers', err);
    }
  }

  async function loadMyAppointments() {
    try {
      // prefer logged in user id from localStorage to fetch student appointments
      let student_id = null;
      try {
        const u = JSON.parse(localStorage.getItem('user') || 'null');
        if (u && u.user_id) student_id = u.user_id;
      } catch {}

      const url = student_id ? `/appointments/student?student_id=${student_id}` : '/appointments/student';
      const r = await API.get(url);
      setMyAppointments(r.data || []);
    } catch (err) {
      console.error('Failed to load appointments', err);
    }
  }

  async function openTeacher(teacher) {
    setActiveTeacher(teacher);
    try {
      const r = await API.get(`/slots/teacher/${teacher.user_id}`);
      setSlots(r.data || []);
    } catch (err) {
      console.error(err);
      setSlots([]);
    }
  }

  function openBookModal(slot) { setModalSlot(slot); }

  function afterBooked() {
    if (activeTeacher) openTeacher(activeTeacher);
    loadMyAppointments();
  }

  return (
    <div className="p-8">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-center py-6 rounded text-3xl font-bold mb-6">Student Dashboard</div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Teachers list */}
        <div className="md:col-span-1">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">All Teachers</h3>
            <div className="space-y-3">
              {teachers.map(t => (
                <div key={t.user_id} className={`flex items-center gap-3 p-2 rounded cursor-pointer ${activeTeacher?.user_id === t.user_id ? 'bg-[#02111b]' : 'hover:bg-[#02111b]'}`} onClick={() => openTeacher(t)}>
                  <Avatar src={t.photo_path} name={t.name} size={56} />
                  <div>
                    <div className="font-bold">{t.name}</div>
                    <div className="text-sm text-gray-300">{t.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slots & My appointments */}
        <div className="md:col-span-2 space-y-4">
          <div className="card">
            <h3 className="text-xl font-semibold mb-3">{activeTeacher ? `Slots for ${activeTeacher.name}` : 'Select a teacher to view slots'}</h3>

            {!activeTeacher && <div className="text-gray-400">Click a teacher on the left to see all their available slots.</div>}

            {activeTeacher && slots.length === 0 && <div className="text-gray-400">No slots available.</div>}

            {activeTeacher && slots.length > 0 && (
              <div className="space-y-3">
                {slots.map(s => (
                  <div key={s.slot_id} className="flex items-center justify-between p-3 bg-[#02111b] rounded">
                    <div>
                      <div className="font-semibold">{formatSlotDisplay(s.slot_date, s.slot_time)}</div>
                      <div className="text-sm text-gray-300">Duration: {s.duration_minutes} mins — Slot ID: {s.slot_id}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-2 bg-green-600 rounded text-white" onClick={() => openBookModal(s)}>Book</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-3">Your Upcoming Appointments</h3>
            {myAppointments.length === 0 && <div className="text-gray-400">You have no upcoming appointments.</div>}
            <div className="space-y-3">
              {myAppointments.map(a => (
                <div key={a.appointment_id} className="flex items-center gap-4 p-3 bg-[#02111b] rounded">
                  <div className="flex-shrink-0">
                    <Avatar src={a.teacher_photo || null} name={a.teacher_name} size={56} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{a.teacher_name}</div>
                    <div className="text-sm text-gray-300">{formatSlotDisplay(a.slot_date, a.slot_time)}</div>
                    <div className="text-sm text-gray-300 mt-1">Status: {a.status}</div>
                    <div className="text-sm mt-1">{a.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <SlotModal
        open={!!modalSlot}
        onClose={() => setModalSlot(null)}
        slot={modalSlot}
        onBooked={afterBooked}
      />
    </div>
  );
}
