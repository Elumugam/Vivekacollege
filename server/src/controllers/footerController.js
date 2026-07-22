const { getSupabaseAdminClient, isMissingTableError } = require('../lib/supabase');

// ─── key constants ────────────────────────────────────────────────────────────
const KEY_CONTENT = 'footer_content';
const KEY_QUICK_LINKS = 'footer_quick_links';
const KEY_ACCREDITATIONS = 'footer_accreditations';
const KEY_CONTACT = 'contact_info'; // shared with contact-info CMS

// ─── helpers ─────────────────────────────────────────────────────────────────
const readKey = async (supabase, key) => {
    const { data, error } = await supabase
        .from('website_content')
        .select('*')
        .eq('key', key)
        .maybeSingle();
    if (error && !isMissingTableError(error)) throw error;
    return data?.content ?? null;
};

const writeKey = async (supabase, key, content) => {
    const { data, error } = await supabase
        .from('website_content')
        .upsert({ key, content, updated_by: null }, { onConflict: 'key' })
        .select('*')
        .single();
    if (error) throw error;
    return data;
};

// ─── GET /api/footer – public, returns all footer data in one call ───────────
const getFooter = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();
        if (!supabase) return res.json(buildDefaultFooter());

        const [content, quickLinks, accreditations, contactRaw] = await Promise.all([
            readKey(supabase, KEY_CONTENT),
            readKey(supabase, KEY_QUICK_LINKS),
            readKey(supabase, KEY_ACCREDITATIONS),
            readKey(supabase, KEY_CONTACT),
        ]);

        res.json({
            content: content || defaultContent(),
            quickLinks: Array.isArray(quickLinks) ? quickLinks : defaultQuickLinks(),
            accreditations: Array.isArray(accreditations) ? accreditations : defaultAccreditations(),
            contact: contactRaw || {},
        });
    } catch (error) {
        next(error);
    }
};

// ─── GET & PUT /api/footer/content ─────────────────────────────────────────────
const getFooterContent = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();
        if (!supabase) return res.json(defaultContent());
        const content = await readKey(supabase, KEY_CONTENT);
        res.json(content || defaultContent());
    } catch (error) {
        next(error);
    }
};

const saveFooterContent = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();
        if (!supabase) return res.status(503).json({ message: 'Supabase not configured' });

        const payload = {
            logoUrl: req.body.logoUrl ?? '',
            collegeName: req.body.collegeName ?? 'Viveka College',
            description: req.body.description ?? '',
            copyright: req.body.copyright ?? '',
        };
        await writeKey(supabase, KEY_CONTENT, payload);
        res.json({ message: 'Footer content saved', content: payload });
    } catch (error) {
        next(error);
    }
};

// ─── Quick Links CRUD ─────────────────────────────────────────────────────────
const getQuickLinks = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();
        if (!supabase) return res.json(defaultQuickLinks());
        const links = await readKey(supabase, KEY_QUICK_LINKS);
        res.json(Array.isArray(links) ? links : defaultQuickLinks());
    } catch (error) {
        next(error);
    }
};

const saveQuickLinks = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();
        if (!supabase) return res.status(503).json({ message: 'Supabase not configured' });

        const links = Array.isArray(req.body.links) ? req.body.links : [];
        const normalized = links.map((link, index) => ({
            id: link.id || `link-${Date.now()}-${index}`,
            label: String(link.label || ''),
            url: String(link.url || '/'),
            openInNewTab: !!link.openInNewTab,
            enabled: link.enabled !== false,
            order: typeof link.order === 'number' ? link.order : index,
        }));
        await writeKey(supabase, KEY_QUICK_LINKS, normalized);
        res.json({ message: 'Quick links saved', links: normalized });
    } catch (error) {
        next(error);
    }
};

// ─── Accreditations CRUD ──────────────────────────────────────────────────────
const getAccreditations = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();
        if (!supabase) return res.json(defaultAccreditations());
        const items = await readKey(supabase, KEY_ACCREDITATIONS);
        res.json(Array.isArray(items) ? items : defaultAccreditations());
    } catch (error) {
        next(error);
    }
};

const saveAccreditations = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();
        if (!supabase) return res.status(503).json({ message: 'Supabase not configured' });

        const items = Array.isArray(req.body.items) ? req.body.items : [];
        const normalized = items.map((item, index) => ({
            id: item.id || `accred-${Date.now()}-${index}`,
            title: String(item.title || ''),
            imageUrl: String(item.imageUrl || ''),
            description: String(item.description || ''),
            enabled: item.enabled !== false,
            order: typeof item.order === 'number' ? item.order : index,
        }));
        await writeKey(supabase, KEY_ACCREDITATIONS, normalized);
        res.json({ message: 'Accreditations saved', items: normalized });
    } catch (error) {
        next(error);
    }
};

// ─── Contact / Social – reuse existing contact_info key ───────────────────────
const getContactInfo = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();
        if (!supabase) return res.json({});
        const info = await readKey(supabase, KEY_CONTACT);
        res.json(info || {});
    } catch (error) {
        next(error);
    }
};

const saveContactInfo = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();
        if (!supabase) return res.status(503).json({ message: 'Supabase not configured' });

        const payload = {
            address: req.body.address ?? '',
            phone: req.body.phone ?? '',
            phone2: req.body.phone2 ?? '',
            email: req.body.email ?? '',
            workingHours: req.body.workingHours ?? '',
            mapUrl: req.body.mapUrl ?? '',
            facebook: req.body.facebook ?? '',
            instagram: req.body.instagram ?? '',
            youtube: req.body.youtube ?? '',
            linkedin: req.body.linkedin ?? '',
            twitter: req.body.twitter ?? '',
        };
        await writeKey(supabase, KEY_CONTACT, payload);
        res.json({ message: 'Contact info saved', contact: payload });
    } catch (error) {
        next(error);
    }
};

// ─── Defaults ─────────────────────────────────────────────────────────────────
const defaultContent = () => ({
    logoUrl: '',
    collegeName: 'Viveka College',
    description: 'Empowering minds since 1995. Dedicated to fostering academic excellence, critical thinking, and character development in our students.',
    copyright: '',
});

const defaultQuickLinks = () => [
    { id: 'ql-1', label: 'About', url: '/about', openInNewTab: false, enabled: true, order: 0 },
    { id: 'ql-2', label: 'Courses', url: '/courses', openInNewTab: false, enabled: true, order: 1 },
    { id: 'ql-3', label: 'Gallery', url: '/gallery', openInNewTab: false, enabled: true, order: 2 },
    { id: 'ql-4', label: 'Contact', url: '/contact', openInNewTab: false, enabled: true, order: 3 },
    { id: 'ql-5', label: 'Apply Now', url: '/apply', openInNewTab: false, enabled: true, order: 4 },
];

const defaultAccreditations = () => [
    { id: 'ac-1', title: 'NAAC A++', imageUrl: '', description: '', enabled: true, order: 0 },
    { id: 'ac-2', title: 'UGC RECOG', imageUrl: '', description: '', enabled: true, order: 1 },
];

const buildDefaultFooter = () => ({
    content: defaultContent(),
    quickLinks: defaultQuickLinks(),
    accreditations: defaultAccreditations(),
    contact: {},
});

module.exports = {
    getFooter,
    getFooterContent,
    saveFooterContent,
    getQuickLinks,
    saveQuickLinks,
    getAccreditations,
    saveAccreditations,
    getContactInfo,
    saveContactInfo,
};
