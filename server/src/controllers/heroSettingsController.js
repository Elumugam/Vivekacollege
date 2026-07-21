const { getSupabaseAdminClient, isMissingTableError, normalizeContentItem } = require('../lib/supabase');

const HERO_CONTENT_PREFIX = 'hero_settings_';

const heroContentKey = (pageName) => `${HERO_CONTENT_PREFIX}${String(pageName || '').toLowerCase()}`;

const readHeroFallback = async (supabase, pageName) => {
  const key = heroContentKey(pageName);
  const { data, error } = await supabase.from('website_content').select('*').eq('key', key).maybeSingle();
  if (error) throw error;
  return data ? normalizeContentItem(data)?.content || null : null;
};

const saveHeroFallback = async (supabase, payload) => {
  const key = heroContentKey(payload.page_name);
  const content = {
    page_name: payload.page_name,
    media_type: payload.media_type,
    media_url: payload.media_url,
    desktop_height: payload.desktop_height,
    tablet_height: payload.tablet_height,
    mobile_height: payload.mobile_height,
    overlay_enabled: payload.overlay_enabled,
    overlay_opacity: payload.overlay_opacity,
    object_fit: payload.object_fit,
    video_autoplay: payload.video_autoplay,
    video_loop: payload.video_loop,
    video_muted: payload.video_muted,
    updated_at: payload.updated_at,
  };

  const { data, error } = await supabase
    .from('website_content')
    .upsert({ key, content, updated_by: null }, { onConflict: 'key' })
    .select('*')
    .single();

  if (error) throw error;
  return normalizeContentItem(data)?.content || content;
};

const getSettings = async (req, res, next) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.json([]);

    const page = String(req.query.page || '').toLowerCase();
    if (page) {
      const { data, error } = await supabase.from('hero_media_settings').select('*').eq('page_name', page).limit(1);
      if (error) {
        if (isMissingTableError(error)) {
          const fallback = await readHeroFallback(supabase, page).catch(() => null);
          return res.json(fallback || null);
        }
        throw error;
      }
      return res.json(data && data.length ? data[0] : null);
    }

    const { data, error } = await supabase.from('hero_media_settings').select('*').order('page_name');
    if (error) {
      if (isMissingTableError(error)) return res.json([]);
      throw error;
    }
    res.json(data || []);
  } catch (err) {
    next(err);
  }
};

const upsertSettings = async (req, res, next) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ message: 'Supabase not configured' });
    const body = req.body || {};
    if (!body.page_name) return res.status(400).json({ message: 'page_name required' });

    const payload = {
      page_name: String(body.page_name).toLowerCase(),
      media_type: body.media_type || 'image',
      media_url: body.media_url || '',
      desktop_height: body.desktop_height || null,
      tablet_height: body.tablet_height || null,
      mobile_height: body.mobile_height || null,
      overlay_enabled: body.overlay_enabled === undefined ? true : !!body.overlay_enabled,
      overlay_opacity: body.overlay_opacity ?? 0.5,
      object_fit: body.object_fit || 'cover',
      video_autoplay: !!body.video_autoplay,
      video_loop: !!body.video_loop,
      video_muted: !!body.video_muted,
      updated_at: new Date().toISOString(),
    };

    // Check if a row exists for this page_name
    try {
      const { data: existing, error: selErr } = await supabase.from('hero_media_settings').select('id').eq('page_name', payload.page_name).limit(1);
      if (selErr) {
        if (isMissingTableError(selErr)) {
          // Table missing: persist through website_content fallback so the website updates immediately.
          const fallback = await saveHeroFallback(supabase, payload);
          return res.json(fallback);
        }
        throw selErr;
      }

      let result;
      if (Array.isArray(existing) && existing.length > 0) {
        const id = existing[0].id;
        const { data: updated, error: updErr } = await supabase.from('hero_media_settings').update(payload).eq('id', id).select().limit(1).single();
        if (updErr) throw updErr;
        result = updated;
      } else {
        const { data: inserted, error: insErr } = await supabase.from('hero_media_settings').insert(payload).select().limit(1).single();
        if (insErr) throw insErr;
        result = inserted;
      }

      // Ensure media asset exists for media_url
      try {
        const mediaUrl = payload.media_url || '';
        if (mediaUrl) {
          const supabaseUrl = process.env.SUPABASE_URL || '';
          // Try to derive bucket and name from public URL
          let bucket = '';
          let name = '';
          try {
            const parsed = new URL(mediaUrl);
            const match = parsed.pathname.match(/\/storage\/v1\/object\/public\/(.*?)\/(.*)$/);
            if (match) {
              bucket = match[1];
              name = decodeURIComponent(match[2]);
            }
          } catch (e) {}

          if (name && bucket) {
            const { data: exists } = await supabase.from('media_assets').select('id').limit(1).or(`url.eq.${mediaUrl},name.eq.${name}`);
            if (!Array.isArray(exists) || exists.length === 0) {
              await supabase.from('media_assets').insert({ name, url: mediaUrl, bucket, path: name, meta: {} });
            }
          }
        }
      } catch (e) {
        // ignore media asset insertion failures
      }

      res.json(result || payload);
    } catch (err) {
      if (isMissingTableError(err)) {
        try {
          const fallback = await saveHeroFallback(supabase, payload);
          return res.json(fallback);
        } catch (fallbackErr) {
          return next(fallbackErr);
        }
      }
      next(err);
    }
  } catch (err) {
    next(err);
  }
};

module.exports = { getSettings, upsertSettings };
