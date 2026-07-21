const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { getSupabaseAdminClient, isSupabaseUnauthorizedError } = require('../lib/supabase');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const ALLOWED_BUCKETS = ['hero-media', 'gallery-media', 'course-media', 'popup-media', 'cms-media'];

const extractObjectPath = (bucket, rawUrl) => {
    const value = String(rawUrl || '').trim();
    if (!value) return '';

    if (!/^https?:\/\//i.test(value)) {
        return value.replace(new RegExp(`^${bucket}\/`), '').replace(/^\//, '');
    }

    try {
        const parsed = new URL(value);
        const publicMarker = `/storage/v1/object/public/${bucket}/`;
        const publicIndex = parsed.pathname.indexOf(publicMarker);
        if (publicIndex >= 0) {
            return decodeURIComponent(parsed.pathname.slice(publicIndex + publicMarker.length));
        }

        const objectMarker = `/storage/v1/object/${bucket}/`;
        const objectIndex = parsed.pathname.indexOf(objectMarker);
        if (objectIndex >= 0) {
            return decodeURIComponent(parsed.pathname.slice(objectIndex + objectMarker.length));
        }
    } catch (error) {
        return value;
    }

    return value;
};

router.post('/', protect, upload.single('file'), async (req, res, next) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ message: 'No file provided' });

        const bucket = req.query.bucket || req.body.bucket || 'hero-media';
        if (!ALLOWED_BUCKETS.includes(bucket)) {
            return res.status(400).json({ message: `Invalid bucket. Allowed: ${ALLOWED_BUCKETS.join(', ')}` });
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const anonKey = process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !anonKey) {
            return res.status(503).json({ message: 'Supabase not configured (missing SUPABASE_ANON_KEY)' });
        }

        const ext = (file.originalname.split('.').pop() || 'bin').toLowerCase();
        const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;

        // Use raw fetch — works with sb_secret_* key format
        // Supabase REST storage API requires both Authorization AND apikey headers
        const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${filename}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${anonKey}`,
                'apikey': anonKey,
                'Content-Type': file.mimetype,
                'x-upsert': 'false',
            },
            body: file.buffer,
        });

        if (!uploadRes.ok) {
            const err = await uploadRes.json().catch(() => ({}));
            console.error('Storage upload error:', uploadRes.status, err);
            return res.status(500).json({ message: err?.message || `Upload failed: ${uploadRes.status}` });
        }

        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filename}`;
            // Record media in media_assets table if possible. Include optional page/section meta when provided.
            try {
                const supabase = getSupabaseAdminClient();
                if (supabase) {
                    const meta = { contentType: file.mimetype, originalName: file.originalname };
                    // Accept optional page & section query params from the client
                    const page = String(req.query.page || req.body.page || '').trim();
                    const section = String(req.query.section || req.body.section || '').trim();
                    if (page) meta.page_name = page.toLowerCase();
                    if (section) meta.section_name = section.toLowerCase();
                    const { error } = await supabase.from('media_assets').insert({ name: filename, url: publicUrl, bucket, path: filename, meta });
                    if (error) {
                        if (isSupabaseUnauthorizedError(error)) return res.status(503).json({ message: 'Upload succeeded but Supabase API key invalid/unauthorized when recording media. Check server/.env' });
                        console.warn('Failed to insert media_assets record', error?.message || error);
                    }
                }
            } catch (err) {
                if (isSupabaseUnauthorizedError(err)) return res.status(503).json({ message: 'Upload succeeded but Supabase API key invalid/unauthorized when recording media. Check server/.env' });
                console.warn('Failed to insert media_assets record', err?.message || err);
            }

            res.json({ url: publicUrl, filename, bucket });
    } catch (error) {
        next(error);
    }
});

router.delete('/', protect, async (req, res, next) => {
    try {
        const bucket = req.query.bucket || req.body.bucket || 'hero-media';
        const rawUrl = req.query.url || req.body.url || req.query.path || req.body.path || '';

        if (!ALLOWED_BUCKETS.includes(bucket)) {
            return res.status(400).json({ message: `Invalid bucket. Allowed: ${ALLOWED_BUCKETS.join(', ')}` });
        }

        const objectPath = extractObjectPath(bucket, rawUrl);
        if (!objectPath) {
            return res.status(400).json({ message: 'No file path provided' });
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const anonKey = process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !anonKey) {
            return res.status(503).json({ message: 'Supabase not configured (missing SUPABASE_ANON_KEY)' });
        }

        const deleteRes = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${anonKey}`,
                apikey: anonKey,
            },
        });

        if (!deleteRes.ok) {
            const err = await deleteRes.json().catch(() => ({}));
            return res.status(500).json({ message: err?.message || `Delete failed: ${deleteRes.status}` });
        }

        // Remove record from media_assets if present
        try {
            const supabase = getSupabaseAdminClient();
            if (supabase) {
                const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
                // delete by url or by name/path
                const { error } = await supabase.from('media_assets').delete().or(`url.eq.${publicUrl},name.eq.${objectPath},path.eq.${objectPath}`);
                if (error) {
                    if (isSupabaseUnauthorizedError(error)) return res.status(503).json({ message: 'Delete succeeded but Supabase API key invalid/unauthorized when removing media record. Check server/.env' });
                    console.warn('Failed to delete media_assets record', error?.message || error);
                }
            }
        } catch (err) {
            if (isSupabaseUnauthorizedError(err)) return res.status(503).json({ message: 'Delete succeeded but Supabase API key invalid/unauthorized when removing media record. Check server/.env' });
            console.warn('Failed to delete media_assets record', err?.message || err);
        }

        res.json({ message: 'File deleted', bucket, path: objectPath });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
