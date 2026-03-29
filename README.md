# rfid-backend
# 🚀 RFID Backend Server — Full Guide

## Tech Stack
| Layer | Choice | Why |
|---|---|---|
| Runtime | Node.js | Fast, huge ecosystem |
| Framework | Express | Minimal, flexible |
| Database | PostgreSQL | Relational + JSON arrays for tap timestamps |
| ORM | Prisma | Type-safe, auto-migrations |
| Config | dotenv | Env variable management |

---

## 📁 Final Project Structure
```
rfid-backend/
├── prisma/
│   └── schema.prisma        # Database schema
├── src/
│   ├── routes/
│   │   ├── guests.js        # Guest CRUD routes
│   │   └── checkins.js      # Check-in / tap routes
│   ├── controllers/
│   │   ├── guestController.js
│   │   └── checkinController.js
│   └── app.js               # Express app setup
├── .env                     # Environment variables
├── .gitignore
├── package.json
└── server.js                # Entry point
```

---

## STEP 1 — Prerequisites

Make sure you have these installed:

```bash
# Check Node.js (need v18+)
node -v

# Check npm
npm -v

# Install PostgreSQL (macOS with Homebrew)
brew install postgresql@15
brew services start postgresql@15

# OR on Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

---

## STEP 2 — Create the Project

```bash
# Create project folder
mkdir rfid-backend
cd rfid-backend

# Initialize Node project
npm init -y

# Install dependencies
npm install express prisma @prisma/client dotenv cors

# Install dev dependencies
npm install -D nodemon
```

---

## STEP 3 — Setup PostgreSQL Database

```bash
# Open PostgreSQL shell
psql postgres

# Inside psql, run:
CREATE USER rfid_user WITH PASSWORD 'yourpassword';
CREATE DATABASE rfid_db OWNER rfid_user;
GRANT ALL PRIVILEGES ON DATABASE rfid_db TO rfid_user;
\q
```

---

## STEP 4 — Initialize Prisma

```bash
npx prisma init
```

This creates a `prisma/` folder and a `.env` file.

---

## STEP 5 — Configure `.env`

Edit the `.env` file in the project root:

```env
DATABASE_URL="postgresql://rfid_user:yourpassword@localhost:5432/rfid_db"
PORT=3000
```

---

## STEP 6 — Define the Database Schema

Edit `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Guest {
  id              String   @id @default(uuid())
  rfid_card_id    String   @unique
  first_name      String
  last_name       String
  job_position    String?
  branch_location String?
  join_date       DateTime @default(now())
  photo_url       String?
  is_vip          Boolean  @default(false)
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  check_ins CheckIn[]
}

model CheckIn {
  id                  String   @id @default(uuid())
  rfid_card_id        String
  first_tap_timestamp DateTime
  tap_timestamps      Json     @default("[]")  // Array of all timestamps
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  guest Guest @relation(fields: [rfid_card_id], references: [rfid_card_id])
}
```

> **Note on `tap_timestamps`:** Stored as a JSON array, e.g. `["2024-01-01T08:00:00Z", "2024-01-01T12:00:00Z"]`. Every tap appends to this list.

---

## STEP 7 — Run Database Migration

```bash
npx prisma migrate dev --name init
```

This creates the actual tables in PostgreSQL. You'll run this every time you change `schema.prisma`.

---

## STEP 8 — Create Project Files

### `server.js` (Entry Point)

```js
require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
```

---

### `src/app.js` (Express App)

```js
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
```

---

### `src/controllers/guestController.js`

```js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CREATE a new guest
const createGuest = async (req, res) => {
  try {
    const {
      rfid_card_id, first_name, last_name,
      job_position, branch_location, join_date,
      photo_url, is_vip
    } = req.body;

    if (!rfid_card_id || !first_name || !last_name) {
      return res.status(400).json({ error: 'rfid_card_id, first_name, last_name are required' });
    }

    const guest = await prisma.guest.create({
      data: {
        rfid_card_id,
        first_name,
        last_name,
        job_position,
        branch_location,
        join_date: join_date ? new Date(join_date) : undefined,
        photo_url,
        is_vip: is_vip ?? false
      }
    });

    res.status(201).json({ success: true, data: guest });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'RFID card ID already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// GET all guests
const getAllGuests = async (req, res) => {
  try {
    const guests = await prisma.guest.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data: guests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET a single guest by ID
const getGuestById = async (req, res) => {
  try {
    const { id } = req.params;
    const guest = await prisma.guest.findUnique({ where: { id } });

    if (!guest) return res.status(404).json({ error: 'Guest not found' });

    res.json({ success: true, data: guest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET a guest by RFID card ID
const getGuestByRfid = async (req, res) => {
  try {
    const { rfid_card_id } = req.params;
    const guest = await prisma.guest.findUnique({ where: { rfid_card_id } });

    if (!guest) return res.status(404).json({ error: 'Guest not found' });

    res.json({ success: true, data: guest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE a guest
const updateGuest = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name, last_name, job_position,
      branch_location, join_date, photo_url, is_vip
    } = req.body;

    const guest = await prisma.guest.update({
      where: { id },
      data: {
        first_name,
        last_name,
        job_position,
        branch_location,
        join_date: join_date ? new Date(join_date) : undefined,
        photo_url,
        is_vip
      }
    });

    res.json({ success: true, data: guest });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Guest not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

// DELETE a guest
const deleteGuest = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.guest.delete({ where: { id } });

    res.json({ success: true, message: 'Guest deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Guest not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createGuest, getAllGuests, getGuestById,
  getGuestByRfid, updateGuest, deleteGuest
};
```

---

### `src/controllers/checkinController.js`

```js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// TAP — called every time a card is tapped
// Logic:
//   - If no check-in record exists for today → create one, set first_tap_timestamp
//   - If record exists → append new timestamp to tap_timestamps array
const tapCard = async (req, res) => {
  try {
    const { rfid_card_id } = req.body;

    if (!rfid_card_id) {
      return res.status(400).json({ error: 'rfid_card_id is required' });
    }

    // Check if the guest exists
    const guest = await prisma.guest.findUnique({ where: { rfid_card_id } });
    if (!guest) {
      return res.status(404).json({ error: 'No guest found with this RFID card' });
    }

    const now = new Date();

    // Get start of today to scope check-ins per day
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // Look for an existing check-in for this card today
    const existingCheckIn = await prisma.checkIn.findFirst({
      where: {
        rfid_card_id,
        first_tap_timestamp: { gte: startOfToday }
      }
    });

    if (!existingCheckIn) {
      // First tap of the day — create new check-in record
      const checkIn = await prisma.checkIn.create({
        data: {
          rfid_card_id,
          first_tap_timestamp: now,
          tap_timestamps: [now.toISOString()]
        }
      });

      return res.status(201).json({
        success: true,
        message: '✅ First tap recorded',
        is_first_tap: true,
        data: checkIn
      });
    } else {
      // Subsequent tap — append to tap_timestamps array
      const updatedTimestamps = [
        ...(existingCheckIn.tap_timestamps),
        now.toISOString()
      ];

      const updatedCheckIn = await prisma.checkIn.update({
        where: { id: existingCheckIn.id },
        data: { tap_timestamps: updatedTimestamps }
      });

      return res.json({
        success: true,
        message: '✅ Tap recorded',
        is_first_tap: false,
        tap_count: updatedTimestamps.length,
        data: updatedCheckIn
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET all check-ins
const getAllCheckIns = async (req, res) => {
  try {
    const checkIns = await prisma.checkIn.findMany({
      include: { guest: true },
      orderBy: { first_tap_timestamp: 'desc' }
    });
    res.json({ success: true, data: checkIns });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET check-ins by RFID card
const getCheckInsByRfid = async (req, res) => {
  try {
    const { rfid_card_id } = req.params;

    const checkIns = await prisma.checkIn.findMany({
      where: { rfid_card_id },
      include: { guest: true },
      orderBy: { first_tap_timestamp: 'desc' }
    });

    res.json({ success: true, data: checkIns });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET a specific check-in by ID
const getCheckInById = async (req, res) => {
  try {
    const { id } = req.params;

    const checkIn = await prisma.checkIn.findUnique({
      where: { id },
      include: { guest: true }
    });

    if (!checkIn) return res.status(404).json({ error: 'Check-in not found' });

    res.json({ success: true, data: checkIn });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  tapCard, getAllCheckIns, getCheckInsByRfid, getCheckInById
};
```

---

### `src/routes/guests.js`

```js
const express = require('express');
const router = express.Router();
const {
  createGuest, getAllGuests, getGuestById,
  getGuestByRfid, updateGuest, deleteGuest
} = require('../controllers/guestController');

router.post('/', createGuest);            // POST   /api/guests
router.get('/', getAllGuests);             // GET    /api/guests
router.get('/:id', getGuestById);         // GET    /api/guests/:id
router.get('/rfid/:rfid_card_id', getGuestByRfid); // GET /api/guests/rfid/:rfid_card_id
router.put('/:id', updateGuest);          // PUT    /api/guests/:id
router.delete('/:id', deleteGuest);       // DELETE /api/guests/:id

module.exports = router;
```

---

### `src/routes/checkins.js`

```js
const express = require('express');
const router = express.Router();
const {
  tapCard, getAllCheckIns, getCheckInsByRfid, getCheckInById
} = require('../controllers/checkinController');

router.post('/tap', tapCard);                        // POST   /api/checkins/tap
router.get('/', getAllCheckIns);                     // GET    /api/checkins
router.get('/:id', getCheckInById);                  // GET    /api/checkins/:id
router.get('/rfid/:rfid_card_id', getCheckInsByRfid); // GET  /api/checkins/rfid/:rfid

module.exports = router;
```

---

### `package.json` — Add Scripts

Update your `package.json` scripts section:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

---

### `.gitignore`

```
node_modules/
.env
```

---

## STEP 9 — Run the Server

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

You should see:
```
✅ Server running on http://localhost:3000
```

---

## STEP 10 — Test the API

### Using curl or Postman / Insomnia

#### ➕ Create a Guest
```bash
curl -X POST http://localhost:3000/api/guests \
  -H "Content-Type: application/json" \
  -d '{
    "rfid_card_id": "CARD-001",
    "first_name": "John",
    "last_name": "Doe",
    "job_position": "Engineer",
    "branch_location": "HQ",
    "is_vip": false
  }'
```

#### 📋 Get All Guests
```bash
curl http://localhost:3000/api/guests
```

#### 🔍 Get Guest by RFID
```bash
curl http://localhost:3000/api/guests/rfid/CARD-001
```

#### ✏️ Update Guest
```bash
curl -X PUT http://localhost:3000/api/guests/<id> \
  -H "Content-Type: application/json" \
  -d '{"is_vip": true}'
```

#### 🗑️ Delete Guest
```bash
curl -X DELETE http://localhost:3000/api/guests/<id>
```

#### 🏷️ Tap a Card (first or subsequent tap)
```bash
curl -X POST http://localhost:3000/api/checkins/tap \
  -H "Content-Type: application/json" \
  -d '{"rfid_card_id": "CARD-001"}'
```

#### 📊 Get All Check-ins for a Card
```bash
curl http://localhost:3000/api/checkins/rfid/CARD-001
```

---

## 📊 Example API Response — After Multiple Taps

```json
{
  "success": true,
  "message": "✅ Tap recorded",
  "is_first_tap": false,
  "tap_count": 3,
  "data": {
    "id": "uuid-here",
    "rfid_card_id": "CARD-001",
    "first_tap_timestamp": "2024-06-01T08:00:00.000Z",
    "tap_timestamps": [
      "2024-06-01T08:00:00.000Z",
      "2024-06-01T12:30:00.000Z",
      "2024-06-01T17:45:00.000Z"
    ],
    "created_at": "2024-06-01T08:00:00.000Z",
    "updated_at": "2024-06-01T17:45:00.000Z"
  }
}
```

---

## 🔌 Full API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/api/guests` | Create new guest |
| `GET` | `/api/guests` | Get all guests |
| `GET` | `/api/guests/:id` | Get guest by UUID |
| `GET` | `/api/guests/rfid/:rfid_card_id` | Get guest by RFID |
| `PUT` | `/api/guests/:id` | Update guest |
| `DELETE` | `/api/guests/:id` | Delete guest |
| `POST` | `/api/checkins/tap` | Record a tap |
| `GET` | `/api/checkins` | Get all check-ins |
| `GET` | `/api/checkins/:id` | Get check-in by ID |
| `GET` | `/api/checkins/rfid/:rfid_card_id` | Get all check-ins for a card |

---

## 🛠️ Useful Prisma Commands

```bash
# View your database in a visual browser
npx prisma studio

# Re-generate Prisma client after schema changes
npx prisma generate

# Create a new migration after schema changes
npx prisma migrate dev --name <migration_name>

# Reset database (CAREFUL: deletes all data)
npx prisma migrate reset
```

---

## ✅ Quick-Start Checklist

- [ ] PostgreSQL installed and running
- [ ] Database and user created
- [ ] `.env` configured with `DATABASE_URL`
- [ ] `npm install` run
- [ ] `npx prisma migrate dev --name init` run
- [ ] `npm run dev` running
- [ ] Test with curl or Postman