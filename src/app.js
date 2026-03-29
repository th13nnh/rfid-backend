const express = require('express');
const cors = require('cors');

const guestRoutes = require('./routes/guests');
const checkinRoutes = require('./routes/checkins');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/guests', guestRoutes);
app.use('/api/checkins', checkinRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ message: '🟢 RFID Backend is running' });
});

module.exports = app;