"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { apiMultipart, fetchPublicJson, uploadFile, deleteFile } from "@/lib/api";
import { buildMediaSectionValue, getMediaPageLabel, getMediaSectionLabel, getMediaType, MEDIA_SECTION_GROUPS, parseMediaSectionValue, normalizeMediaAsset } from "@/lib/media";

export default function MediaManager({ token }: { token: string | null }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const media = await fetchPublicJson<any[]>(`/media${page ? `?page=${encodeURIComponent(page)}` : ''}`);
        if (Array.isArray(media)) {
          const mapped = media.map((mediaItem: any) => {
            const normalized = normalizeMediaAsset(mediaItem);
            return {
              ...normalized,
              assignmentValue: buildMediaSectionValue(normalized.page_name, normalized.section_name),
              created_at: normalized.created_at,
            };
          });
          setItems(mapped);
        } else {
          setItems([]);
        }
      } catch (err) {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!token) return toast.error('Admin token required');
    try {
      // When uploading from Media Manager, include page filter if selected so the server records meta
      const url = await uploadFile(f, 'cms-media', token, { page: page || undefined });
      toast.success('Uploaded');
      const refreshed = await fetchPublicJson<any[]>(`/media${page ? `?page=${encodeURIComponent(page)}` : ''}`);
      if (Array.isArray(refreshed)) {
        setItems(refreshed.map((mediaItem: any) => ({
          ...normalizeMediaAsset(mediaItem),
          assignmentValue: buildMediaSectionValue(
            String(mediaItem.page_name || mediaItem.meta?.page_name || '').toLowerCase(),
            String(mediaItem.section_name || mediaItem.meta?.section_name || '').toLowerCase()
          ),
        })));
      } else {
        setItems((s) => [{ id: `upload-${Date.now()}`, url, name: f.name, bucket: 'cms-media', media_type: getMediaType({ url, name: f.name }) }, ...s]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      e.target.value = '';
    }
  };

  const handleAssignmentSave = async (item: any) => {
    if (!token) return toast.error('Admin token required');
    const { pageName, sectionName } = parseMediaSectionValue(item.assignmentValue || '');
    if (!pageName || !sectionName) {
      toast.error('Assign a section first');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('page_name', pageName);
      formData.append('section_name', sectionName);
      formData.append('media_type', item.media_type || getMediaType(item));
      formData.append('bucket', item.bucket || 'cms-media');
      await apiMultipart(`/media/${encodeURIComponent(String(item.id))}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      setItems((current) => current.map((currentItem) => currentItem.id === item.id ? { ...currentItem, assignmentValue: buildMediaSectionValue(pageName, sectionName), page_name: pageName, section_name: sectionName } : currentItem));
      toast.success('Saved');
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    }
  };

  const handleReplace = async (item: any, file?: File) => {
    if (!file) return;
    if (!token) return toast.error('Admin token required');
    try {
      const { pageName, sectionName } = parseMediaSectionValue(item.assignmentValue || buildMediaSectionValue(item.page_name, item.section_name));
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', item.bucket || 'cms-media');
      formData.append('page_name', pageName || item.page_name || '');
      formData.append('section_name', sectionName || item.section_name || '');
      formData.append('media_type', item.media_type || getMediaType(item));
      const updated = await apiMultipart<any>(`/media/${encodeURIComponent(String(item.id))}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const normalizedUpdated = normalizeMediaAsset(updated);
      setItems((current) => current.map((currentItem) => currentItem.id === item.id ? {
        ...normalizedUpdated,
        assignmentValue: buildMediaSectionValue(normalizedUpdated.page_name, normalizedUpdated.section_name),
      } : currentItem));
      const refreshed = await fetchPublicJson<any[]>(`/media${page ? `?page=${encodeURIComponent(page)}` : ''}`);
      setItems(Array.isArray(refreshed) ? refreshed.map((mediaItem: any) => ({
        ...normalizeMediaAsset(mediaItem),
        assignmentValue: buildMediaSectionValue(
          String(mediaItem.page_name || mediaItem.meta?.page_name || '').toLowerCase(),
          String(mediaItem.section_name || mediaItem.meta?.section_name || '').toLowerCase()
        ),
      })) : []);
      toast.success('Updated');
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    }
  };

  const handleDelete = async (item: any) => {
    if (!token) return toast.error('Admin token required');
    if (!confirm('Delete this media?')) return;
    try {
      const bucket = item.bucket || 'cms-media';
      await deleteFile(bucket, item.url, token);
      setItems((s) => s.filter((i) => i.id !== item.id));
      toast.success('Deleted');
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const mediaType = getMediaType(it);
      if (filterType === 'images' && mediaType === 'video') return false;
      if (filterType === 'videos' && mediaType !== 'video') return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return [
        it.name,
        it.bucket,
        getMediaPageLabel(it.page_name),
        getMediaSectionLabel(it.page_name, it.section_name),
      ].some((value) => String(value || '').toLowerCase().includes(q));
    });
  }, [filterType, items, query]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-2xl font-bold text-navy">Media Manager</h2>
          <div className="flex items-center gap-2">
            <select value={page} onChange={(e) => setPage(e.target.value)} className="rounded-sm border border-cream-dark bg-white px-3 py-2 text-sm">
              <option value="">All pages</option>
              <option value="home">Home</option>
              <option value="about">About</option>
              <option value="courses">Courses</option>
              <option value="gallery">Gallery</option>
              <option value="contact">Contact</option>
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="rounded-sm border border-cream-dark bg-white px-3 py-2 text-sm">
              <option value="all">All media</option>
              <option value="images">Images</option>
              <option value="videos">Videos</option>
            </select>
            <input placeholder="Search name, page, section" value={query} onChange={(e)=>setQuery(e.target.value)} className="rounded-sm border border-cream-dark bg-white px-3 py-2 text-sm" />
            <label className="cursor-pointer bg-[#0b3568] text-white px-4 py-2 rounded-sm">
              Upload
              <input type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
            </label>
          </div>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading media…</p>}
      {!loading && items.length === 0 && <p className="text-sm text-gray-500">No media found.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredItems.map((item, index) => {
          const mediaType = getMediaType(item);
          return (
            <div key={`${item.id || item.url || item.name || 'media'}-${index}`} className="rounded-sm border border-cream-dark bg-white p-2">
              {mediaType === 'video' ? (
                <video src={item.url} controls className="w-full h-36 object-cover" />
              ) : (
                <img src={item.url} alt={item.name} className="w-full h-36 object-cover" />
              )}
              <div className="mt-2 space-y-1">
                <p className="text-xs font-semibold truncate">{item.name}</p>
                <p className="text-xs text-gray-500">{mediaType}</p>
                <p className="text-xs text-gray-500">{getMediaPageLabel(item.page_name)}</p>
                <p className="text-xs text-gray-500">{getMediaSectionLabel(item.page_name, item.section_name)}</p>
                <p className="text-xs text-gray-400">{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</p>
              </div>
              <div className="mt-3 space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-navy">
                  Assign Section
                  <select
                    value={item.assignmentValue || buildMediaSectionValue(item.page_name, item.section_name)}
                    onChange={(event) => setItems((current) => current.map((currentItem) => currentItem.id === item.id ? { ...currentItem, assignmentValue: event.target.value } : currentItem))}
                    className="mt-1 w-full rounded-sm border border-cream-dark bg-white px-3 py-2 text-sm text-navy"
                  >
                    <option value="">Select section</option>
                    {MEDIA_SECTION_GROUPS.map((group) => (
                      <optgroup key={group.pageName} label={group.pageLabel}>
                        {group.sections.map((section) => (
                          <option key={`${group.pageName}|${section.value}`} value={buildMediaSectionValue(group.pageName, section.value)}>
                            {section.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => window.open(item.url, '_blank')} className="text-xs text-navy">Preview</button>
                  <label className="cursor-pointer text-xs text-blue-600">
                    Replace
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        await handleReplace(item, file);
                        event.target.value = '';
                      }}
                    />
                  </label>
                  <button onClick={() => handleAssignmentSave(item)} className="text-xs text-[#9a0827]">Save</button>
                  <button onClick={() => handleDelete(item)} className="text-xs text-red-600">Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
