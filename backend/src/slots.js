const express = require('express');
const router = express.Router();
const { pool } = require('./db');
const auth = require('./auth_middleware');

router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Only teacher allowed' });
    const { slot_date, slot_time, duration_minutes } = req.body;
    const q = 'INSERT INTO slots(teacher_id, slot_date, slot_time, duration_minutes) VALUES ($1,$2,$3,$4) RETURNING *';
    const r = await pool.query(q, [req.user.user_id, slot_date, slot_time, duration_minutes || 30]);
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/teacher/:teacher_id', async (req, res) => {
  try {
    const q = 'SELECT * FROM slots WHERE teacher_id=$1 AND slot_date >= current_date ORDER BY slot_date, slot_time';
    const r = await pool.query(q, [req.params.teacher_id]);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/teachers', async (req, res) => {
  try {
    const q = "SELECT user_id, name, email, photo_path FROM users WHERE role='teacher'";
    const r = await pool.query(q);
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
