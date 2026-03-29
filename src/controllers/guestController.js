// REPLACE with this:
const prisma = require('../lib/prisma');

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