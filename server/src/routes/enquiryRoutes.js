const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { getSettings, getPublicSettings, saveSettings, submitEnquiry } = require('../controllers/enquiryController');

router.get('/settings', protect, getSettings);
router.get('/settings/public', getPublicSettings);
router.put('/settings', protect, saveSettings);

// public submit
router.post('/submit', submitEnquiry);

module.exports = router;
