const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getCurrentPopup, savePopup, revertPopup, listPopups, deletePopup, duplicatePopup } = require('../controllers/popupPosterController');

const router = express.Router();

router.get('/current', getCurrentPopup);
router.get('/', protect, listPopups);
router.post('/', protect, savePopup);
router.put('/:id', protect, savePopup);
router.post('/:id/revert', protect, revertPopup);
router.post('/:id/duplicate', protect, duplicatePopup);
router.delete('/:id', protect, deletePopup);

module.exports = router;