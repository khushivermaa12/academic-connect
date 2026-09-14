// backend/src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./auth');
const slotsRoutes = require('./slots');
const apptRoutes = require('./appointments');
const adminRoutes = require('./admin');
const usersRoutes = require('./users'); // NEW

const app = express();
app.use(cors());
app.use(express.json());

// static uploads (if using local storage)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/slots', slotsRoutes);
app.use('/api/appointments', apptRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', usersRoutes); // NEW

app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('Backend listening on', PORT));
