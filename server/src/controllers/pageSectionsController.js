const { getSupabaseAdminClient, isMissingTableError, isSupabaseUnauthorizedError } = require('../lib/supabase');

const DEFAULT_SECTION_REGISTRY = [
  { page_name: 'Home Page', section_name: 'Hero section', title: 'Hero section', content: 'Main hero content', image_url: '/collegeimage.png' },
  { page_name: 'Home Page', section_name: 'Education, Skill & Social Empowerment', title: 'Education, Skill & Social Empowerment', content: 'Homepage impact section' },
  { page_name: 'Home Page', section_name: 'Viveka College - Flexible, Recognized, Career-Focused', title: 'Viveka College - Flexible, Recognized, Career-Focused', content: 'Homepage introduction copy' },
  { page_name: 'Home Page', section_name: 'About the University', title: 'About the University', content: { smallHeading: 'ABOUT THE UNIVERSITY', mainHeading: 'Viveka College — Flexible, Recognized, Career-Focused', description: 'Viveka College provides government-approved distance education programs, designed to support career growth, flexible learning schedules and skill development for rural and urban learners.', additionalDescription: 'Our study centre, Vivega Samuthaya Kalvi, located in Theni, offers local student support, counseling, practical training sessions and placement assistance for eligible candidates across a wide range of undergraduate, postgraduate, diploma and professional programs.', buttonText: 'Learn More About Us', buttonLink: '/about', image_url: '/collegeimage.png' } },
  { page_name: 'Home Page', section_name: 'Strength Through Action', title: 'Strength Through Action', content: 'Homepage focus areas' },
  { page_name: 'Home Page', section_name: 'Academic Excellence', title: 'Academic Excellence', content: 'Homepage academic section' },
  { page_name: 'Home Page', section_name: 'Programs/Courses sections', title: 'Programs/Courses sections', content: 'Programs and courses teaser' },
  { page_name: 'Home Page', section_name: 'Any image section', title: 'Any image section', content: 'Homepage image content' },
  { page_name: 'Home Page', section_name: 'Any text section', title: 'Any text section', content: 'Homepage text content' },
  { page_name: 'Home Page', section_name: 'CTA sections', title: 'CTA sections', content: 'Homepage call to action' },
  { page_name: 'About Page', section_name: 'About content', title: 'About content', content: 'About page copy' },
  { page_name: 'About Page', section_name: 'Vision', title: 'Vision', content: 'About vision' },
  { page_name: 'About Page', section_name: 'Mission', title: 'Mission', content: 'About mission' },
  { page_name: 'About Page', section_name: 'History', title: 'History', content: 'About history' },
  { page_name: 'About Page', section_name: 'Images', title: 'Images', content: 'About page images' },
  { page_name: 'About Page', section_name: 'Statistics', title: 'Statistics', content: 'About page stats' },
  { page_name: 'About Page', section_name: 'Any content section', title: 'Any content section', content: 'About page content' },
  { page_name: 'Courses Page', section_name: 'Search section', title: 'Search section', content: 'Search by course, eligibility, or description' },
  { page_name: 'Courses Page', section_name: 'Filters', title: 'Filters', content: 'Course filters' },
  { page_name: 'Courses Page', section_name: 'Course section', title: 'Course section', content: 'Course cards section' },
  { page_name: 'Gallery Page', section_name: 'Gallery section', title: 'Gallery section', content: 'Gallery content' },
  { page_name: 'Contact Page', section_name: 'Contact section', title: 'Contact section', content: 'Contact details and form' },
];

const normalizeRow = (row = {}) => ({
  id: row.id,
  page_name: row.page_name || '',
  section_name: row.section_name || '',
  title: row.title || '',
  content: row.content ?? {},
  image_url: row.image_url || '',
  previous_data: row.previous_data || null,
  updated_at: row.updated_at || row.created_at || null,
  created_at: row.created_at || null,
});

const toDisplay = (row) => ({
  ...row,
  content: typeof row.content === 'string' ? row.content : JSON.stringify(row.content || {}, null, 2),
});

const isNumericId = (value) => /^\d+$/.test(String(value || ''));

const buildSectionKey = (pageName, sectionName) => `page_section:${pageName || ''}:${sectionName || ''}`;

const getFallbackMetaById = (id) => {
  const match = /^fallback-(\d+)$/.exec(String(id || ''));
  if (!match) return null;
  const index = Number(match[1]) - 1;
  if (index < 0 || index >= DEFAULT_SECTION_REGISTRY.length) return null;
  return DEFAULT_SECTION_REGISTRY[index];
};

const readSectionFallback = async (supabase, key) => {
  const { data, error } = await supabase.from('website_content').select('*').eq('key', key).maybeSingle();
  if (error) throw error;
  if (!data || !data.content) return null;
  const content = data.content;
  return {
    id: key,
    page_name: content.page_name || '',
    section_name: content.section_name || '',
    title: content.title || '',
    content: content.content ?? {},
    image_url: content.image_url || '',
    previous_data: content.previous_data || null,
    updated_at: content.updated_at || data.updated_at || data.created_at || null,
    created_at: data.created_at || null,
  };
};

const saveSectionFallback = async (supabase, key, rowPayload, previousData = null) => {
  const content = {
    page_name: rowPayload.page_name || '',
    section_name: rowPayload.section_name || '',
    title: rowPayload.title || '',
    content: rowPayload.content ?? {},
    image_url: rowPayload.image_url || '',
    previous_data: previousData,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('website_content')
    .upsert({ key, content, updated_by: null }, { onConflict: 'key' })
    .select('*')
    .single();
  if (error) throw error;
  return {
    id: key,
    page_name: content.page_name,
    section_name: content.section_name,
    title: content.title,
    content: content.content,
    image_url: content.image_url,
    previous_data: content.previous_data,
    updated_at: content.updated_at,
    created_at: data.created_at || content.updated_at,
  };
};

const buildFallbackRows = () => DEFAULT_SECTION_REGISTRY.map((section, index) => ({
  id: `fallback-${index + 1}`,
  ...section,
  previous_data: null,
  updated_at: null,
  created_at: null,
}));

const mergeWithDefaults = (rows) => {
  const list = Array.isArray(rows) ? rows : [];
  const byKey = new Map(list.map((row) => [`${row.page_name || ''}::${row.section_name || ''}`, row]));
  for (const fallback of buildFallbackRows()) {
    const key = `${fallback.page_name || ''}::${fallback.section_name || ''}`;
    if (!byKey.has(key)) byKey.set(key, fallback);
  }
  return Array.from(byKey.values());
};

const getPageSections = async (req, res, next) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.json(buildFallbackRows());

    const { data, error } = await supabase.from('page_sections').select('*').order('updated_at', { ascending: false });
    if (error) {
      if (isSupabaseUnauthorizedError(error)) return res.status(503).json({ message: 'Supabase API key invalid or unauthorized. Check server/.env' });
      if (isMissingTableError(error)) return res.json(buildFallbackRows());
      throw error;
    }

    const rows = Array.isArray(data) && data.length > 0 ? mergeWithDefaults(data.map(normalizeRow)) : buildFallbackRows();
    res.json(rows.map(toDisplay));
  } catch (error) {
    next(error);
  }
};

const savePageSection = async (req, res, next) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ message: 'Supabase is not configured' });

    const id = req.params.id;
    const fallbackMeta = getFallbackMetaById(id);
    const isFallbackId = !!fallbackMeta || String(id || '').startsWith('page_section:') || !isNumericId(id);

    let previous = null;
    if (!isFallbackId) {
      const existing = await supabase.from('page_sections').select('*').eq('id', id).maybeSingle();
      if (existing.error && !isMissingTableError(existing.error)) throw existing.error;
      previous = existing.data ? normalizeRow(existing.data) : null;
    }
    // Normalize content: accept JSON string or object
    let contentValue = req.body.content ?? {};
    if (typeof contentValue === 'string') {
      try { contentValue = JSON.parse(contentValue); } catch (e) { /* keep string when not JSON */ }
    }

    const resolvedPageName = req.body.page_name || fallbackMeta?.page_name || '';
    const resolvedSectionName = req.body.section_name || fallbackMeta?.section_name || '';
    const rowPayload = {
      page_name: resolvedPageName,
      section_name: resolvedSectionName,
      title: req.body.title || '',
      content: contentValue,
      image_url: req.body.image_url || '',
      previous_data: previous ? { page_name: previous.page_name, section_name: previous.section_name, title: previous.title, content: previous.content, image_url: previous.image_url, updated_at: previous.updated_at } : null,
      updated_at: new Date().toISOString(),
    };

    if (isFallbackId) {
      const sectionKey = String(id || '').startsWith('page_section:')
        ? String(id)
        : buildSectionKey(resolvedPageName, resolvedSectionName);
      const existingFallback = await readSectionFallback(supabase, sectionKey);
      const saved = await saveSectionFallback(
        supabase,
        sectionKey,
        rowPayload,
        existingFallback
          ? { page_name: existingFallback.page_name, section_name: existingFallback.section_name, title: existingFallback.title, content: existingFallback.content, image_url: existingFallback.image_url, updated_at: existingFallback.updated_at }
          : null
      );
      return res.json(saved);
    }

    const { data, error } = await supabase.from('page_sections').upsert({ id, ...rowPayload }, { onConflict: 'id' }).select('*').single();
    if (error) throw error;
    res.json(normalizeRow(data));
  } catch (error) {
    next(error);
  }
};

const revertPageSection = async (req, res, next) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ message: 'Supabase is not configured' });

    const id = req.params.id;
    const fallbackMeta = getFallbackMetaById(id);
    const isFallbackId = !!fallbackMeta || String(id || '').startsWith('page_section:') || !isNumericId(id);

    if (isFallbackId) {
      const sectionKey = String(id || '').startsWith('page_section:')
        ? String(id)
        : buildSectionKey(fallbackMeta?.page_name || '', fallbackMeta?.section_name || '');

      const current = await readSectionFallback(supabase, sectionKey);
      if (!current) {
        const base = fallbackMeta || null;
        if (!base) return res.status(404).json({ message: 'Section not found' });
        return res.json({
          id,
          page_name: base.page_name,
          section_name: base.section_name,
          title: base.title,
          content: base.content,
          image_url: base.image_url || '',
          previous_data: null,
          updated_at: null,
          created_at: null,
        });
      }

      const prev = current.previous_data || null;
      if (!prev) return res.json(current);

      const revertedPayload = {
        page_name: prev.page_name || current.page_name,
        section_name: prev.section_name || current.section_name,
        title: prev.title || current.title,
        content: prev.content ?? current.content,
        image_url: prev.image_url || current.image_url,
      };
      const saved = await saveSectionFallback(
        supabase,
        sectionKey,
        revertedPayload,
        {
          page_name: current.page_name,
          section_name: current.section_name,
          title: current.title,
          content: current.content,
          image_url: current.image_url,
          updated_at: current.updated_at,
        }
      );
      return res.json(saved);
    }

    const existing = await supabase.from('page_sections').select('*').eq('id', req.params.id).maybeSingle();
    if (existing.error) throw existing.error;
    if (!existing.data) return res.status(404).json({ message: 'Section not found' });

    const current = normalizeRow(existing.data);
    const previous = current.previous_data || {};
    const reverted = {
      page_name: previous.page_name || current.page_name,
      section_name: previous.section_name || current.section_name,
      title: previous.title || current.title,
      content: previous.content ?? current.content,
      image_url: previous.image_url || current.image_url,
      previous_data: {
        page_name: current.page_name,
        section_name: current.section_name,
        title: current.title,
        content: current.content,
        image_url: current.image_url,
        updated_at: current.updated_at,
      },
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('page_sections').upsert({ id: current.id, ...reverted }, { onConflict: 'id' }).select('*').single();
    if (error) throw error;
    res.json(normalizeRow(data));
  } catch (error) {
    next(error);
  }
};

const createPageSection = async (req, res, next) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ message: 'Supabase is not configured' });

    // Normalize content: accept JSON string or object
    let contentValue = req.body.content ?? {};
    if (typeof contentValue === 'string') {
      try { contentValue = JSON.parse(contentValue); } catch (e) { /* keep string when not JSON */ }
    }

    const rowPayload = {
      page_name: req.body.page_name || '',
      section_name: req.body.section_name || '',
      title: req.body.title || '',
      content: contentValue,
      image_url: req.body.image_url || '',
      previous_data: null,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase.from('page_sections').insert(rowPayload).select('*').single();
      if (error) {
        if (isMissingTableError(error)) throw error;
        throw error;
      }
      return res.status(201).json(normalizeRow(data));
    } catch (err) {
      if (isMissingTableError(err)) {
        // fallback to website_content table
        try {
          const key = `page_section:${rowPayload.page_name}:${rowPayload.section_name}`;
          const content = { page_name: rowPayload.page_name, section_name: rowPayload.section_name, title: rowPayload.title, content: rowPayload.content, image_url: rowPayload.image_url };
          const { data: wcData, error: wcError } = await supabase.from('website_content').upsert({ key, content, updated_by: null }, { onConflict: 'key' }).select('*').single();
          if (wcError) throw wcError;
          // Return a normalized row-like object
          return res.status(201).json({ id: key, page_name: rowPayload.page_name, section_name: rowPayload.section_name, title: rowPayload.title, content: rowPayload.content, image_url: rowPayload.image_url, previous_data: null, updated_at: wcData.updated_at || new Date().toISOString(), created_at: wcData.created_at || new Date().toISOString() });
        } catch (fallbackErr) {
          return next(fallbackErr);
        }
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { getPageSections, savePageSection, revertPageSection, createPageSection };