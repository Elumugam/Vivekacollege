const { getSupabaseAdminClient, isMissingTableError, normalizeCourse, isSupabaseUnauthorizedError } = require('../lib/supabase');

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const buildCoursePayload = (body) => ({
    title: body.title,
    slug: body.slug ? slugify(body.slug) : slugify(body.title),
    category: body.category || 'Undergraduate',
    image: body.image || body.thumbnail || body.thumbnailUrl || null,
    duration: body.duration || null,
    eligibility: body.eligibility || null,
    fees: body.fees || null,
    seats: Number(body.seats || 0),
    description: body.description || null,
    highlights: Array.isArray(body.highlights) ? body.highlights.join(', ') : String(body.highlights || '').split(',').map((item) => item.trim()).filter(Boolean).join(', '),
    is_featured: body.is_featured === true || body.is_featured === 'true' || false,
});

const KNOWN_COURSE_TABLES = ['courses', 'course_catalog', 'course_catalogs', 'course_list'];

const getCourses = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();
        if (!supabase) return res.json([]);
        const rows = [];
        for (const table of KNOWN_COURSE_TABLES) {
            try {
                const resp = await supabase.from(table).select('*').order('created_at', { ascending: false });
                if (!resp.error && Array.isArray(resp.data) && resp.data.length > 0) {
                    rows.push(...resp.data);
                }
            } catch (err) {
                if (isSupabaseUnauthorizedError(err)) return res.status(503).json({ message: 'Supabase API key invalid or unauthorized. Check server/.env' });
            }
        }

        const uniqueCourses = new Map();
        for (const row of rows) {
            const course = normalizeCourse(row);
            const key = course.slug || String(course.id || `${course.title}-${uniqueCourses.size}`);
            if (!uniqueCourses.has(key)) {
                uniqueCourses.set(key, course);
            }
        }

        const { q, category } = req.query;
        const courses = Array.from(uniqueCourses.values())
            .map(normalizeCourse)
            .filter((course) => {
                const matchesCategory = !category || category === 'All' || course.category === category;
                const searchValue = `${course.title} ${course.description} ${course.eligibility}`.toLowerCase();
                const matchesQuery = !q || searchValue.includes(String(q).toLowerCase());
                return matchesCategory && matchesQuery;
            });

        res.json(courses);
    } catch (error) {
        next(error);
    }
};

const seedCourses = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();
        if (!supabase) return res.status(503).json({ message: 'Supabase is not configured' });

        const incomingCourses = Array.isArray(req.body?.courses) ? req.body.courses : [];
        if (incomingCourses.length === 0) return res.json([]);

        const savedCourses = [];
        for (const course of incomingCourses) {
            const payload = buildCoursePayload(course || {});
            const { data, error } = await supabase
                .from('courses')
                .upsert(payload, { onConflict: 'slug' })
                .select('*')
                .single();

            if (error) throw error;
            if (data) savedCourses.push(normalizeCourse(data));
        }

        res.status(201).json(savedCourses);
    } catch (error) {
        if (isSupabaseUnauthorizedError(error)) return res.status(503).json({ message: 'Supabase API key invalid or unauthorized. Check server/.env' });
        next(error);
    }
};

const getCourseBySlug = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();
        if (!supabase) return res.status(404).json({ message: 'Course not found' });

        let found = null;
        for (const table of KNOWN_COURSE_TABLES) {
            try {
                const resp = await supabase.from(table).select('*').eq('slug', req.params.slug).maybeSingle();
                if (!resp.error && resp.data) { found = resp.data; break; }
            } catch (err) {
                if (isSupabaseUnauthorizedError(err)) return res.status(503).json({ message: 'Supabase API key invalid or unauthorized. Check server/.env' });
            }
        }

        const data = found;

        if (!data) return res.status(404).json({ message: 'Course not found' });
        res.json(normalizeCourse(data));
    } catch (error) {
        if (isSupabaseUnauthorizedError(error)) return res.status(503).json({ message: 'Supabase API key invalid or unauthorized. Check server/.env' });
        next(error);
    }
};

const createCourse = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();
        if (!supabase) return res.status(503).json({ message: 'Supabase is not configured' });

        const payload = buildCoursePayload(req.body);
        // Upsert into primary 'courses' table; if missing, try known alternatives
        let result = null;
        try {
            result = await supabase.from('courses').upsert(payload, { onConflict: 'slug' }).select('*').single();
        } catch (err) { /* fallthrough */ }
        if (!result || result.error) {
            for (const table of KNOWN_COURSE_TABLES) {
                    try {
                        const resp = await supabase.from(table).upsert(payload, { onConflict: 'slug' }).select('*').single();
                        if (!resp.error && resp.data) { result = resp; break; }
                    } catch (err) { if (isSupabaseUnauthorizedError(err)) return res.status(503).json({ message: 'Supabase API key invalid or unauthorized. Check server/.env' }); }
                }
        }
        const { data, error } = result || { data: null, error: null };

        if (error) throw error;
        res.status(201).json(normalizeCourse(data));
    } catch (error) {
        if (isSupabaseUnauthorizedError(error)) return res.status(503).json({ message: 'Supabase API key invalid or unauthorized. Check server/.env' });
        next(error);
    }
};

const updateCourse = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();
        if (!supabase) return res.status(503).json({ message: 'Supabase is not configured' });

        const slug = req.params.slug || req.params.id;
        const payload = buildCoursePayload(req.body);
        const nextPayload = { ...payload, slug: payload.slug || slug };

        // Update similarly: try primary then fallbacks
        let resultUpd = null;
        try { resultUpd = await supabase.from('courses').upsert(nextPayload, { onConflict: 'slug' }).select('*').single(); } catch (e) {}
        if (!resultUpd || resultUpd.error) {
            for (const table of KNOWN_COURSE_TABLES) {
                    try {
                        const resp = await supabase.from(table).upsert(nextPayload, { onConflict: 'slug' }).select('*').single();
                        if (!resp.error && resp.data) { resultUpd = resp; break; }
                    } catch (err) { if (isSupabaseUnauthorizedError(err)) return res.status(503).json({ message: 'Supabase API key invalid or unauthorized. Check server/.env' }); }
                }
        }
        const { data, error } = resultUpd || { data: null, error: null };

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Course not found' });
        res.json(normalizeCourse(data));
    } catch (error) {
        if (isSupabaseUnauthorizedError(error)) return res.status(503).json({ message: 'Supabase API key invalid or unauthorized. Check server/.env' });
        next(error);
    }
};

const deleteCourse = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();
        if (!supabase) return res.status(503).json({ message: 'Supabase is not configured' });

        const slug = req.params.slug || req.params.id;
        // Try delete across known tables
        let lastError = null;
        for (const table of KNOWN_COURSE_TABLES) {
            try {
                const resp = await supabase.from(table).delete().eq('slug', slug);
                if (!resp.error) { lastError = null; break; }
                lastError = resp.error;
            } catch (err) { if (isSupabaseUnauthorizedError(err)) return res.status(503).json({ message: 'Supabase API key invalid or unauthorized. Check server/.env' }); lastError = err; }
        }
        const error = lastError;

        if (error) throw error;
        res.json({ message: 'Course deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getCourses, seedCourses, getCourseBySlug, createCourse, updateCourse, deleteCourse };
