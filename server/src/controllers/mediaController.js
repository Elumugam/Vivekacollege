const { getSupabaseAdminClient, isMissingTableError, isSupabaseUnauthorizedError } = require('../lib/supabase');

const inferMediaType = (row = {}) => {
    const typeFromMeta = String(row?.meta?.media_type || row?.media_type || row?.type || '').toLowerCase();
    if (typeFromMeta === 'video' || typeFromMeta === 'image') return typeFromMeta;
    const source = String(row?.url || row?.path || row?.name || '').toLowerCase();
    return /\.(mp4|webm|mov)(\?|$)/.test(source) ? 'video' : 'image';
};

const normalizeMediaRow = (row = {}) => {
    const meta = row.meta && typeof row.meta === 'object' ? row.meta : {};
    const pageName = String(meta.page_name || row.page_name || '').toLowerCase();
    const sectionName = String(meta.section_name || row.section_name || '').toLowerCase();

    return {
        id: row.id,
        name: row.name || '',
        url: row.url || row.src || row.path || '',
        bucket: row.bucket || '',
        path: row.path || '',
        meta,
        media_type: inferMediaType({ ...row, meta }),
        page_name: pageName,
        section_name: sectionName,
        created_at: row.created_at || null,
    };
};

const extractStoragePath = (bucket, rawUrl) => {
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

const uploadToStorage = async (bucket, file, anonKey, supabaseUrl) => {
    const ext = (file.originalname.split('.').pop() || 'bin').toLowerCase();
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;

    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${filename}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${anonKey}`,
            apikey: anonKey,
            'Content-Type': file.mimetype,
            'x-upsert': 'false',
        },
        body: file.buffer,
    });

    if (!uploadRes.ok) {
        const errorBody = await uploadRes.json().catch(() => ({}));
        throw new Error(errorBody?.message || `Upload failed: ${uploadRes.status}`);
    }

    return {
        filename,
        publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${filename}`,
    };
};

const backfillMedia = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();
        if (!supabase) return res.status(503).json({ message: 'Supabase admin client not configured' });

        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
        if (!supabaseUrl || !serviceKey) return res.status(503).json({ message: 'Supabase storage not configured' });

        const allBuckets = ['cms-media', 'gallery-media', 'course-media', 'hero-media', 'popup-media'];
        const buckets = Array.isArray(req.body?.buckets) && req.body.buckets.length ? req.body.buckets : allBuckets;

        const inserted = [];
        for (const bucket of buckets) {
            try {
                const listRes = await fetch(`${supabaseUrl}/storage/v1/object/list/${bucket}`, {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
                });
                if (!listRes.ok) continue;
                const items = await listRes.json().catch(() => []);
                if (!Array.isArray(items)) continue;

                const toInsert = [];
                for (const it of items) {
                    const name = it.name || it.path || it.id || '';
                    if (!name) continue;
                    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodeURIComponent(name)}`;

                    // check exists
                    try {
                        const { data: exists } = await supabase.from('media_assets').select('id').limit(1).or(`url.eq.${publicUrl},name.eq.${name}`);
                        if (Array.isArray(exists) && exists.length > 0) continue;
                    } catch (err) {
                        // if table missing, try to create later via migrations; skip
                        if (isMissingTableError(err)) return res.status(400).json({ message: 'media_assets table missing' });
                    }

                    toInsert.push({ name, url: publicUrl, bucket, path: name, meta: it });
                }

                if (toInsert.length) {
                    try {
                        const { error: insertErr } = await supabase.from('media_assets').insert(toInsert);
                        if (insertErr) console.warn('Backfill insert error for bucket', bucket, insertErr.message || insertErr);
                        else inserted.push(...toInsert.map((t) => ({ bucket, name: t.name })));
                    } catch (err) {
                        console.warn('Backfill insert failed', err?.message || err);
                    }
                }
            } catch (err) {
                // ignore bucket-level errors
            }
        }

        res.json({ inserted, count: inserted.length });
    } catch (error) {
        next(error);
    }
};

const listMedia = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();
        if (!supabase) return res.json([]);

        // Try to read from media_assets table first
        const { data: assets, error: assetErr } = await supabase.from('media_assets').select('*').order('created_at', { ascending: false });
        if (assetErr && isSupabaseUnauthorizedError(assetErr)) return res.status(503).json({ message: 'Supabase API key invalid or unauthorized. Check server/.env' });
        if (!assetErr && Array.isArray(assets) && assets.length > 0) {
            const page = String(req.query.page || '').toLowerCase();
            const section = String(req.query.section || '').toLowerCase();
            const filtered = assets.map(normalizeMediaRow).filter((row) => {
                if (page && row.page_name !== page) return false;
                if (section && row.section_name !== section) return false;
                return true;
            });
            return res.json(filtered);
        }

        // Fallback: list objects from storage buckets (public objects only)
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
        if (!supabaseUrl || !serviceKey) return res.json([]);

        const allBuckets = ['cms-media', 'gallery-media', 'course-media', 'hero-media', 'popup-media'];
        const page = String(req.query.page || '').toLowerCase();
        const pageBucketMap = {
            home: ['hero-media', 'cms-media'],
            about: ['cms-media'],
            courses: ['course-media', 'cms-media'],
            gallery: ['gallery-media'],
            contact: ['cms-media'],
        };

        const buckets = page ? (pageBucketMap[page] || allBuckets) : allBuckets;
        const results = [];

        for (const bucket of buckets) {
            try {
                const listRes = await fetch(`${supabaseUrl}/storage/v1/object/list/${bucket}`, {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
                });
                if (listRes.status === 401 || listRes.status === 403) return res.status(503).json({ message: 'Supabase storage API key invalid or unauthorized. Check server/.env' });
                if (!listRes.ok) continue;
                const items = await listRes.json().catch(() => []);
                if (!Array.isArray(items)) continue;
                for (const it of items) {
                    const name = it.name || it.path || it.id || '';
                    if (!name) continue;
                    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodeURIComponent(name)}`;
                    results.push(normalizeMediaRow({ id: `${bucket}/${name}`, url: publicUrl, name, bucket, meta: it, created_at: it.created_at || null }));
                }
            } catch (err) {
                if (isSupabaseUnauthorizedError(err)) return res.status(503).json({ message: 'Supabase storage API key invalid or unauthorized. Check server/.env' });
                // ignore per-bucket errors
            }
        }

        // Attempt to insert missing records into media_assets to avoid empty manager
        try {
            const toInsert = [];
            for (const r of results) {
                try {
                    const { data: exists } = await supabase.from('media_assets').select('id').limit(1).or(`url.eq.${r.url},name.eq.${r.name}`);
                    if (Array.isArray(exists) && exists.length > 0) continue;
                } catch (err) {
                    if (isMissingTableError(err)) {
                        // If table missing, stop trying to backfill
                        return res.json(results);
                    }
                }
                toInsert.push({ name: r.name, url: r.url, bucket: r.bucket, path: r.name, meta: r.meta });
            }
            if (toInsert.length) {
                try {
                    await supabase.from('media_assets').insert(toInsert);
                } catch (err) {
                    // ignore insertion errors
                    console.warn('Auto-insert media_assets failed', err?.message || err);
                }
            }
        } catch (err) {
            // ignore backfill errors
        }

        const pageFilter = String(req.query.page || '').toLowerCase();
        const section = String(req.query.section || '').toLowerCase();
        const filteredResults = results.filter((row) => {
            if (pageFilter && row.page_name !== pageFilter) return false;
            if (section && row.section_name !== section) return false;
            return true;
        });

        res.json(filteredResults);
    } catch (error) {
        next(error);
    }
};

const updateMedia = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();
        if (!supabase) return res.status(503).json({ message: 'Supabase is not configured' });

        const { data: existing, error: existingError } = await supabase.from('media_assets').select('*').eq('id', req.params.id).maybeSingle();
        if (existingError) throw existingError;
        if (!existing) return res.status(404).json({ message: 'Media item not found' });

        const supabaseUrl = process.env.SUPABASE_URL;
        const anonKey = process.env.SUPABASE_ANON_KEY;
        const nextMeta = {
            ...(existing.meta && typeof existing.meta === 'object' ? existing.meta : {}),
            page_name: String(req.body.page_name || existing.meta?.page_name || '').toLowerCase(),
            section_name: String(req.body.section_name || existing.meta?.section_name || '').toLowerCase(),
            media_type: req.body.media_type || existing.meta?.media_type || inferMediaType(existing),
        };

        let nextName = existing.name;
        let nextUrl = existing.url;
        let nextBucket = existing.bucket;
        let nextPath = existing.path;

        if (req.file) {
            if (!supabaseUrl || !anonKey) {
                return res.status(503).json({ message: 'Supabase storage not configured' });
            }

            const bucket = req.body.bucket || existing.bucket || 'cms-media';
            const uploaded = await uploadToStorage(bucket, req.file, anonKey, supabaseUrl);
            nextName = uploaded.filename;
            nextUrl = uploaded.publicUrl;
            nextBucket = bucket;
            nextPath = uploaded.filename;

            if (existing.url && existing.bucket) {
                const oldPath = extractStoragePath(existing.bucket, existing.url);
                if (oldPath) {
                    await fetch(`${supabaseUrl}/storage/v1/object/${existing.bucket}/${oldPath}`, {
                        method: 'DELETE',
                        headers: {
                            Authorization: `Bearer ${anonKey}`,
                            apikey: anonKey,
                        },
                    }).catch(() => null);
                }
            }
        }

        const payload = {
            name: nextName,
            url: nextUrl,
            bucket: nextBucket,
            path: nextPath,
            meta: nextMeta,
        };

        const { data, error } = await supabase.from('media_assets').update(payload).eq('id', req.params.id).select('*').maybeSingle();
        if (error) throw error;

        res.json(normalizeMediaRow(data || { ...existing, ...payload }));
    } catch (error) {
        next(error);
    }
};

const deleteMedia = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();
        if (!supabase) return res.status(503).json({ message: 'Supabase is not configured' });

        const { data: existing, error: existingError } = await supabase.from('media_assets').select('*').eq('id', req.params.id).maybeSingle();
        if (existingError) throw existingError;
        if (!existing) return res.status(404).json({ message: 'Media item not found' });

        const supabaseUrl = process.env.SUPABASE_URL;
        const anonKey = process.env.SUPABASE_ANON_KEY;
        if (supabaseUrl && anonKey && existing.url && existing.bucket) {
            const objectPath = extractStoragePath(existing.bucket, existing.url);
            if (objectPath) {
                await fetch(`${supabaseUrl}/storage/v1/object/${existing.bucket}/${objectPath}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${anonKey}`,
                        apikey: anonKey,
                    },
                }).catch(() => null);
            }
        }

        const { error } = await supabase.from('media_assets').delete().eq('id', req.params.id);
        if (error) throw error;

        res.json({ message: 'Media deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = { listMedia, backfillMedia, updateMedia, deleteMedia, normalizeMediaRow };
