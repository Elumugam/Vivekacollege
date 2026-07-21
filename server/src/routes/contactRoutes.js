const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { createContact, getContacts, updateContactStatus, deleteContact } = require('../controllers/contactController');

const router = express.Router();

router.post('/', createContact);
router.get('/', protect, getContacts);
router.put('/:id', protect, updateContactStatus);
router.delete('/:id', protect, deleteContact);

module.exports = router;
