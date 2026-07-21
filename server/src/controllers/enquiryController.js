const nodemailer = require('nodemailer');
const { getSupabaseAdminClient, isMissingTableError } = require('../lib/supabase');

const SETTINGS_TABLES = ['enquiry_settings', 'enquiry_popup_settings'];

const normalizeSettings = (row = {}) => ({
  id: row.id,
  enabled: row.enabled === true || row.enabled === 'true',
  title: row.title || 'Enquiry',
  description: row.description || '',
  show_name: row.show_name !== false,
  show_email: row.show_email !== false,
  show_phone: row.show_phone !== false,
  show_message: row.show_message !== false,
  button_text: row.button_text || row.buttonText || 'Submit',
  success_message: row.success_message || row.successMessage || 'Thank you. We will contact you soon.',
  popup_image: row.popup_image || row.popupImage || '',
  display_delay: Number(row.display_delay ?? row.displayDelay ?? 0),
  created_at: row.created_at || null,
  updated_at: row.updated_at || null,
});

const readSettingsFromTables = async (supabase) => {
  for (const table of SETTINGS_TABLES) {
    try {
      const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      if (data) return normalizeSettings(data);
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
    }
  }

  const { data, error } = await supabase.from('website_content').select('*').eq('key', 'enquiry_settings').maybeSingle();
  if (error) throw error;
  if (data && data.content) return normalizeSettings(data.content);

  const legacy = await supabase.from('website_content').select('*').eq('key', 'enquiry_popup_settings').maybeSingle();
  if (legacy.error) throw legacy.error;
  return normalizeSettings((legacy.data && legacy.data.content) || {});
};

const upsertSettingsToTables = async (supabase, payload) => {
  for (const table of SETTINGS_TABLES) {
    try {
      const writePayload = { ...payload };
      const { data, error } = await supabase.from(table).upsert(writePayload, { onConflict: 'id' }).select('*').single();
      if (error) throw error;
      return normalizeSettings(data);
    } catch (err) {
      if (!isMissingTableError(err)) throw err;
    }
  }

  const { data, error } = await supabase.from('website_content').upsert({ key: 'enquiry_settings', content: payload, updated_by: null }, { onConflict: 'key' }).select('*').single();
  if (error) throw error;
  return normalizeSettings(data.content || {});
};

const getSettings = async (req, res, next) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.json({});
    const settings = await readSettingsFromTables(supabase);
    return res.json(settings);
  } catch (error) {
    next(error);
  }
};

const getPublicSettings = async (req, res, next) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.json({ enabled: false });
    const settings = await readSettingsFromTables(supabase);
    return res.json(settings);
  } catch (error) {
    next(error);
  }
};

const saveSettings = async (req, res, next) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ message: 'Supabase not configured' });

    const payload = normalizeSettings(req.body || {});
    const saved = await upsertSettingsToTables(supabase, payload);
    return res.json(saved);
  } catch (error) {
    next(error);
  }
};

const trySendEmail = async ({ name, phone, email, description, created_at }) => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const toAddress = process.env.ENQUIRY_TO_EMAIL || 'vivekatechofficial@gmail.com';
  const fromAddress = process.env.ENQUIRY_FROM_EMAIL || smtpUser;

  if (!smtpHost || !smtpUser || !smtpPass || !fromAddress) {
    return { sent: false, reason: 'email_not_configured' };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const subject = `New enquiry from ${name || 'Website Visitor'}`;
  const text = [
    `Name: ${name || '-'}`,
    `Phone: ${phone || '-'}`,
    `Email: ${email || '-'}`,
    `Description/Purpose: ${description || '-'}`,
    `Date & Time: ${created_at}`,
  ].join('\n');

  await transporter.sendMail({
    from: fromAddress,
    to: toAddress,
    subject,
    text,
  });

  return { sent: true };
};

const submitEnquiry = async (req, res, next) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ message: 'Supabase not configured' });

    const name = (req.body.name || '').trim();
    const phone = (req.body.phone || '').trim();
    const email = (req.body.email || '').trim();
    const description = (req.body.description || req.body.message || '').trim();

    if (!name || !phone || !email || !description) {
      return res.status(400).json({ message: 'All enquiry fields are required' });
    }

    const created_at = new Date().toISOString();
    const payload = {
      name,
      phone,
      email,
      description,
      message: description,
      created_at,
    };

    let persistedId = null;
    try {
      const { data, error } = await supabase.from('enquiries').insert(payload).select('*').single();
      if (error) throw error;
      persistedId = data && data.id;
    } catch (err) {
      if (isMissingTableError(err)) {
        const key = 'enquiries';
        const { data: existing, error: readErr } = await supabase.from('website_content').select('*').eq('key', key).maybeSingle();
        if (readErr) throw readErr;
        const items = (existing && existing.content && Array.isArray(existing.content.items)) ? existing.content.items : [];
        const newItem = { id: `wc-${Date.now()}`, name, phone, email, description, message: description, created_at };
        items.unshift(newItem);
        const { error: upErr } = await supabase.from('website_content').upsert({ key, content: { items }, updated_by: null }, { onConflict: 'key' });
        if (upErr) throw upErr;
        persistedId = newItem.id;
      } else {
        throw err;
      }
    }

    try {
      const emailResult = await trySendEmail({ name, phone, email, description, created_at });
      if (!emailResult.sent) {
        return res.status(201).json({ message: 'Enquiry saved; email queued/config pending', id: persistedId, emailSent: false });
      }
      return res.status(201).json({ message: 'Enquiry submitted successfully', id: persistedId, emailSent: true });
    } catch (mailErr) {
      return res.status(201).json({ message: 'Enquiry saved but email failed temporarily', id: persistedId, emailSent: false });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, getPublicSettings, saveSettings, submitEnquiry };
