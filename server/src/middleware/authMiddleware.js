const jwt = require('jsonwebtoken');
const { getSupabaseAdminClient, isMissingTableError, normalizeAdmin } = require('../lib/supabase');

const protect = async (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorized' });
    }

    try {
        const token = authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'viveka-secret');

        // Check fallback / demo admin IDs first (includes legacy string IDs + new fixed UUID)
        const FALLBACK_ADMIN_IDS = ['admin-default-id', 'default-admin-id', 'demo-admin-id', '00000000-0000-0000-0000-000000000001'];
        if (FALLBACK_ADMIN_IDS.includes(decoded.id)) {
            req.admin = {
                id: '00000000-0000-0000-0000-000000000001',
                name: 'System Admin',
                email: process.env.ADMIN_EMAIL || 'admin@vivekacollege.edu',
                role: 'admin',
            };
            return next();
        }

        const supabase = getSupabaseAdminClient();
        let admin = null;

        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('admins')
                    .select('id,name,email,role,password,password_hash,passwordHash')
                    .eq('id', decoded.id)
                    .maybeSingle();

                if (data) {
                    admin = normalizeAdmin(data);
                }
            } catch (err) {
                // Ignore Supabase error
            }
        }

        if (!admin) {
            // Fallback for default admin
            admin = {
                id: decoded.id,
                name: 'System Admin',
                email: process.env.ADMIN_EMAIL || 'admin@vivekacollege.edu',
                role: 'admin',
            };
        }

        req.admin = {
            id: admin.id,
            name: admin.name || 'Admin',
            email: admin.email || 'admin@vivekacollege.edu',
            role: admin.role || 'admin',
        };
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token invalid' });
    }
};

module.exports = { protect };

