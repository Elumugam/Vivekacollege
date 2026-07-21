"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiJson } from "@/lib/api";
import { UploadBtn } from "./CmsHelpers";

export default function AnnouncementBarAdmin({ token }: { token: string | null }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [slot, setSlot] = useState<'top'|'hero'>('top');
  const [settings, setSettings] = useState<any>({});

  const parseImages = (item: any) => {
    if (Array.isArray(item?.image_urls)) return item.image_urls.filter(Boolean);
    if (item?.image_url) return String(item.image_url).split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  };

  const load = async () => {
    setLoading(true);
    try {
      if (!token) throw new Error('Admin token required');
      const rows = await apiJson<any[]>(`/announcement/${slot}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => []);
      setItems(Array.isArray(rows) ? rows : []);
      // load settings
      try {
        const s = await apiJson<any>(`/announcement/${slot}/settings`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({}));
        setSettings(s || {});
      } catch (err) {
        setSettings({});
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [slot]);

  const save = async (item: any) => {
    try {
      if (!token) throw new Error('Admin token required');
      const isNew = !item.id || String(item.id).startsWith('wc-');
      const payload: any = { text: item.text || '', speed: item.speed, enabled: !!item.enabled, title: item.title || '' };
      if (Array.isArray(item.image_urls)) payload.image_urls = item.image_urls.filter(Boolean);
      else if (item.image_url) payload.image_url = item.image_url;

      if (isNew) {
        await apiJson(`/announcement/${slot}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await apiJson(`/announcement/${slot}/${encodeURIComponent(item.id)}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      toast.success(item.id ? "Updated" : "Added");
      await load();
      window.dispatchEvent(new Event('announcements:updated'));
    } catch (err: any) {
      toast.error(err?.message || "Save failed");
    }
  };

  const saveSettings = async (changes: any) => {
    try {
      if (!token) throw new Error('Admin token required');
      const merged = { ...(settings || {}), ...(changes || {}) };
      await apiJson(`/announcement/${slot}/settings`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(merged) });
      setSettings(merged);
      toast.success('Settings saved');
      window.dispatchEvent(new Event('announcements:updated'));
    } catch (err: any) { toast.error(err?.message || 'Failed to save settings'); }
  };

  const remove = async (id: any) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      if (!token) throw new Error('Admin token required');
      await apiJson(`/announcement/${slot}/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      toast.success("Deleted");
      await load();
      window.dispatchEvent(new Event('announcements:updated'));
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  return (
    <div>
      <h2 className="font-serif text-2xl font-bold text-navy mb-4">Announcement Bar</h2>
      <p className="text-sm text-gray-500 mb-4">Manage the marquee announcements displayed on the homepage.</p>
      <div className="space-y-4">
        <div className="flex gap-2 items-center mb-2">
          <label className="text-sm text-gray-600">Slot:</label>
          <select value={slot} onChange={(e) => setSlot(e.target.value as any)} className="border rounded-sm p-2">
            <option value="top">Top Announcement Bar</option>
            <option value="hero">Hero Announcement Bar</option>
          </select>
        </div>
        <div className="rounded-sm border border-cream-dark bg-white p-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#9a0827]">Add Announcement</h3>
          <div className="grid gap-2 md:grid-cols-3 mt-3">
            <input placeholder="Announcement title" className="col-span-2 border p-2 rounded-sm" onChange={(e) => setEditing({ ...editing, title: e.target.value })} value={editing?.title || ""} />
            <input placeholder="Speed (seconds)" className="border p-2 rounded-sm" type="number" onChange={(e) => setEditing({ ...editing, speed: Number(e.target.value) })} value={editing?.speed || 25} />
            <textarea placeholder="Announcement text" className="col-span-3 border p-2 rounded-sm min-h-20" onChange={(e) => setEditing({ ...editing, text: e.target.value })} value={editing?.text || ""} />
          </div>
          <div className="flex gap-2 mt-3">
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!editing?.enabled} onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })} /> Enabled</label>
            <div className="ml-auto flex items-center gap-2">
              <UploadBtn label={"Upload Image"} bucket="cms-media" token={token || ''} page={`announcement-${slot}`} section={`announcement-${slot}`} onUrl={(u) => setEditing({ ...editing, image_urls: [...parseImages(editing), u] })} />
              <button onClick={() => { save({ ...(editing || {}), image_urls: parseImages(editing), enabled: editing?.enabled ?? true, speed: editing?.speed ?? 25 }); setEditing(null); }} className="rounded-sm bg-[#9a0827] px-3 py-2 text-white">{editing?.id ? 'Update' : 'Add'}</button>
            </div>
          </div>
          {parseImages(editing).length > 0 && (
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
              {parseImages(editing).map((u: string, idx: number) => (
                <div key={idx} className="rounded-sm border p-1">
                  <div className="h-16 overflow-hidden rounded-sm border">
                    <img src={u} className="w-full h-full object-cover" alt="uploaded" />
                  </div>
                  <div className="mt-1 flex gap-1">
                    <button onClick={() => setEditing({ ...editing, image_urls: parseImages(editing).filter((_: any, i: number) => i !== idx) })} className="text-xs text-red-600">Delete</button>
                    <button onClick={() => {
                      const arr = parseImages(editing);
                      if (idx <= 0) return;
                      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                      setEditing({ ...editing, image_urls: arr });
                    }} className="text-xs">Up</button>
                    <button onClick={() => {
                      const arr = parseImages(editing);
                      if (idx >= arr.length - 1) return;
                      [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                      setEditing({ ...editing, image_urls: arr });
                    }} className="text-xs">Down</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="rounded-sm border border-cream-dark bg-white p-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#9a0827]">Announcement Bar Settings</h3>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <label className="text-xs">Image width (px)
                <input type="number" className="w-full border p-2 rounded-sm mt-1" value={settings?.image_width || settings?.imageWidth || ''} onChange={(e) => setSettings({ ...settings, image_width: Number(e.target.value) })} />
              </label>
              <label className="text-xs">Image height (px)
                <input type="number" className="w-full border p-2 rounded-sm mt-1" value={settings?.image_height || settings?.imageHeight || ''} onChange={(e) => setSettings({ ...settings, image_height: Number(e.target.value) })} />
              </label>
              <label className="text-xs">Gap between images (px)
                <input type="number" className="w-full border p-2 rounded-sm mt-1" value={settings?.image_gap || settings?.gap || ''} onChange={(e) => setSettings({ ...settings, image_gap: Number(e.target.value) })} />
              </label>
              <label className="text-xs">Image border radius (px)
                <input type="number" className="w-full border p-2 rounded-sm mt-1" value={settings?.image_border_radius || ''} onChange={(e) => setSettings({ ...settings, image_border_radius: Number(e.target.value) })} />
              </label>
              <label className="text-xs">Image object fit
                <select className="w-full border p-2 rounded-sm mt-1" value={settings?.image_object_fit || 'cover'} onChange={(e) => setSettings({ ...settings, image_object_fit: e.target.value })}>
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                </select>
              </label>
              <label className="text-xs">Scroll speed (seconds)
                <input type="number" className="w-full border p-2 rounded-sm mt-1" value={settings?.scroll_speed || settings?.speed || 25} onChange={(e) => setSettings({ ...settings, scroll_speed: Number(e.target.value) })} />
              </label>
              <label className="text-xs">Pause on hover
                <select className="w-full border p-2 rounded-sm mt-1" value={settings?.pause_on_hover === false ? 'false' : 'true'} onChange={(e) => setSettings({ ...settings, pause_on_hover: e.target.value === 'true' })}>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </label>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => saveSettings(settings)} className="ml-auto rounded-sm bg-[#9a0827] px-3 py-2 text-white">Save Settings</button>
            </div>
          </div>
            {loading && <p className="text-sm text-gray-500">Loading…</p>}
          {items.map((it) => (
            <div key={it.id} className="rounded-sm border border-cream-dark bg-white p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-navy truncate">{it.title || it.text}</p>
                <p className="text-xs text-gray-500">{it.enabled ? 'Enabled' : 'Disabled'} · Speed: {it.speed || 25}s</p>
                {parseImages(it).length > 0 && (
                  <div className="mt-1 flex gap-1">
                    {parseImages(it).slice(0, 4).map((u: string, idx: number) => (
                      <img key={idx} src={u} className="w-8 h-8 rounded-sm object-cover border" alt="announcement" />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing({ ...it, image_urls: parseImages(it) })} className="rounded-sm bg-[#0b3568] px-3 py-2 text-white text-[11px]">Edit</button>
                <button onClick={() => save({ ...it, enabled: !it.enabled })} className={`rounded-sm px-3 py-2 text-white text-[11px] ${it.enabled ? 'bg-gray-500' : 'bg-maroon'}`}>{it.enabled ? 'Disable' : 'Enable'}</button>
                <button onClick={() => remove(it.id)} className="rounded-sm bg-[#9a0827] px-3 py-2 text-white text-[11px]">Delete</button>
              </div>
            </div>
          ))}
          {items.length === 0 && !loading && <p className="text-sm text-gray-500">No announcements yet.</p>}
        </div>
      </div>
    </div>
  );
}
