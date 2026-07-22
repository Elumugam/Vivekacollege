const { createClient } = require('@supabase/supabase-js');

const getSupabaseCredentials = () => {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    // Prefer the anon key for API usage in this app because the exposed tables are reachable with it.
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    return { url, anonKey, serviceKey };
};

const getSupabaseAdminClient = () => {
    const { url, serviceKey, anonKey } = getSupabaseCredentials();
    // Use service role key if it's a valid Supabase JWT (starts with eyJ), otherwise fallback to anonKey
    const key = (serviceKey && serviceKey.startsWith('eyJ')) ? serviceKey : (anonKey || serviceKey);
    if (!url || !key) return null;

    return createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
            fetch: (...args) => {
                const [fetchUrl, options] = args;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 7000);
                return fetch(fetchUrl, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeoutId));
            }
        }
    });
};

// Storage client uses the anon JWT key so that storage RLS policies (anon role) apply
const getStorageClient = () => {
    const { url, anonKey } = getSupabaseCredentials();
    if (!url || !anonKey) return null;
    return createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
};

const isMissingTableError = (error) => {
    const message = String(error?.message || '');
    return error?.code === '42P01' || /does not exist/i.test(message) || /relation .* does not exist/i.test(message) || /schema cache/i.test(message) || /could not find the table/i.test(message);
};

const isSupabaseUnauthorizedError = (error) => {
    if (!error) return false;
    const msg = String(error?.message || error?.error?.message || '').toLowerCase();
    if (!msg) return false;
    return msg.includes('invalid api key') || msg.includes('unauthorized') || msg.includes('invalid key');
};

const parseHighlights = (highlights) => {
    if (Array.isArray(highlights)) {
        return highlights.filter(Boolean);
    }

    if (typeof highlights === 'string') {
        return highlights.split(',').map((item) => item.trim()).filter(Boolean);
    }

    return [];
};

const normalizeCourse = (row = {}) => ({
    ...row,
    highlights: parseHighlights(row.highlights),
    seats: Number(row.seats ?? 0),
    image: row.image || row.thumbnail || row.thumbnailUrl || '',
    video: row.video || row.promoVideo || row.videoUrl || row.promo_video || '',
    promoVideo: row.promoVideo || row.video || row.videoUrl || row.promo_video || '',
});

const normalizeGalleryItem = (row = {}) => ({
    ...row,
    type: row.type || row.mediaType || 'image',
    src: row.src || row.mediaUrl || '',
    mediaUrl: row.mediaUrl || row.src || '',
    description: row.description || row.caption || '',
});

const normalizeContentItem = (row = {}) => ({
    ...row,
    updatedBy: row.updatedBy || row.updated_by || null,
    createdAt: row.createdAt || row.created_at || null,
    updatedAt: row.updatedAt || row.updated_at || null,
    content: (() => {
        if (row.content && typeof row.content === 'string') {
            try {
                return JSON.parse(row.content);
            } catch (error) {
                return {};
            }
        }

        return row.content ?? {};
    })(),
});

const normalizeAdmin = (row = {}) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role || 'admin',
    password: row.password || row.password_hash || row.passwordHash || '',
});

module.exports = {
    getSupabaseAdminClient,
    getStorageClient,
    isMissingTableError,
    normalizeCourse,
    normalizeGalleryItem,
    normalizeContentItem,
    normalizeAdmin,
    isSupabaseUnauthorizedError,
};