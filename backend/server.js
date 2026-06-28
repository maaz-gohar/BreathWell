const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Serve static files
app.use('/audio', express.static(path.join(__dirname, 'uploads/audio')));
app.use('/avatars', express.static(path.join(__dirname, 'uploads/avatars')));

// Routes
app.use('/api/auth', require('./routes/auth.route'));
app.use('/api/moods', require('./routes/moods.route'));
app.use('/api/chat', require('./routes/chat.route'));
app.use('/api/habits', require('./routes/habit.route'));
app.use('/api/wellness', require('./routes/wellness.route'));
app.use('/api/journal', require('./routes/journal.route'));
app.use('/api/islamic', require('./routes/islamic.route'));
app.use('/api/places', require('./routes/places.route'));

console.log("Mongo URI:", process.env.MONGODB_URI);

// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:");
    console.error(err);
  });

// Error handling middleware
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Audio files served from: ${path.join(__dirname, 'uploads/audio')}`);
  console.log(`Avatar files served from: ${path.join(__dirname, 'uploads/avatars')}`);
});