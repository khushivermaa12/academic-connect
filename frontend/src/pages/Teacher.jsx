// frontend/src/pages/Teacher.jsx
import React, { useEffect, useState } from 'react';
import API from '../api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Avatar from '../components/Avatar';
import { formatSlotDisplay } from '../utils/format';

export default function Teacher() {
  const [datetime, setDatetime] = useState(new Date());
  const [duration, setDuration] = useState(30);
  const [appts, setAppts] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [completedList, setCompletedList] = useState([]); // recent completed items
  const [loadingComplete, setLoadingComplete] = useState(false);

  useEffect(() => {
    loadAppointments();
    loadMySlots();
  }, []);

  async function loadAppointments() {
    setLoadingAppts(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const url = user?.user_id ? `/appointments/teacher?teacher_id=${user.user_id}` : '/appointments/teacher';
      const r = await API.get(url);
      setAppts(r.data || []);
    } catch (err) {
      console.error('Failed to load appointments', err);
      setAppts([]);
    } finally {
      setLoadingAppts(false);
    }
  }

  async function loadMySlots() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user?.user_id) return;
      const r = await API.get(`/slots/teacher/${user.user_id}`);
      setSlots(r.data || []);
    } catch (err) {
      console.error(err);
      setSlots([]);
    }
  }

  async function createSlot() {
    const d = datetime;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const slot_date = `${yyyy}-${mm}-${dd}`;

    const hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hr12 = ((hours + 11) % 12) + 1;
    const slot_time = `${hr12}:${minutes} ${ampm}`;

    try {
      const res = await API.post('/slots', { slot_date, slot_time, duration_minutes: Number(duration) });
      await loadMySlots();
      alert('Slot created: ' + (res.data.slot_id || 'ok'));
    } catch (err) {
      console.error(err);
      alert('Failed to create slot: ' + (err.response?.data?.error || err.message));
    }
  }

  async function approve(appointment_id) {
    try {
      // include teacher id so the server can verify ownership if needed
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const body = {};
      if (user?.user_id) body.teacher_id = user.user_id;

      await API.patch(`/appointments/${appointment_id}/approve`, body);
      await loadAppointments();
    } catch (err) {
      console.error(err);
      const errText = err.response?.data?.detail || err.response?.data?.error || err.message;
      alert('Failed to approve: ' + errText);
    }
  }

  async function reject(appointment_id) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const body = {};
      if (user?.user_id) body.teacher_id = user.user_id;

      await API.patch(`/appointments/${appointment_id}/reject`, body);
      await loadAppointments();
    } catch (err) {
      console.error(err);
      const errText = err.response?.data?.detail || err.response?.data?.error || err.message;
      alert('Failed to reject: ' + errText);
    }
  }

  // COMPLETE: delete appointment and its slot
  async function complete(appointment) {
    if (!window.confirm('Mark this appointment COMPLETE? This will delete the appointment and its slot for everyone.')) return;

    setLoadingComplete(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const body = {};
      if (user?.user_id) body.teacher_id = user.user_id;

      const res = await API.post(`/appointments/${appointment.appointment_id}/complete`, body);

      // remove appointment from list and slot from slots
      setAppts(prev => prev.filter(p => p.appointment_id !== appointment.appointment_id));
      setSlots(prev => prev.filter(s => s.slot_id !== appointment.slot_id));

      // add to completedList (client-side)
      const completedItem = {
        appointment_id: appointment.appointment_id,
        student_name: appointment.student_name,
        student_id: appointment.student_id,
        slot_date: appointment.slot_date,
        slot_time: appointment.slot_time,
        duration_minutes: appointment.duration_minutes,
        completed_at: new Date().toISOString()
      };
      setCompletedList(prev => [completedItem, ...prev].slice(0, 10));

      alert('Appointment completed and slot deleted.');
    } catch (err) {
      console.error('Failed to complete appointment', err);
      const errText = err.response?.data?.detail || err.response?.data?.error || err.message;
      alert('Failed to complete: ' + errText);
    } finally {
      setLoadingComplete(false);
    }
  }

  return (
    <div className="p-8">
      <div className="bg-gradient-to-r from-orange-500 to-orange-300 text-center py-6 rounded text-3xl font-bold mb-6">Teacher Dashboard</div>

      {/* Changed to 3 columns: create slot | requests & upcoming | completed + upcoming slots */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-xl font-semibold mb-3">Create Slot (Calendar + Clock)</h3>
          <div className="mb-3">
            <DatePicker
              selected={datetime}
              onChange={(d) => setDatetime(d)}
              showTimeSelect
              timeIntervals={15}
              timeCaption="Time"
              dateFormat="MMMM d, yyyy h:mm aa"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm mb-1">Selected date & time</label>
            <input className="p-2 rounded w-full text-black mb-2" value={datetime.toLocaleString()} readOnly />
            <label className="block text-sm mb-1">Duration (minutes)</label>
            <input value={duration} onChange={e => setDuration(e.target.value)} className="p-2 text-black rounded w-40" />
          </div>

          <div>
            <button className="button-blue" onClick={createSlot}>Create Slot</button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold mb-3">Appointment Requests</h3>
          {loadingAppts && <div className="text-gray-400">Loading...</div>}
          {!loadingAppts && appts.length === 0 && <div className="text-gray-400">No appointment requests yet</div>}

          <div className="space-y-4">
            {appts.map(a => (
              <div key={a.appointment_id} className="p-4 bg-[#02111b] rounded flex gap-4 items-start">
                <div className="flex-shrink-0">
                  <Avatar src={a.student_photo || null} name={a.student_name} size={64} />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold">{a.student_name}</div>
                      <div className="text-sm text-gray-300">ID: {a.student_id}</div>
                    </div>
                    <div className="text-sm text-gray-400">{a.status}</div>
                  </div>

                  <div className="text-sm text-gray-300 mt-2">{formatSlotDisplay(a.slot_date, a.slot_time)} — {a.duration_minutes} mins</div>
                  <div className="mt-2 text-sm">{a.reason}</div>

                  <div className="mt-3 flex gap-2">
                    {a.status === 'pending' && (
                      <>
                        <button onClick={() => approve(a.appointment_id)} className="px-3 py-2 bg-green-600 rounded text-white">Approve</button>
                        <button onClick={() => reject(a.appointment_id)} className="px-3 py-2 bg-red-600 rounded text-white">Reject</button>
                      </>
                    )}
                    {a.status === 'approved' && (
                      <button onClick={() => complete(a)} className="px-3 py-2 bg-blue-600 rounded text-white" disabled={loadingComplete}>
                        {loadingComplete ? 'Processing...' : 'Complete'}
                      </button>
                    )}
                    {a.status !== 'pending' && a.status !== 'approved' && <div className="text-sm text-gray-400">Status: {a.status}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h4 className="text-lg font-semibold mb-2">Your Upcoming Slots</h4>
            <div className="grid md:grid-cols-2 gap-3">
              {slots.map(s => (
                <div key={s.slot_id} className="p-3 bg-[#01121a] rounded">
                  <div className="font-semibold">{formatSlotDisplay(s.slot_date, s.slot_time)}</div>
                  <div className="text-sm">{s.slot_time} — {s.duration_minutes} mins</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* COLUMN 3: Completed box + (also show upcoming slots shortened) */}
        <div>
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-xl font-semibold">Completed</h3>
                <div className="text-sm text-gray-400">Recently completed appointments</div>
              </div>
              <div className="text-sm text-gray-400">{completedList.length}</div>
            </div>

            {completedList.length === 0 ? (
              <div className="text-gray-400">No completed appointments yet</div>
            ) : (
              <div className="space-y-3">
                {completedList.map(c => (
                  <div key={c.appointment_id} className="p-3 bg-[#0b1720] rounded flex gap-3 items-start">
                    <div>
                      <div className="font-semibold">{c.student_name}</div>
                      <div className="text-sm text-gray-300">ID: {c.student_id}</div>
                      <div className="text-sm text-gray-300 mt-1">{formatSlotDisplay(c.slot_date, c.slot_time)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h4 className="text-lg font-semibold mb-2">Your Upcoming Slots</h4>
            <div className="grid gap-3">
              {slots.length === 0 && <div className="text-gray-400">No upcoming slots</div>}
              {slots.map(s => (
                <div key={s.slot_id} className="p-3 bg-[#01121a] rounded">
                  <div className="font-semibold">{formatSlotDisplay(s.slot_date, s.slot_time)}</div>
                  <div className="text-sm">{s.slot_time} — {s.duration_minutes} mins</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
