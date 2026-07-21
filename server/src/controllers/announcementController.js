const { getSupabaseAdminClient, isMissingTableError, isSupabaseUnauthorizedError, normalizeContentItem } = require('../lib/supabase');

const VALID_SLOTS = { top: 'announcement_top', hero: 'announcement_hero' };

const isMissingColumnError = (error) => {
  const message = String(error?.message || '');
  return error?.code === '42703' || /column .* does not exist/i.test(message);
};

const normalizeAnnouncement = (row = {}) => ({
  id: row.id,
  title: row.title || '',
  text: row.text || row.message || '',
  image_url: row.image_url || row.imageUrl || '',
  speed: Number(row.speed ?? row.scroll_speed ?? 25),
  enabled: row.enabled === true || row.enabled === 'true',
  created_at: row.created_at || null,
  updated_at: row.updated_at || null,
});

const announcementImageKey = (slot, id) => `${slot}:${id}`;

const splitImageUrls = (value) => String(value || '').split(',').map((s) => s.trim()).filter(Boolean);

const loadImagesForAnnouncements = async (supabase, slot, rows, settings = {}) => {
  if (!Array.isArray(rows) || rows.length === 0) return rows;
  const rowMap = new Map(rows.map((r) => [String(r.id), r]));
  try {
    const keys = rows.map((r) => announcementImageKey(slot, r.id));
    const { data, error } = await supabase.from('announcement_images').select('*').in('announcement_id', keys).order('id', { ascending: true });
    if (error) throw error;
    const grouped = new Map();
    (Array.isArray(data) ? data : []).forEach((img) => {
      const [imgSlot, id] = String(img.announcement_id || '').split(':');
      if (imgSlot !== slot || !id) return;
      const current = grouped.get(id) || [];
      current.push(img.image_url);
      grouped.set(id, current);
    });
    return rows.map((row) => ({
      ...row,
      image_urls: grouped.get(String(row.id)) || splitImageUrls(row.image_url),
    }));
  } catch (err) {
    if (isMissingTableError(err)) {
      return rows.map((row) => ({ ...row, image_urls: splitImageUrls(row.image_url) }));
    }
    throw err;
  }
};

const saveAnnouncementImages = async (supabase, slot, announcementId, imageUrls = [], settings = {}) => {
  const announcementIdKey = announcementImageKey(slot, announcementId);
  try {
    const { error: delErr } = await supabase.from('announcement_images').delete().eq('announcement_id', announcementIdKey);
    if (delErr) throw delErr;
    const rows = imageUrls.map((url) => ({
      announcement_id: announcementIdKey,
      image_url: url,
      width: settings.image_width ?? null,
      height: settings.image_height ?? null,
      gap: settings.image_gap ?? settings.gap ?? null,
      border_radius: settings.image_border_radius ?? null,
      object_fit: settings.image_object_fit || 'cover',
    }));
    if (rows.length > 0) {
      const { error } = await supabase.from('announcement_images').insert(rows);
      if (error) throw error;
    }
  } catch (err) {
    if (!isMissingTableError(err)) throw err;
  }
};

const readFallback = async (supabase, slotKey) => {
  const { data, error } = await supabase.from('website_content').select('*').eq('key', slotKey).maybeSingle();
  if (error) throw error;
  if (!data) return [];
  const content = data.content && typeof data.content === 'object' ? data.content : { items: [] };
  const items = Array.isArray(content.items) ? content.items : [];
  return items.map((it) => ({ id: it.id || null, title: it.title || '', text: it.text || it.message || '', image_url: it.image_url || '', image_urls: Array.isArray(it.image_urls) ? it.image_urls : splitImageUrls(it.image_url), speed: it.speed || 25, enabled: !!it.enabled }));
};

const readSettings = async (supabase, slot) => {
  const key = `announcement_${slot}_settings`;
  const { data, error } = await supabase.from('website_content').select('*').eq('key', key).maybeSingle();
  if (error) throw error;
  return (data && data.content) ? data.content : {};
};

const listAnnouncementsPublic = async (req, res, next) => {
  try {
    const slot = req.params.slot;
    if (!VALID_SLOTS[slot]) return res.status(400).json({ message: 'Invalid slot' });
    const table = VALID_SLOTS[slot];
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.json({ items: [], settings: {} });

    try {
      const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      const settings = await readSettings(supabase, slot).catch(() => ({}));
      const baseItems = (Array.isArray(data) ? data : []).map(normalizeAnnouncement).filter((it) => it.enabled);
      const items = await loadImagesForAnnouncements(supabase, slot, baseItems, settings);
      return res.json({ items, settings });
    } catch (err) {
      if (isMissingTableError(err)) {
        const fallback = await readFallback(supabase, `announcement_${slot}`);
        const settings = await readSettings(supabase, slot).catch(() => ({}));
        return res.json({ items: fallback.filter((it) => it.enabled), settings });
      }
      throw err;
    }
  } catch (error) {
    if (isSupabaseUnauthorizedError(error)) return res.status(503).json({ message: 'Supabase API key invalid or unauthorized. Check server/.env' });
    next(error);
  }
};

const saveSettings = async (req, res, next) => {
  try {
    const slot = req.params.slot;
    if (!VALID_SLOTS[slot]) return res.status(400).json({ message: 'Invalid slot' });
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ message: 'Supabase is not configured' });

    const payload = req.body || {};
    const key = `announcement_${slot}_settings`;
    const { data, error } = await supabase.from('website_content').upsert({ key, content: payload, updated_by: null }, { onConflict: 'key' }).select('*').single();
    if (error) throw error;
    return res.json(data.content || {});
  } catch (error) {
    next(error);
  }
};

const listAnnouncements = async (req, res, next) => {
  try {
    const slot = req.params.slot;
    if (!VALID_SLOTS[slot]) return res.status(400).json({ message: 'Invalid slot' });
    const table = VALID_SLOTS[slot];
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.json([]);

    try {
      const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      const settings = await readSettings(supabase, slot).catch(() => ({}));
      const items = await loadImagesForAnnouncements(supabase, slot, (Array.isArray(data) ? data : []).map(normalizeAnnouncement), settings);
      return res.json(items);
    } catch (err) {
      if (isMissingTableError(err)) {
        const fallback = await readFallback(supabase, `announcement_${slot}`);
        return res.json(fallback);
      }
      throw err;
    }
  } catch (error) {
    if (isSupabaseUnauthorizedError(error)) return res.status(503).json({ message: 'Supabase API key invalid or unauthorized. Check server/.env' });
    next(error);
  }
};

const createAnnouncement = async (req, res, next) => {
  try {
    const slot = req.params.slot;
    if (!VALID_SLOTS[slot]) return res.status(400).json({ message: 'Invalid slot' });
    const table = VALID_SLOTS[slot];
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ message: 'Supabase is not configured' });

    const payload = {
      title: req.body.title || '',
      text: req.body.text || req.body.message || '',
      image_url: req.body.image_url || req.body.imageUrl || '',
      speed: Number(req.body.speed ?? 25),
      enabled: req.body.enabled === true || req.body.enabled === 'true',
      updated_at: new Date().toISOString(),
    };
    const imageUrls = Array.isArray(req.body.image_urls)
      ? req.body.image_urls.filter(Boolean)
      : splitImageUrls(payload.image_url);
    payload.image_url = imageUrls.join(',');

    try {
      let inserted;
      const { data, error } = await supabase.from(table).insert(payload).select('*').single();
      if (error) {
        if (isMissingColumnError(error) && Object.prototype.hasOwnProperty.call(payload, 'title')) {
          const retryPayload = { ...payload };
          delete retryPayload.title;
          const retried = await supabase.from(table).insert(retryPayload).select('*').single();
          if (retried.error) throw retried.error;
          inserted = retried.data;
        } else {
          throw error;
        }
      } else {
        inserted = data;
      }
      const settings = await readSettings(supabase, slot).catch(() => ({}));
      await saveAnnouncementImages(supabase, slot, inserted.id, imageUrls, settings);
      return res.status(201).json({ ...normalizeAnnouncement(inserted), image_urls: imageUrls });
    } catch (err) {
      if (isMissingTableError(err)) {
        // fallback to website_content
        const key = `announcement_${slot}`;
        const { data: wcData, error: wcError } = await supabase.from('website_content').select('*').eq('key', key).maybeSingle();
        let items = [];
        if (wcData && wcData.content && Array.isArray(wcData.content.items)) items = wcData.content.items;
        const newItem = { id: `wc-${Date.now()}`, title: payload.title, text: payload.text, image_url: payload.image_url, image_urls: imageUrls, speed: payload.speed, enabled: payload.enabled };
        items.unshift(newItem);
        const { data: up, error: upErr } = await supabase.from('website_content').upsert({ key, content: { items }, updated_by: null }, { onConflict: 'key' }).select('*').single();
        if (upErr) throw upErr;
        return res.status(201).json(newItem);
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

const updateAnnouncement = async (req, res, next) => {
  try {
    const slot = req.params.slot;
    const id = req.params.id;
    if (!VALID_SLOTS[slot]) return res.status(400).json({ message: 'Invalid slot' });
    const table = VALID_SLOTS[slot];
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ message: 'Supabase is not configured' });

    const payload = {
      title: req.body.title || '',
      text: req.body.text || req.body.message || '',
      image_url: req.body.image_url || req.body.imageUrl || '',
      speed: Number(req.body.speed ?? 25),
      enabled: req.body.enabled === true || req.body.enabled === 'true',
      updated_at: new Date().toISOString(),
    };
    const imageUrls = Array.isArray(req.body.image_urls)
      ? req.body.image_urls.filter(Boolean)
      : splitImageUrls(payload.image_url);
    payload.image_url = imageUrls.join(',');

    try {
      let updated;
      const { data, error } = await supabase.from(table).upsert({ id, ...payload }, { onConflict: 'id' }).select('*').single();
      if (error) {
        if (isMissingColumnError(error) && Object.prototype.hasOwnProperty.call(payload, 'title')) {
          const retryPayload = { ...payload };
          delete retryPayload.title;
          const retried = await supabase.from(table).upsert({ id, ...retryPayload }, { onConflict: 'id' }).select('*').single();
          if (retried.error) throw retried.error;
          updated = retried.data;
        } else {
          throw error;
        }
      } else {
        updated = data;
      }
      const settings = await readSettings(supabase, slot).catch(() => ({}));
      await saveAnnouncementImages(supabase, slot, updated.id, imageUrls, settings);
      return res.json({ ...normalizeAnnouncement(updated), image_urls: imageUrls });
    } catch (err) {
      if (isMissingTableError(err)) {
        // update website_content fallback
        const key = `announcement_${slot}`;
        const { data: wcData, error: wcError } = await supabase.from('website_content').select('*').eq('key', key).maybeSingle();
        let items = [];
        if (wcData && wcData.content && Array.isArray(wcData.content.items)) items = wcData.content.items;
        const idx = items.findIndex((it) => String(it.id) === String(id));
        if (idx >= 0) items[idx] = { ...items[idx], ...payload };
        const { data: up, error: upErr } = await supabase.from('website_content').upsert({ key, content: { items }, updated_by: null }, { onConflict: 'key' }).select('*').single();
        if (upErr) throw upErr;
        return res.json(items[idx] || {});
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    const slot = req.params.slot;
    const id = req.params.id;
    if (!VALID_SLOTS[slot]) return res.status(400).json({ message: 'Invalid slot' });
    const table = VALID_SLOTS[slot];
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ message: 'Supabase is not configured' });

    try {
      const { data, error } = await supabase.from(table).delete().eq('id', id).select('*').single();
      if (error) throw error;
      return res.json({ message: 'deleted' });
    } catch (err) {
      if (isMissingTableError(err)) {
        // remove from website_content
        const key = `announcement_${slot}`;
        const { data: wcData } = await supabase.from('website_content').select('*').eq('key', key).maybeSingle();
        let items = [];
        if (wcData && wcData.content && Array.isArray(wcData.content.items)) items = wcData.content.items;
        items = items.filter((it) => String(it.id) !== String(id));
        const { data: up, error: upErr } = await supabase.from('website_content').upsert({ key, content: { items }, updated_by: null }, { onConflict: 'key' }).select('*').single();
        if (upErr) throw upErr;
        return res.json({ message: 'deleted' });
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { listAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, listAnnouncementsPublic, saveSettings };
