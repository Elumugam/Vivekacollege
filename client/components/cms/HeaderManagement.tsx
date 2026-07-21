"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiJson } from "@/lib/api";
import { Field, SectionHeader, UploadBtn, MediaPreview, SaveBtn, inp, label } from "./CmsHelpers";

const PAGES = ["home", "about", "courses", "gallery", "contact"];

export default function HeaderManagement({ token }: { token: string | null }) {
  const [page, setPage] = useState<string>(PAGES[0]);
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState<any>({
    media_type: 'image', media_url: '', desktop_height: 520, tablet_height: 360, mobile_height: 260,
    overlay_enabled: true, overlay_opacity: 0.5, object_fit: 'cover', video_autoplay: false, video_loop: false, video_muted: true,
  });

  useEffect(() => {
    const load = async () => {
      const res = await apiJson<any>(`/hero-settings?page=${encodeURIComponent(page)}`).catch(() => null);
      if (res) setSettings((s:any) => ({ ...s, ...res, media_url: res.media_url || '', media_type: res.media_type || s.media_type || 'image' }));
      else setSettings((s:any) => ({ ...s, media_url: '', media_type: s.media_type || 'image' }));
    };
    load();
  }, [page]);

  const onUploadUrl = (url: string) => setSettings((s:any) => ({ ...s, media_url: url }));

  const save = async () => {
    if (!token) return toast.error('Admin token required');
    setBusy(true);
    try {
      const payload = { ...settings, page_name: page, media_url: settings.media_url || '', media_type: settings.media_type || 'image' };
      await apiJson(`/hero-settings`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` , 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      toast.success('Saved');
      try {
        // notify other tabs for live preview
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('hero_settings_update', JSON.stringify({ page: page, media_url: payload.media_url, media_type: payload.media_type, ts: Date.now() }));
        }
      } catch (e) {}
    } catch (err: any) { toast.error(err.message || 'Save failed'); }
    finally { setBusy(false); }
  };

  const reset = async () => {
    // Reset to defaults by clearing media_url and restoring defaults
    setSettings({ media_type: 'image', media_url: '', desktop_height: 520, tablet_height: 360, mobile_height: 260, overlay_enabled: true, overlay_opacity: 0.5, object_fit: 'cover', video_autoplay: false, video_loop: false, video_muted: true });
  };

  return (
    <div>
      <SectionHeader title="Header Management" subtitle="Manage hero media per page" />

      <div className="mb-4 flex items-center gap-2">
        {PAGES.map(p => (
          <button key={p} onClick={() => setPage(p)} className={`rounded-sm px-3 py-2 text-sm font-semibold ${page===p? 'bg-[#9a0827] text-white': 'bg-white/5 text-[#072d5a]'}`}>
            {p[0].toUpperCase()+p.slice(1)} Page
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-sm border border-cream-dark bg-white p-4">
          <Field name="Media Type">
            <select className={inp} value={settings.media_type} onChange={(e)=>setSettings((s:any)=>({...s, media_type: e.target.value}))}>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </Field>

          <Field name="Upload/Replace">
            <div className="flex items-center gap-2">
              <UploadBtn label={settings.media_type==='video'? 'Upload Video' : 'Upload Image'} bucket="hero-media" token={token||''} onUrl={(url)=>onUploadUrl(url)} accept={settings.media_type==='video'? 'video/*' : 'image/*'} />
              <button onClick={()=>setSettings((s:any)=>({...s, media_url: ''}))} className="text-sm text-red-600">Delete</button>
            </div>
            <MediaPreview url={settings.media_url || ''} type={settings.media_type==='video'? 'video' : 'image'} />
          </Field>

          <Field name="Desktop height">
            <input className={inp} value={settings.desktop_height||''} onChange={(e)=>setSettings((s:any)=>({...s, desktop_height: Number(e.target.value||0)}))} />
          </Field>
          <Field name="Tablet height">
            <input className={inp} value={settings.tablet_height||''} onChange={(e)=>setSettings((s:any)=>({...s, tablet_height: Number(e.target.value||0)}))} />
          </Field>
          <Field name="Mobile height">
            <input className={inp} value={settings.mobile_height||''} onChange={(e)=>setSettings((s:any)=>({...s, mobile_height: Number(e.target.value||0)}))} />
          </Field>
        </div>

        <div className="rounded-sm border border-cream-dark bg-white p-4">
          <Field name="Overlay Enabled">
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!settings.overlay_enabled} onChange={(e)=>setSettings((s:any)=>({...s, overlay_enabled: e.target.checked}))} /> Enable overlay</label>
          </Field>
          <Field name="Overlay Opacity">
            <input type="range" min={0} max={1} step={0.05} value={settings.overlay_opacity||0} onChange={(e)=>setSettings((s:any)=>({...s, overlay_opacity: Number(e.target.value)}))} />
            <div className="text-sm text-gray-600 mt-1">{settings.overlay_opacity}</div>
          </Field>
          <Field name="Object fit">
            <select className={inp} value={settings.object_fit} onChange={(e)=>setSettings((s:any)=>({...s, object_fit: e.target.value}))}>
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
            </select>
          </Field>

          {settings.media_type === 'video' && (
            <>
              <Field name="Auto play video"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!settings.video_autoplay} onChange={(e)=>setSettings((s:any)=>({...s, video_autoplay: e.target.checked}))} /> Auto play</label></Field>
              <Field name="Loop video"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!settings.video_loop} onChange={(e)=>setSettings((s:any)=>({...s, video_loop: e.target.checked}))} /> Loop</label></Field>
              <Field name="Mute video"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!settings.video_muted} onChange={(e)=>setSettings((s:any)=>({...s, video_muted: e.target.checked}))} /> Mute</label></Field>
            </>
          )}

          <div className="mt-4 flex items-center gap-3">
            <SaveBtn onClick={save} busy={busy} />
            <button onClick={reset} className="rounded-sm border border-cream-dark px-4 py-2 text-sm">Reset</button>
            <button onClick={()=>{ if (settings.media_url) window.open(settings.media_url, '_blank'); }} className="rounded-sm border border-cream-dark px-4 py-2 text-sm">Preview</button>
          </div>
        </div>
      </div>
    </div>
  );
}
