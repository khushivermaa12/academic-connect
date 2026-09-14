// frontend/src/components/SlotModal.jsx
import React, { useState } from 'react';
import API from '../api';
import { formatSlotDisplay } from '../utils/format';

export default function SlotModal({ open, onClose, slot, onBooked }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!open || !slot) return null;

  async function book() {
    setError(null);
    if (!reason.trim()) { setError('Please enter a reason'); return; }
    setLoading(true);
    try {
      let student_id = null;
      try {
        const u = JSON.parse(localStorage.getItem('user') || 'null');
        if (u && u.user_id) student_id = u.user_id;
      } catch {}

      const payload = { slot_id: slot.slot_id, reason };
      if (student_id) payload.student_id = student_id;

      const res = await API.post('/appointments/book', payload);
      setLoading(false);
      setReason('');
      onBooked(res.data.appointment_id);
      onClose();
    } catch (err) {
      setLoading(false);
      // Prefer server-provided message
      const serverError = err.response?.data?.detail || err.response?.data?.error || err.message;
      // handle known statuses
      if (err.response?.status === 409) {
        setError(serverError || 'Slot is already booked.');
        return;
      }
      if (err.response?.status === 400 && String(serverError).toLowerCase().includes('student_id')) {
        setError('You must be logged in to book. Please login and try again.');
        return;
      }
      setError(serverError || 'Failed to book appointment');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#071226] rounded-lg w-[420px] p-6">
        <h3 className="text-xl font-bold mb-2">Book Slot</h3>

        <div className="mb-3 text-sm text-gray-300">
          {formatSlotDisplay(slot.slot_date, slot.slot_time)}
        </div>

        <label className="block text-sm text-gray-200 mb-1">Reason</label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          className="w-full p-2 rounded text-black"
          rows={4}
          placeholder="Enter short reason for the meeting..."
        />

        {error && <div className="text-red-400 mt-2">{error}</div>}

        <div className="flex items-center justify-end gap-2 mt-4">
          <button className="px-3 py-2 rounded border border-gray-600" onClick={() => { setReason(''); onClose(); }}>Cancel</button>
          <button onClick={book} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded">
            {loading ? 'Booking...' : 'Book'}
          </button>
        </div>
      </div>
    </div>
  );
}
