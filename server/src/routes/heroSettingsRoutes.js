const express = require('express');
const { getSettings, upsertSettings } = require('../controllers/heroSettingsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getSettings);
router.put('/', protect, upsertSettings);

module.exports = router;
