const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { listAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, listAnnouncementsPublic, saveSettings } = require('../controllers/announcementController');

const router = require('express').Router();

// slot is 'top' or 'hero'
router.get('/:slot', protect, listAnnouncements);
router.post('/:slot', protect, createAnnouncement);
router.put('/:slot/:id', protect, updateAnnouncement);
router.delete('/:slot/:id', protect, deleteAnnouncement);

// Public read (used by frontend)
router.get('/:slot/public', listAnnouncementsPublic);

// Settings (admin)
router.get('/:slot/settings', protect, async (req, res, next) => {
	try {
		const supabase = require('../lib/supabase').getSupabaseAdminClient();
		const key = `announcement_${req.params.slot}_settings`;
		const { data, error } = await supabase.from('website_content').select('*').eq('key', key).maybeSingle();
		if (error) throw error;
		return res.json((data && data.content) ? data.content : {});
	} catch (err) { next(err); }
});

router.put('/:slot/settings', protect, saveSettings);

module.exports = router;
