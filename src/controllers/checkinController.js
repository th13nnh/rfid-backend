// REPLACE with this:
const prisma = require('../lib/prisma');

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