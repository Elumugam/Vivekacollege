const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getAllContent, getContentByKey, saveContent } = require('../controllers/contentController');

const router = express.Router();

router.get('/', protect, getAllContent);
router.get('/:key', getContentByKey);
router.put('/:key', protect, saveContent);

module.exports = router;
