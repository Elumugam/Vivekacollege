const express = require('express');
const { loginAdmin, getCurrentAdmin } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', loginAdmin);
router.get('/me', protect, getCurrentAdmin);

module.exports = router;
