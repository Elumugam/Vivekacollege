const { getSupabaseAdminClient, isMissingTableError, isSupabaseUnauthorizedError, normalizeContentItem } = require('../lib/supabase');

const normalizePopup = (row = {}) => ({
  id: row.id,
  enabled: row.enabled === true || row.enabled === 'true',
  title: row.title || '',
  description: row.description || '',
  cta_text: row.cta_text || '',
  cta_url: row.cta_url || '',
  media_url: row.media_url || '',
  media_type: row.media_type || 'image',
  image_width: row.image_width ?? row.imageWidth ?? null,
  image_height: row.image_height ?? row.imageHeight ?? null,
  display_delay: Number(row.display_delay ?? 0),
  previous_data: row.previous_data || null,
  updated_at: row.updated_at || row.created_at || null,
  created_at: row.created_at || null,
});

const popupContentKey = 'popup_poster';

const popupContentFromContentRow = (row = {}) => {
  const content = row.content && typeof row.content === 'object' ? row.content : {};
  return normalizePopup({
    id: row.id,
    enabled: content.enabled,
    title: content.title,
    description: content.description,
    cta_text: content.cta_text,
    cta_url: content.cta_url,
    media_url: content.media_url,
    media_type: content.media_type,
    image_width: content.image_width ?? content.imageWidth ?? null,
    image_height: content.image_height ?? content.imageHeight ?? null,
    display_delay: content.display_delay,
    previous_data: content.previous_data || null,
    updated_at: row.updatedAt || row.updated_at || row.created_at || null,
    created_at: row.createdAt || row.created_at || null,
  });
};

const readPopupContentFallback = async (supabase) => {
  const { data, error } = await supabase.from('website_content').select('*').eq('key', popupContentKey).maybeSingle();
  if (error) throw error;
  if (data) return popupContentFromContentRow(normalizeContentItem(data));

  const legacy = await supabase.from('website_content').select('*').eq('key', 'popup').maybeSingle();
  if (legacy.error) throw legacy.error;
  if (legacy.data) return popupContentFromContentRow(normalizeContentItem(legacy.data));

  return null;
};

const savePopupContentFallback = async (supabase, payload) => {
  const content = {
    enabled: payload.enabled,
    title: payload.title,
    description: payload.description,
    cta_text: payload.cta_text,
    cta_url: payload.cta_url,
    media_url: payload.media_url,
    media_type: payload.media_type,
    image_width: payload.image_width ?? payload.imageWidth ?? null,
    image_height: payload.image_height ?? payload.imageHeight ?? null,
    display_delay: payload.display_delay,
    previous_data: payload.previous_data,
    updated_at: payload.updated_at,
  };

  const { data, error } = await supabase
    .from('website_content')
    .upsert({ key: popupContentKey, content, updated_by: null }, { onConflict: 'key' })
    .select('*')
    .single();

  if (error) throw error;
  return popupContentFromContentRow(normalizeContentItem(data));
};

const getCurrentPopup = async (req, res, next) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.json({});

    // Try plural table first
    try {
      const { data, error } = await supabase.from('popup_posters').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return res.json(normalizePopup(data || {}));
    } catch (err) {
      if (isSupabaseUnauthorizedError(err)) return res.status(503).json({ message: 'Supabase API key invalid or unauthorized. Check server/.env' });
      if (isMissingTableError(err)) {
        // fall back to legacy singular table
        const { data, error } = await supabase.from('popup_poster').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (!error && data) return res.json(normalizePopup(data));
        if (isMissingTableError(error)) {
          const fallback = await readPopupContentFallback(supabase);
          return res.json(fallback || {});
        }
        if (error) throw error;
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

const savePopup = async (req, res, next) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ message: 'Supabase is not configured' });

    const id = req.params.id || req.body.id || undefined;
    let existing = { data: null, error: null };
    if (id) {
      try {
        existing = await supabase.from('popup_posters').select('*').eq('id', id).maybeSingle();
        if (existing.error && !isMissingTableError(existing.error)) throw existing.error;
      } catch (err) {
        if (isMissingTableError(err)) {
          existing = await supabase.from('popup_poster').select('*').eq('id', id).maybeSingle();
        } else {
          throw err;
        }
      }
    }

    const previous = existing.data ? normalizePopup(existing.data) : null;
    const payload = {
      enabled: req.body.enabled === true || req.body.enabled === 'true',
      title: req.body.title || '',
      description: req.body.description || req.body.message || '',
      cta_text: req.body.cta_text || req.body.ctaText || '',
      cta_url: req.body.cta_url || req.body.ctaUrl || '',
      media_url: req.body.media_url || req.body.mediaUrl || req.body.imageUrl || req.body.videoUrl || '',
      media_type: req.body.media_type || req.body.mediaType || 'image',
      image_width: req.body.image_width ?? req.body.imageWidth ?? null,
      image_height: req.body.image_height ?? req.body.imageHeight ?? null,
      display_delay: Number(req.body.display_delay ?? req.body.displayDelay ?? 0),
      previous_data: previous ? { enabled: previous.enabled, title: previous.title, description: previous.description, cta_text: previous.cta_text, cta_url: previous.cta_url, media_url: previous.media_url, media_type: previous.media_type, display_delay: previous.display_delay, updated_at: previous.updated_at } : null,
      updated_at: new Date().toISOString(),
    };

    const row = id ? { id, ...payload } : payload;
    // Try plural table first, then singular, then fallback
    try {
      const { data, error } = await supabase.from('popup_posters').upsert(row, { onConflict: 'id' }).select('*').single();
      if (error) throw error;
      return res.json(normalizePopup(data));
    } catch (err) {
      if (isMissingTableError(err)) {
        try {
          const { data, error } = await supabase.from('popup_poster').upsert(row, { onConflict: 'id' }).select('*').single();
          if (error) throw error;
          return res.json(normalizePopup(data));
        } catch (err2) {
          if (isMissingTableError(err2)) {
            const fallback = await savePopupContentFallback(supabase, payload);
            return res.json(fallback);
          }
          throw err2;
        }
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

const revertPopup = async (req, res, next) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ message: 'Supabase is not configured' });

    // try plural then singular
    let existing = await supabase.from('popup_posters').select('*').eq('id', req.params.id).maybeSingle().catch((e) => ({ error: e }));
    if (existing && existing.error && isMissingTableError(existing.error)) {
      existing = await supabase.from('popup_poster').select('*').eq('id', req.params.id).maybeSingle();
    }
    if (existing.error) {
      if (isMissingTableError(existing.error)) return res.status(404).json({ message: 'Popup not found' });
      throw existing.error;
    }
    if (!existing.data) return res.status(404).json({ message: 'Popup not found' });

    const current = normalizePopup(existing.data);
    const previous = current.previous_data || {};
    const reverted = {
      enabled: previous.enabled ?? current.enabled,
      title: previous.title || current.title,
      description: previous.description || current.description,
      cta_text: previous.cta_text || current.cta_text,
      cta_url: previous.cta_url || current.cta_url,
      media_url: previous.media_url || current.media_url,
      media_type: previous.media_type || current.media_type,
      image_width: previous.image_width ?? previous.imageWidth ?? current.image_width ?? current.imageWidth ?? null,
      image_height: previous.image_height ?? previous.imageHeight ?? current.image_height ?? current.imageHeight ?? null,
      display_delay: previous.display_delay ?? current.display_delay,
      previous_data: {
        enabled: current.enabled,
        title: current.title,
        description: current.description,
        cta_text: current.cta_text,
        cta_url: current.cta_url,
        media_url: current.media_url,
        media_type: current.media_type,
        image_width: current.image_width ?? current.imageWidth ?? null,
        image_height: current.image_height ?? current.imageHeight ?? null,
        display_delay: current.display_delay,
        updated_at: current.updated_at,
      },
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase.from('popup_posters').upsert({ id: current.id, ...reverted }, { onConflict: 'id' }).select('*').single();
      if (error) throw error;
      return res.json(normalizePopup(data));
    } catch (err) {
      if (isMissingTableError(err)) {
        const { data, error } = await supabase.from('popup_poster').upsert({ id: current.id, ...reverted }, { onConflict: 'id' }).select('*').single();
        if (error) throw error;
        return res.json(normalizePopup(data));
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

const listPopups = async (req, res, next) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.json([]);

    try {
      const { data, error } = await supabase.from('popup_posters').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.json((Array.isArray(data) ? data : []).map(normalizePopup));
    } catch (err) {
      if (isMissingTableError(err)) {
        const { data, error } = await supabase.from('popup_poster').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data) && data.length > 0) return res.json(data.map(normalizePopup));
        const fallback = await readPopupContentFallback(supabase);
        return res.json(fallback ? [fallback] : []);
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

const deletePopup = async (req, res, next) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ message: 'Supabase is not configured' });

    const id = req.params.id;
    // Read existing record first so we can delete associated storage object
    let existing = await supabase.from('popup_posters').select('*').eq('id', id).maybeSingle().catch(() => ({ data: null, error: null }));
    if (existing && existing.error && isMissingTableError(existing.error)) {
      existing = await supabase.from('popup_poster').select('*').eq('id', id).maybeSingle();
    }
    if (existing.error) {
      if (isMissingTableError(existing.error)) return res.status(404).json({ message: 'Popup not found' });
      throw existing.error;
    }

    const row = existing.data;
    const mediaUrl = row?.media_url || req.body?.url || req.query?.url || '';

    // Attempt to delete storage object if mediaUrl is a Supabase public storage URL
    try {
      if (mediaUrl) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';
        let bucket = '';
        let objectPath = '';
        try {
          const parsed = new URL(mediaUrl);
          const publicMarker = '/storage/v1/object/public/';
          const idx = parsed.pathname.indexOf(publicMarker);
          if (idx >= 0) {
            const rest = parsed.pathname.slice(idx + publicMarker.length);
            const parts = rest.split('/');
            bucket = parts.shift();
            objectPath = decodeURIComponent(parts.join('/'));
          } else {
            const m = parsed.pathname.match(/\/storage\/v1\/object\/(.*?)\/(.*)$/);
            if (m) { bucket = m[1]; objectPath = decodeURIComponent(m[2]); }
          }
        } catch (e) {}

        if (bucket && objectPath && supabaseUrl && anonKey) {
          const deleteRes = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${anonKey}`, apikey: anonKey },
          });
          if (!deleteRes.ok) {
            const errBody = await deleteRes.text().catch(() => '');
            console.warn('Failed to delete storage object for popup:', deleteRes.status, errBody);
          } else {
            try {
              const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodeURIComponent(objectPath)}`;
              await supabase.from('media_assets').delete().or(`url.eq.${publicUrl},name.eq.${objectPath},path.eq.${objectPath}`);
            } catch (e) {
              // ignore media_assets deletion errors
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error deleting popup storage object', e?.message || e);
    }

    // Finally delete DB row (try plural then singular)
    try {
      const { data, error } = await supabase.from('popup_posters').delete().eq('id', id).select('*').single();
      if (error) throw error;
      return res.json({ message: 'deleted' });
    } catch (err) {
      if (isMissingTableError(err)) {
        const { data, error } = await supabase.from('popup_poster').delete().eq('id', id).select('*').single();
        if (error) throw error;
        return res.json({ message: 'deleted' });
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

const duplicatePopup = async (req, res, next) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ message: 'Supabase is not configured' });

    const id = req.params.id;
    let source = await supabase.from('popup_posters').select('*').eq('id', id).maybeSingle().catch(() => ({ data: null, error: null }));
    if (source && source.error && isMissingTableError(source.error)) {
      source = await supabase.from('popup_poster').select('*').eq('id', id).maybeSingle();
    }
    if (source.error) throw source.error;
    if (!source.data) return res.status(404).json({ message: 'Popup not found' });

    const current = normalizePopup(source.data);
    const payload = {
      enabled: current.enabled,
      title: current.title,
      description: current.description,
      cta_text: current.cta_text,
      cta_url: current.cta_url,
      media_url: current.media_url,
      media_type: current.media_type,
      image_width: current.image_width ?? current.imageWidth ?? null,
      image_height: current.image_height ?? current.imageHeight ?? null,
      display_delay: current.display_delay,
      previous_data: current.previous_data,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase.from('popup_posters').insert(payload).select('*').single();
      if (error) throw error;
      return res.json(normalizePopup(data));
    } catch (err) {
      if (isMissingTableError(err)) {
        const { data, error } = await supabase.from('popup_poster').insert(payload).select('*').single();
        if (error) throw error;
        return res.json(normalizePopup(data));
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { getCurrentPopup, savePopup, revertPopup, listPopups, deletePopup, duplicatePopup };