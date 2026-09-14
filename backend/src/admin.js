const express = require('express');
const router = express.Router();
const { pool } = require('./db');
const auth = require('./auth_middleware');

router.get('/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admin' });
    const teachers = await pool.query("SELECT COUNT(*) as cnt FROM users WHERE role='teacher'");
    const students = await pool.query("SELECT COUNT(*) as cnt FROM users WHERE role='student'");
    const appts = await pool.query('SELECT COUNT(*) as cnt FROM appointments');
    res.json({ teachers: +teachers.rows[0].cnt, students: +students.rows[0].cnt, appointments: +appts.rows[0].cnt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admin' });
    const r = await pool.query('SELECT user_id, name, email, role, photo_path FROM users ORDER BY name');
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
