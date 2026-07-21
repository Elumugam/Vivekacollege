const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const { createApplication, getApplications, updateApplicationStatus, deleteApplication } = require('../controllers/applicationController');

const router = express.Router();

router.post('/', upload.array('documents', 5), createApplication);
router.get('/', protect, getApplications);
router.put('/:id', protect, updateApplicationStatus);
router.delete('/:id', protect, deleteApplication);

module.exports = router;
