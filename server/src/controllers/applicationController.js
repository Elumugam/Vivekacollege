const { createClient } = require('@supabase/supabase-js');
const fs = require('fs/promises');
const path = require('path');
const { getSupabaseAdminClient, isMissingTableError } = require('../lib/supabase');

const getApplicationWriteClient = () => {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';
    const key = serviceKey || anonKey;
    if (!url || !key) return null;

    return createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
            fetch: (...args) => {
                const [fetchUrl, options] = args;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);
                return fetch(fetchUrl, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeoutId));
            }
        }
    });
};

const FALLBACK_APPLICATIONS_FILE = path.join(__dirname, '..', '..', 'uploads', 'applications_fallback.json');

const readFallbackApplications = async () => {
    try {
        const raw = await fs.readFile(FALLBACK_APPLICATIONS_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
};

const writeFallbackApplications = async (applications) => {
    await fs.mkdir(path.dirname(FALLBACK_APPLICATIONS_FILE), { recursive: true });
    await fs.writeFile(FALLBACK_APPLICATIONS_FILE, JSON.stringify(applications, null, 2), 'utf8');
};

const buildApplicationRecord = (req, documents, createdAt) => ({
    id: `local-${Date.now()}`,
    fullName: req.body.fullName || req.body.name || '',
    name: req.body.fullName || req.body.name || '',
    dob: req.body.dob || '',
    gender: req.body.gender || '',
    email: req.body.email || '',
    mobile: req.body.mobile || req.body.phone || '',
    phone: req.body.mobile || req.body.phone || '',
    courseId: req.body.courseId || '',
    course: req.body.courseId || req.body.course || '',
    courseTitle: req.body.courseTitle || req.body.courseName || '',
    courseType: req.body.courseType || '',
    address: req.body.address || '',
    qualification: req.body.qualification || '',
    message: [
        req.body.dob ? `DOB: ${req.body.dob}` : '',
        req.body.gender ? `Gender: ${req.body.gender}` : '',
        req.body.courseType ? `Course Type: ${req.body.courseType}` : '',
        req.body.address ? `Address: ${req.body.address}` : '',
        req.body.qualification ? `Qualification: ${req.body.qualification}` : '',
    ].filter(Boolean).join('\n'),
    documents,
    created_at: createdAt,
});

const uploadBucket = process.env.SUPABASE_STORAGE_BUCKET || 'applications';

const safeFileName = (value) => String(value || 'file').replace(/[^a-zA-Z0-9._-]/g, '-');

const buildSubmissionKey = (record) => [
    record.created_at || '',
    record.name || record.fullName || '',
    record.email || '',
    record.phone || record.mobile || '',
    record.course || record.courseId || '',
    record.courseType || '',
].join('|');

const normalizeApplicationRecord = (record = {}) => ({
    id: record.id || record.submissionKey || `local-${Date.now()}`,
    submissionKey: record.submissionKey || buildSubmissionKey(record),
    fullName: record.fullName || record.name || '',
    name: record.name || record.fullName || '',
    dob: record.dob || '',
    gender: record.gender || '',
    email: record.email || '',
    mobile: record.mobile || record.phone || '',
    phone: record.phone || record.mobile || '',
    courseId: record.courseId || '',
    course: record.course || record.courseId || '',
    courseTitle: record.courseTitle || record.courseName || '',
    courseType: record.courseType || record.course_type || '',
    address: record.address || '',
    qualification: record.qualification || '',
    documents: Array.isArray(record.documents) ? record.documents : [],
    message: record.message || '',
    created_at: record.created_at || record.createdAt || new Date().toISOString(),
});

const buildDatabasePayload = (payload) => ({
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    course: payload.course,
    message: payload.message,
    created_at: payload.created_at,
});

const createApplication = async (req, res, next) => {
    try {
        const supabase = getApplicationWriteClient() || getSupabaseAdminClient();

        if (!supabase) {
            return res.status(503).json({ message: 'Supabase is not configured' });
        }

        const documents = [];
        let fileUploadFailed = false;

        for (const file of req.files || []) {
            const fileName = `${Date.now()}-${safeFileName(file.originalname)}`;
            const uploadResult = await supabase.storage.from(uploadBucket).upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });

            if (uploadResult.error) {
                fileUploadFailed = true;
                documents.push({
                    originalName: file.originalname,
                    fileName,
                    filePath: null,
                    mimeType: file.mimetype,
                    uploadError: uploadResult.error.message,
                });
                continue;
            }

            const { data: publicUrl } = supabase.storage.from(uploadBucket).getPublicUrl(fileName);

            documents.push({
                originalName: file.originalname,
                fileName,
                filePath: publicUrl?.publicUrl || fileName,
                mimeType: file.mimetype,
            });
        }

        if (fileUploadFailed) {
            return res.status(500).json({ message: 'File upload failed' });
        }

        const createdAt = new Date().toISOString();
        const payload = normalizeApplicationRecord(buildApplicationRecord(req, documents, createdAt));
        const databasePayload = buildDatabasePayload(payload);

        let result = await supabase.from('applications').insert(payload).select('*').single();
        if (result.error) {
            result = await supabase.from('applications').insert(databasePayload).select('*').single();
        }

        const { data, error } = result;

        if (error) {
            const fallbackApplications = await readFallbackApplications();
            fallbackApplications.unshift(payload);
            await writeFallbackApplications(fallbackApplications);
            return res.status(201).json(payload);
        }

        const fallbackApplications = await readFallbackApplications();
        const existingIndex = fallbackApplications.findIndex((record) => buildSubmissionKey(record) === payload.submissionKey);
        if (existingIndex >= 0) {
            fallbackApplications[existingIndex] = { ...normalizeApplicationRecord(fallbackApplications[existingIndex]), ...payload };
        } else {
            fallbackApplications.unshift(payload);
        }
        await writeFallbackApplications(fallbackApplications);

        res.status(201).json(data);
    } catch (error) {
        next(error);
    }
};

const getApplications = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();

        if (!supabase) {
            return res.json([]);
        }

        const { data, error } = await supabase.from('applications').select('*');

        if (error) {
            if (isMissingTableError(error)) {
                const fallbackApplications = await readFallbackApplications();
                return res.json(fallbackApplications);
            }
            throw error;
        }

        const fallbackApplications = await readFallbackApplications();
        const mergedApplications = new Map();

        [...(data || []), ...fallbackApplications].forEach((record) => {
            const normalized = normalizeApplicationRecord(record);
            const existing = mergedApplications.get(normalized.submissionKey);
            mergedApplications.set(normalized.submissionKey, existing ? { ...normalized, ...existing, documents: existing.documents?.length ? existing.documents : normalized.documents } : normalized);
        });

        const combined = Array.from(mergedApplications.values()).sort((left, right) => new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime());
        res.json(combined);
    } catch (error) {
        next(error);
    }
};

const updateApplicationStatus = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();

        if (!supabase) {
            return res.status(503).json({ message: 'Supabase is not configured' });
        }

        const updatePayload = {
            status: req.body.status,
            notes: req.body.notes,
        };

        const { data, error } = await supabase.from('applications').update(updatePayload).eq('id', req.params.id).select('*').maybeSingle();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: 'Application not found' });
        res.json(data);
    } catch (error) {
        next(error);
    }
};

const deleteApplication = async (req, res, next) => {
    try {
        const supabase = getSupabaseAdminClient();
        const applicationId = String(req.params.id || '');

        if (applicationId.startsWith('local-')) {
            const fallbackApplications = await readFallbackApplications();
            const remainingFallbackApplications = fallbackApplications.filter((record) => String(record.id) !== applicationId);

            if (remainingFallbackApplications.length === fallbackApplications.length) {
                return res.status(404).json({ message: 'Application not found' });
            }

            await writeFallbackApplications(remainingFallbackApplications);
            return res.json({ message: 'Application deleted' });
        }

        if (!supabase) {
            return res.status(503).json({ message: 'Supabase is not configured' });
        }

        const { data, error } = await supabase.from('applications').delete().eq('id', applicationId).select('*').maybeSingle();

        if (error) {
            if (!isMissingTableError(error)) throw error;
        } else if (data) {
            const fallbackApplications = await readFallbackApplications();
            const remainingFallbackApplications = fallbackApplications.filter((record) => String(record.id) !== applicationId && buildSubmissionKey(record) !== buildSubmissionKey(data));
            if (remainingFallbackApplications.length !== fallbackApplications.length) {
                await writeFallbackApplications(remainingFallbackApplications);
            }
            return res.json({ message: 'Application deleted' });
        }

        const fallbackApplications = await readFallbackApplications();
        const remainingFallbackApplications = fallbackApplications.filter((record) => String(record.id) !== applicationId);

        if (remainingFallbackApplications.length === fallbackApplications.length) {
            return res.status(404).json({ message: 'Application not found' });
        }

        await writeFallbackApplications(remainingFallbackApplications);
        res.json({ message: 'Application deleted' });
    } catch (error) {
        next(error);
    }
};

module.exports = { createApplication, getApplications, updateApplicationStatus, deleteApplication };
