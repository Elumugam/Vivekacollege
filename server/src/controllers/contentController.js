const { getSupabaseAdminClient, isMissingTableError, normalizeContentItem, isSupabaseUnauthorizedError } = require('../lib/supabase');

const CONTENT_TABLES_PRIORITY = [
    'website_content',
];

const tableForKey = (key) => {
    return 'website_content';
};

const getAllContent = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();

        if (!supabase) {
            return res.json([]);
        }

        const { data, error } = await supabase.from('website_content').select('*');
        if (error) {
            if (isSupabaseUnauthorizedError(error)) return res.status(503).json({ message: 'Supabase API key invalid or unauthorized. Check server/.env' });
            throw error;
        }

        res.json((Array.isArray(data) ? data : []).map(normalizeContentItem));
    } catch (error) {
        next(error);
    }
};

const getContentByKey = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();

        if (!supabase) {
            return res.json({});
        }

        const key = req.params.key;
        const { data, error } = await supabase.from('website_content').select('*').eq('key', key).maybeSingle();
        if (error) {
            if (isSupabaseUnauthorizedError(error)) return res.status(503).json({ message: 'Supabase API key invalid or unauthorized. Check server/.env' });
            if (isMissingTableError(error)) return res.json({});
            throw error;
        }

        if (data) return res.json(normalizeContentItem(data));
        return res.json({});
    } catch (error) {
        if (isSupabaseUnauthorizedError(error)) return res.status(503).json({ message: 'Supabase API key invalid or unauthorized. Check server/.env' });
        next(error);
    }
};

const saveContent = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();

        if (!supabase) {
            return res.status(503).json({ message: 'Supabase is not configured' });
        }

        const key = req.params.key;
        // Only pass a real UUID for updated_by — fallback admin IDs like "admin-default-id" are not valid UUIDs
        const adminId = req.admin?.id || null;
        const isValidUuid = adminId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(adminId);
        const payload = {
            key,
            content: req.body.content ?? req.body,
            updated_by: isValidUuid ? adminId : null,
        };

        const { data, error } = await supabase.from('website_content').upsert(payload, { onConflict: 'key' }).select('*').single();

        if (error) throw error;
        res.json(normalizeContentItem(data));
    } catch (error) {
        next(error);
    }
};

module.exports = { getAllContent, getContentByKey, saveContent };
