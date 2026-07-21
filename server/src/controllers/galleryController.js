const { getSupabaseAdminClient, isMissingTableError, normalizeGalleryItem, isSupabaseUnauthorizedError } = require('../lib/supabase');

const KNOWN_GALLERY_TABLES = ['gallery', 'gallery_items', 'gallery_media', 'media'];

const buildGalleryPayload = (body) => ({
    id: body.id || undefined,
    title: body.title || null,
    category: body.category || 'Campus',
    type: body.type || body.mediaType || 'image',
    src: body.src || body.mediaUrl || null,
    "isPublished": body.isPublished !== undefined ? (body.isPublished === 'true' || body.isPublished === true) : true,
});

const getGallery = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();
        if (!supabase) return res.json([]);
        const rows = [];
        for (const table of KNOWN_GALLERY_TABLES) {
            try {
                const resp = await supabase.from(table).select('*').order('created_at', { ascending: false });
                if (!resp.error && Array.isArray(resp.data) && resp.data.length > 0) {
                    rows.push(...resp.data);
                }
            } catch (err) { if (isSupabaseUnauthorizedError(err)) return res.status(503).json({ message: 'Supabase API key invalid or unauthorized. Check server/.env' }); }
        }
        const uniqueItems = new Map();
        for (const row of rows) {
            const item = normalizeGalleryItem(row);
            const key = String(item.id || item.src || `${item.title}-${uniqueItems.size}`);
            if (!uniqueItems.has(key)) uniqueItems.set(key, item);
        }
        res.json(Array.from(uniqueItems.values()));
    } catch (error) {
        next(error);
    }
};

const createGalleryItem = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();
        if (!supabase) return res.status(503).json({ message: 'Supabase is not configured' });

        const payload = buildGalleryPayload(req.body);

        if (!payload.src) {
            return res.status(400).json({ message: 'Media URL (src) is required' });
        }

        // insert into primary table then fallback
        let result = null;
        try { result = await supabase.from('gallery').insert(payload).select('*').single(); } catch (e) { if (isSupabaseUnauthorizedError(e)) return res.status(503).json({ message: 'Supabase API key invalid or unauthorized. Check server/.env' }); }
        if (!result || result.error) {
            for (const table of KNOWN_GALLERY_TABLES) {
                try {
                    const resp = await supabase.from(table).insert(payload).select('*').single();
                    if (!resp.error && resp.data) { result = resp; break; }
                } catch (err) { if (isSupabaseUnauthorizedError(err)) return res.status(503).json({ message: 'Supabase API key invalid or unauthorized. Check server/.env' }); }
            }
        }
        const { data, error } = result || { data: null, error: null };

        if (error) throw error;
        res.status(201).json(normalizeGalleryItem(data));
    } catch (error) {
        next(error);
    }
};

const updateGalleryItem = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();
        if (!supabase) return res.status(503).json({ message: 'Supabase is not configured' });

        const payload = buildGalleryPayload({ ...req.body, id: req.params.id || req.body.id });
        let result = null;
        try { result = await supabase.from('gallery').upsert(payload, { onConflict: 'id' }).select('*').single(); } catch (e) { if (isSupabaseUnauthorizedError(e)) return res.status(503).json({ message: 'Supabase API key invalid or unauthorized. Check server/.env' }); }
        if (!result || result.error) {
            for (const table of KNOWN_GALLERY_TABLES) {
                try {
                    const resp = await supabase.from(table).upsert(payload, { onConflict: 'id' }).select('*').single();
                    if (!resp.error && resp.data) { result = resp; break; }
                } catch (err) { if (isSupabaseUnauthorizedError(err)) return res.status(503).json({ message: 'Supabase API key invalid or unauthorized. Check server/.env' }); }
            }
        }
        const { data, error } = result || { data: null, error: null };

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Gallery item not found' });
        res.json(normalizeGalleryItem(data));
    } catch (error) {
        next(error);
    }
};

const deleteGalleryItem = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();
        if (!supabase) return res.status(503).json({ message: 'Supabase is not configured' });

        let lastError = null;
        for (const table of KNOWN_GALLERY_TABLES) {
            try {
                const resp = await supabase.from(table).delete().eq('id', req.params.id);
                if (!resp.error) { lastError = null; break; }
                lastError = resp.error;
            } catch (err) { if (isSupabaseUnauthorizedError(err)) return res.status(503).json({ message: 'Supabase API key invalid or unauthorized. Check server/.env' }); lastError = err; }
        }
        const error = lastError;

        if (error) throw error;
        res.json({ message: 'Gallery item deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getGallery, createGalleryItem, updateGalleryItem, deleteGalleryItem };
