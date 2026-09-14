const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const useS3 = (process.env.USE_S3 || 'false').toLowerCase() === 'true';
let uploadMiddleware;

if (useS3) {
  // multer-s3 setup
  const AWS = require('aws-sdk');
  const multerS3 = require('multer-s3');
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  });
  const s3 = new AWS.S3();
  uploadMiddleware = multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.AWS_BUCKET,
      acl: 'public-read',
      key: function (req, file, cb) {
        const fname = Date.now().toString() + '-' + file.originalname;
        cb(null, 'profiles/' + fname);
      }
    })
  });
} else {
  const uploadDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
  });
  uploadMiddleware = multer({ storage });
}

// Register
router.post('/register', uploadMiddleware.single('photo'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    const hashed = await bcrypt.hash(password, 10);
    const photo_path = req.file ? (useS3 ? req.file.location : '/uploads/' + req.file.filename) : null;
    const q = 'INSERT INTO users(name,email,role,password_hash,photo_path) VALUES ($1,$2,$3,$4,$5) RETURNING user_id,name,email,role,photo_path';
    const r = await pool.query(q, [name, email, role || 'student', hashed, photo_path]);
    res.json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already in use' });
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const q = 'SELECT user_id, name, email, role, password_hash FROM users WHERE email=$1';
    const r = await pool.query(q, [email]);
    if (r.rowCount === 0) return res.status(400).json({ error: 'Invalid credentials' });
    const user = r.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ user_id: user.user_id, role: user.role, name: user.name }, process.env.JWT_SECRET || 'secret', { expiresIn: '8h' });
    res.json({ token, user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role, photo_path: user.photo_path } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
