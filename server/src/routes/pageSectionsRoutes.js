const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getPageSections, savePageSection, revertPageSection, createPageSection } = require('../controllers/pageSectionsController');

const router = express.Router();

router.get('/', protect, getPageSections);
router.post('/', protect, createPageSection);
router.put('/:id', protect, savePageSection);
router.post('/:id/revert', protect, revertPageSection);

module.exports = router;