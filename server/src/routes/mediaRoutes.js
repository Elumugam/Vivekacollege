const express = require('express');
const { listMedia, backfillMedia, updateMedia, deleteMedia } = require('../controllers/mediaController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', listMedia);
router.put('/:id', protect, upload.single('file'), updateMedia);
router.delete('/:id', protect, deleteMedia);
// Admin-only endpoint to scan storage and backfill media_assets
router.post('/backfill', protect, backfillMedia);

module.exports = router;
