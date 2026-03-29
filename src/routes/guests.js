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