// backend/src/users.js
const express = require('express');
const router = express.Router();
const { pool } = require('./db');

// Public endpoint: get user info by id (name, email, photo_path, role)
router.get('/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const q = 'SELECT user_id, name, email, role, photo_path, created_at FROM users WHERE user_id = $1';
    const r = await pool.query(q, [user_id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
