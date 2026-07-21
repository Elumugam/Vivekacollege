const { getSupabaseAdminClient, isMissingTableError } = require('../lib/supabase');

const getSummary = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();

        if (!supabase) {
            return res.json({ courses: 0, gallery: 0, applications: 0, contacts: 0 });
        }

        const countRows = async (tableName) => {
            const { count, error } = await supabase.from(tableName).select('*', { count: 'exact', head: true });

            if (error) {
                if (isMissingTableError(error)) {
                    return 0;
                }
                throw error;
            }

            return count || 0;
        };

        const [courses, gallery, applications, contacts] = await Promise.all([
            countRows('courses'),
            countRows('gallery'),
            countRows('applications'),
            countRows('contacts'),
        ]);

        res.json({ courses, gallery, applications, contacts });
    } catch (error) {
        next(error);
    }
};

module.exports = { getSummary };
