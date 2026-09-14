// backend/src/appointments.js
const express = require('express');
const router = express.Router();
const { pool } = require('./db'); // must export Pool in db.js

router.post('/book', async (req, res) => {
  try {
    const student_id = (req.user && req.user.user_id) || req.body.student_id;
    if (!student_id)
      return res
        .status(400)
        .json({ error: 'student_id missing. Please login or provide student_id.' });

    const { slot_id, reason } = req.body;
    if (!slot_id) return res.status(400).json({ error: 'slot_id required' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lock slot 
      const slotRes = await client.query('SELECT * FROM slots WHERE slot_id = $1 FOR UPDATE', [slot_id]);
      if (slotRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Slot not found' });
      }

      const slotRow = slotRes.rows[0];
      const teacher_id = slotRow.teacher_id;

      // Insert appointment (teacher_id pulled from slot)
      const insertText = `
        INSERT INTO appointments (slot_id, teacher_id, student_id, reason, status, created_at)
        VALUES ($1, $2, $3, $4, 'pending', now())
        RETURNING appointment_id, slot_id, teacher_id, student_id, status
      `;
      try {
        const r = await client.query(insertText, [slot_id, teacher_id, student_id, reason || null]);
        await client.query('COMMIT');
        return res.json({
          appointment_id: r.rows[0].appointment_id,
          slot_id: r.rows[0].slot_id,
          teacher_id: r.rows[0].teacher_id,
          student_id: r.rows[0].student_id,
          status: r.rows[0].status
        });
      } catch (err) {
        await client.query('ROLLBACK');
        console.error('DB insert error (book):', err);
        const detail = err.detail || err.message || 'DB insert failed';
        if (err.code === '23505')
          return res.status(409).json({ error: 'Slot is already booked', detail });
        return res.status(500).json({ error: 'Failed to book appointment', detail });
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Server error in /appointments/book:', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

router.patch('/:id/approve', async (req, res) => {
  const apptId = req.params.id;
  try {
    const teacherFromReq =
      (req.user && req.user.user_id) || req.body.teacher_id || req.query.teacher_id;

    // Check appointment existence
    const findQ = 'SELECT * FROM appointments WHERE appointment_id = $1';
    const found = await pool.query(findQ, [apptId]);
    if (found.rowCount === 0)
      return res.status(404).json({ error: 'Appointment not found' });

    const appt = found.rows[0];
    if (teacherFromReq && String(appt.teacher_id) !== String(teacherFromReq))
      return res
        .status(403)
        .json({ error: 'Forbidden: appointment does not belong to this teacher' });

    const q = `UPDATE appointments SET status=$1 WHERE appointment_id=$2 RETURNING *`;
    const r = await pool.query(q, ['approved', apptId]);
    if (r.rowCount === 0)
      return res.status(500).json({ error: 'Failed to approve' });
    res.json({ ok: true, appointment: r.rows[0] });
  } catch (err) {
    console.error('Error approving appointment', err);
    res.status(500).json({ error: 'Failed to approve', detail: err.message });
  }
});

router.patch('/:id/reject', async (req, res) => {
  const apptId = req.params.id;
  try {
    const teacherFromReq =
      (req.user && req.user.user_id) || req.body.teacher_id || req.query.teacher_id;

    const findQ = 'SELECT * FROM appointments WHERE appointment_id = $1';
    const found = await pool.query(findQ, [apptId]);
    if (found.rowCount === 0)
      return res.status(404).json({ error: 'Appointment not found' });

    const appt = found.rows[0];
    if (teacherFromReq && String(appt.teacher_id) !== String(teacherFromReq))
      return res
        .status(403)
        .json({ error: 'Forbidden: appointment does not belong to this teacher' });

    const q = `UPDATE appointments SET status=$1 WHERE appointment_id=$2 RETURNING *`;
    const r = await pool.query(q, ['rejected', apptId]);
    if (r.rowCount === 0)
      return res.status(500).json({ error: 'Failed to reject' });
    res.json({ ok: true, appointment: r.rows[0] });
  } catch (err) {
    console.error('Error rejecting appointment', err);
    res.status(500).json({ error: 'Failed to reject', detail: err.message });
  }
});

router.post('/:id/complete', async (req, res) => {
  const apptId = req.params.id;
  const teacherFromReq = (req.user && req.user.user_id) || req.body.teacher_id || req.query.teacher_id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the appointment row
    const found = await client.query('SELECT * FROM appointments WHERE appointment_id = $1 FOR UPDATE', [apptId]);
    if (found.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appt = found.rows[0];

    // Ownership check if teacher id provided
    if (teacherFromReq && String(appt.teacher_id) !== String(teacherFromReq)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Forbidden: appointment does not belong to this teacher' });
    }

    const slotId = appt.slot_id;

    // Delete the appointment
    await client.query('DELETE FROM appointments WHERE appointment_id = $1', [apptId]);

    // Delete the slot (if you prefer to only delete when no other appointments exist, change logic)
    await client.query('DELETE FROM slots WHERE slot_id = $1', [slotId]);

    await client.query('COMMIT');
    return res.json({ ok: true, appointment_id: apptId, slot_id: slotId });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Error completing appointment (delete):', err);
    return res.status(500).json({ error: 'Failed to complete appointment', detail: err.message });
  } finally {
    client.release();
  }
});

// ======================================================
// GET /api/appointments/student
// ======================================================
router.get('/student', async (req, res) => {
  try {
    const student_id = (req.user && req.user.user_id) || req.query.student_id;
    if (!student_id)
      return res.status(400).json({ error: 'student_id missing' });

    const q = `
      SELECT a.appointment_id, a.slot_id, a.reason, a.status,
             s.slot_date, s.slot_time, s.duration_minutes,
             t.user_id AS teacher_id, t.name AS teacher_name, t.photo_path AS teacher_photo
      FROM appointments a
      JOIN slots s ON a.slot_id = s.slot_id
      JOIN users t ON a.teacher_id = t.user_id
      WHERE a.student_id = $1
      ORDER BY s.slot_date, s.slot_time
    `;
    const r = await pool.query(q, [student_id]);
    res.json(r.rows);
  } catch (err) {
    console.error('Error fetching student appointments', err);
    res.status(500).json({ error: 'Failed to fetch appointments', detail: err.message });
  }
});

// ======================================================
// GET /api/appointments/teacher
// ======================================================
router.get('/teacher', async (req, res) => {
  try {
    const teacher_id = (req.user && req.user.user_id) || req.query.teacher_id;
    if (!teacher_id)
      return res.status(400).json({ error: 'teacher_id missing' });

    const q = `
      SELECT a.appointment_id, a.slot_id, a.reason, a.status, a.student_id,
             s.slot_date, s.slot_time, s.duration_minutes,
             u.user_id AS student_user_id, u.name AS student_name, u.photo_path AS student_photo
      FROM appointments a
      JOIN slots s ON a.slot_id = s.slot_id
      JOIN users u ON a.student_id = u.user_id
      WHERE a.teacher_id = $1
      ORDER BY s.slot_date, s.slot_time
    `;
    const r = await pool.query(q, [teacher_id]);
    res.json(r.rows);
  } catch (err) {
    console.error('Error fetching teacher appointments', err);
    res.status(500).json({ error: 'Failed to fetch appointments', detail: err.message });
  }
});

module.exports = router;
