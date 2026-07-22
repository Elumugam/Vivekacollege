const getBaseApiUrl = () => {
    const raw = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "/api").trim().replace(/\/$/, "");
    if (!raw) return "/api";
    if (raw.startsWith("/")) {
        return raw.endsWith("/api") ? raw : `${raw}/api`;
    }
    return raw.endsWith("/api") ? raw : `${raw}/api`;
};

export const API_URL = getBaseApiUrl();

const DEFAULT_TIMEOUT_MS = 3000;

const buildApiUrl = (path: string) => {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    if (cleanPath.startsWith("/api/") && API_URL.endsWith("/api")) {
        return `${API_URL.slice(0, -4)}${cleanPath}`;
    }
    return `${API_URL}${cleanPath}`;
};

export const apiRequest = async (path: string, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(buildApiUrl(path), {
            ...init,
            signal: controller.signal,
        });
    } finally {
        globalThis.clearTimeout(timeoutId);
    }
};

export const apiJson = async <T>(path: string, init: RequestInit = {}, timeoutMs = 8000): Promise<T> => {
    const headers = new Headers(init.headers || {});
    if (init.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }
    
    const response = await apiRequest(path, { ...init, headers }, timeoutMs);
    const body = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(body?.message || `Request failed with status ${response.status}`);
    }

    return body as T;
};

export const fetchPublicJson = async <T>(path: string, timeoutMs = 8000): Promise<T | null> => {
    try {
        const response = await fetch(buildApiUrl(path), {
            cache: 'no-store',
            signal: AbortSignal.timeout(timeoutMs),
        });

        const body = await response.json().catch(() => null);
        if (!response.ok) return null;
        return body as T;
    } catch (error) {
        return null;
    }
};

export const apiMultipart = async <T>(path: string, init: RequestInit = {}, timeoutMs = 30000): Promise<T> => {
    // DO NOT set Content-Type for FormData, the browser sets it with the boundary automatically
    const response = await apiRequest(path, init, timeoutMs);
    const body = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(body?.message || `Request failed with status ${response.status}`);
    }

    return body as T;
};

export const uploadFile = async (file: File, bucket: string, token: string, opts?: { page?: string; section?: string }): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    // bucket passed as query param so Express gets it before multer parses the multipart body
    let url = `/upload?bucket=${encodeURIComponent(bucket)}`;
    if (opts?.page) url += `&page=${encodeURIComponent(opts.page)}`;
    if (opts?.section) url += `&section=${encodeURIComponent(opts.section)}`;
    const result = await apiMultipart<{ url: string }>(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    }, 30000);
    return result.url;
};

export const deleteFile = async (bucket: string, fileUrl: string, token: string) => {
    if (!fileUrl) return;

    await apiJson<{ message: string }>(`/upload?bucket=${encodeURIComponent(bucket)}&url=${encodeURIComponent(fileUrl)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    }, 30000);
};

export const getCourses = async () => {
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    try {
        const res = await fetch(buildApiUrl('/courses'), { 
            cache: 'no-store',
            signal: controller.signal
        });
        if (!res.ok) throw new Error("Failed to fetch courses");
        return await res.json();
    } catch (error) {
        console.error(error);
        return [];
    } finally {
        globalThis.clearTimeout(timeoutId);
    }
};

export const getCourseById = async (id: string) => {
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    try {
        const res = await fetch(buildApiUrl(`/courses/slug/${id}`), { 
            cache: 'no-store',
            signal: controller.signal
        });
        if (!res.ok) throw new Error("Failed to fetch course");
        return await res.json();
    } catch (error) {
        console.error(error);
        return null;
    } finally {
        globalThis.clearTimeout(timeoutId);
    }
};
