const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
    getFooter,
    getFooterContent,
    saveFooterContent,
    getQuickLinks,
    saveQuickLinks,
    getAccreditations,
    saveAccreditations,
    getContactInfo,
    saveContactInfo,
} = require('../controllers/footerController');

const router = express.Router();

// Public endpoint – frontend fetches all footer data in one call
router.get('/', getFooter);

// Footer content endpoints
router.get('/content', getFooterContent);
router.put('/content', protect, saveFooterContent);

router.get('/quick-links', getQuickLinks);
router.put('/quick-links', protect, saveQuickLinks);

router.get('/accreditations', getAccreditations);
router.put('/accreditations', protect, saveAccreditations);

router.get('/contact', getContactInfo);
router.put('/contact', protect, saveContactInfo);

module.exports = router;
