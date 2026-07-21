const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getCourses, seedCourses, getCourseBySlug, createCourse, updateCourse, deleteCourse } = require('../controllers/courseController');

const router = express.Router();

router.get('/', getCourses);
router.post('/seed', protect, seedCourses);
router.get('/slug/:slug', getCourseBySlug);
router.post('/', protect, createCourse);
router.put('/:slug', protect, updateCourse);   // use slug
router.delete('/:slug', protect, deleteCourse); // use slug

module.exports = router;
