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