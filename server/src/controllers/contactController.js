const { getSupabaseAdminClient, isMissingTableError } = require('../lib/supabase');

const createContact = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();

        if (!supabase) {
            return res.status(503).json({ message: 'Supabase is not configured' });
        }

        const { data, error } = await supabase.from('contacts').insert(req.body).select('*').single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        next(error);
    }
};

const getContacts = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();

        if (!supabase) {
            return res.json([]);
        }

        const { data, error } = await supabase.from('contacts').select('*');

        if (error) {
            if (isMissingTableError(error)) {
                return res.json([]);
            }
            throw error;
        }

        res.json((data || []).sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime()));
    } catch (error) {
        next(error);
    }
};

const updateContactStatus = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();

        if (!supabase) {
            return res.status(503).json({ message: 'Supabase is not configured' });
        }

        const { data, error } = await supabase.from('contacts').update(req.body).eq('id', req.params.id).select('*').maybeSingle();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Contact message not found' });
        res.json(data);
    } catch (error) {
        next(error);
    }
};

const deleteContact = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();

        if (!supabase) {
            return res.status(503).json({ message: 'Supabase is not configured' });
        }

        const { data, error } = await supabase.from('contacts').delete().eq('id', req.params.id).select('id').maybeSingle();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Contact message not found' });
        res.json({ message: 'Contact message deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = { createContact, getContacts, updateContactStatus, deleteContact };
