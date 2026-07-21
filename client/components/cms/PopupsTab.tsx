"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiJson } from "@/lib/api";
import { PopupTab } from "./ContentTabs";
import { UploadBtn } from "./CmsHelpers";

const emptyPopup = {
  id: null,
  enabled: false,
  title: "",
  message: "",
  ctaText: "",
  ctaUrl: "",
  imageUrl: "",
  videoUrl: "",
  mediaType: "image",
  displayDelay: 0,
  imageWidth: null,
  imageHeight: null,
};

export default function PopupsTab({ token }: { token: string }) {
  const [popups, setPopups] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [enquirySettings, setEnquirySettings] = useState<any | null>(null);
  const [editingEnquiry, setEditingEnquiry] = useState<boolean>(false);

  const ensureSettings = (raw: any = {}) => ({
    enabled: !!raw?.enabled,
    title: raw?.title || "Enquiry",
    description: raw?.description || "",
    show_name: raw?.show_name !== false,
    show_email: raw?.show_email !== false,
    show_phone: raw?.show_phone !== false,
    show_message: raw?.show_message !== false,
    button_text: raw?.button_text || "Submit",
    success_message: raw?.success_message || "Thank you. We will contact you soon.",
    popup_image: raw?.popup_image || "",
    display_delay: Number(raw?.display_delay ?? 0),
  });

  const load = async () => {
    setLoading(true);
    try {
      const rows = await apiJson<any[]>("/popup-poster", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
      setPopups(Array.isArray(rows) ? rows : []);
      // load enquiry settings
      try {
        const s = await apiJson<any>(`/enquiry/settings`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
        setEnquirySettings(ensureSettings(s || {}));
      } catch (err) { setEnquirySettings(ensureSettings({})); }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) load(); }, [token]);

  const handleDelete = async (item: any) => {
    const id = item?.id;
    if (!id) { toast.error('Invalid popup id'); return; }
    if (!confirm("Are you sure you want to delete this popup?")) return;
    try {
      await apiJson(`/popup-poster/${encodeURIComponent(id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ url: item?.media_url || item?.mediaUrl || '' }) });
      setPopups((current) => current.filter((popup) => popup.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success("Deleted");
      await load();
    } catch (err) { toast.error("Delete failed"); }
  };

  const handleDuplicate = async (id: any) => {
    if (!id) { toast.error('Invalid popup id'); return; }
    try {
      await apiJson(`/popup-poster/${encodeURIComponent(id)}/duplicate`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      toast.success("Duplicated");
      await load();
    } catch { toast.error("Duplicate failed"); }
  };

  const handleEdit = (item: any) => setSelected({ ...emptyPopup, ...item });
  const handleAdd = () => setSelected({ ...emptyPopup });

  const handleSave = async (keyOrNull: any, data: any) => {
    // PopupTab calls onSave with (key, value) signature; we ignore key here
    await load();
    toast.success("Saved");
  };

  return (
    <div className="space-y-6">
      {/* Enquiry Popup Card */}
      <div className="rounded-sm border border-cream-dark bg-white p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#9a0827]">Enquiry Popup</p>
          <h3 className="font-semibold text-navy mt-1">Enquiry Popup</h3>
          <p className="text-sm text-gray-500">Enable or configure the enquiry popup shown to visitors.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{enquirySettings?.enabled ? 'Enabled' : 'Disabled'}</span>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only"
              checked={!!enquirySettings?.enabled}
              onChange={async (e) => {
                if (!token) return toast.error('Admin token required');
                try {
                  const payload = ensureSettings({ ...(enquirySettings || {}), enabled: e.target.checked });
                  const saved = await apiJson<any>(`/enquiry/settings`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                  setEnquirySettings(ensureSettings(saved));
                  toast.success('Updated');
                } catch (err) { toast.error('Update failed'); }
              }}
            />
            <span className={`relative inline-block w-10 h-5 rounded-full transition-colors ${enquirySettings?.enabled ? 'bg-maroon' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${enquirySettings?.enabled ? 'translate-x-5' : ''}`}></span>
            </span>
          </label>
          <button onClick={() => setEditingEnquiry(true)} className="px-4 py-2 rounded-sm bg-[#9a0827] text-white">Edit</button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#9a0827]">Popups</p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-navy">Manage popup posters</h2>
          <p className="mt-1 text-sm text-slate-500">Create multiple popups, set image sizing, and control display.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleAdd} className="rounded-sm bg-[#9a0827] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">Add New Popup</button>
          <button onClick={load} className="rounded-sm border border-cream-dark bg-cream px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-navy">Refresh</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {loading && <div className="p-6 text-sm text-gray-500">Loading…</div>}
        {!loading && popups.length === 0 && <div className="p-6 text-sm text-gray-500">No popups configured.</div>}
        {!loading && popups.map(p => (
          <div key={p.id || Math.random()} className="rounded-sm border border-cream-dark bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="w-20 h-16 overflow-hidden rounded-sm bg-gray-100">
                {p.media_type === 'video' ? <video src={p.media_url} className="h-full w-full object-cover" /> : p.media_url ? <img src={p.media_url} className="h-full w-full object-cover" alt="popup"/> : <div className="p-3 text-xs text-gray-400">No media</div>}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-navy">{p.title || "Untitled"}</h3>
                  <div className="text-xs text-gray-500">{p.enabled ? "Enabled" : "Disabled"}</div>
                </div>
                <p className="mt-2 text-sm text-gray-500 line-clamp-2">{p.description || p.message || "No description"}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => handleEdit(p)} className="px-3 py-1 rounded-sm border text-[11px]">Edit</button>
                  <button onClick={() => handleDuplicate(p.id)} className="px-3 py-1 rounded-sm border text-[11px]">Duplicate</button>
                  <button onClick={() => handleDelete(p)} className="px-3 py-1 rounded-sm border text-[11px] text-red-600">Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="mt-6">
          <PopupTab data={selected} token={token} onChange={(v:any) => setSelected(v)} onSave={handleSave} />
        </div>
      )}
      {editingEnquiry && (
        <div className="mt-6 rounded-sm border border-cream-dark bg-white p-4">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#9a0827]">Enquiry Popup Settings</h3>
          <div className="grid gap-2 md:grid-cols-2 mt-3">
            <input placeholder="Title" className="border p-2 rounded-sm" value={enquirySettings?.title || ''} onChange={(e) => setEnquirySettings({ ...enquirySettings, title: e.target.value })} />
            <input placeholder="Button text" className="border p-2 rounded-sm" value={enquirySettings?.button_text || enquirySettings?.buttonText || ''} onChange={(e) => setEnquirySettings({ ...enquirySettings, button_text: e.target.value })} />
            <textarea placeholder="Description" className="border p-2 rounded-sm col-span-2" value={enquirySettings?.description || ''} onChange={(e) => setEnquirySettings({ ...enquirySettings, description: e.target.value })} />
            <input placeholder="Success message" className="border p-2 rounded-sm col-span-2" value={enquirySettings?.success_message || ''} onChange={(e) => setEnquirySettings({ ...enquirySettings, success_message: e.target.value })} />
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!enquirySettings?.show_name} onChange={(e) => setEnquirySettings({ ...enquirySettings, show_name: e.target.checked })} /> Show name</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!enquirySettings?.show_email} onChange={(e) => setEnquirySettings({ ...enquirySettings, show_email: e.target.checked })} /> Show email</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!enquirySettings?.show_phone} onChange={(e) => setEnquirySettings({ ...enquirySettings, show_phone: e.target.checked })} /> Show phone</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={!!enquirySettings?.show_message} onChange={(e) => setEnquirySettings({ ...enquirySettings, show_message: e.target.checked })} /> Show message</label>
            <div>
              <label className="text-xs">Display delay</label>
              <select className="w-full border p-2 rounded-sm" value={enquirySettings?.display_delay || 0} onChange={(e) => setEnquirySettings({ ...enquirySettings, display_delay: Number(e.target.value) })}>
                <option value={0}>Show immediately</option>
                <option value={2}>After 2 seconds</option>
                <option value={5}>After 5 seconds</option>
                <option value={10}>After 10 seconds</option>
                <option value={-1}>Custom...</option>
              </select>
              {Number(enquirySettings?.display_delay) === -1 && (
                <input type="number" className="w-full border p-2 rounded-sm mt-2" placeholder="Custom seconds" onChange={(e) => setEnquirySettings({ ...enquirySettings, display_delay: Math.max(0, Number(e.target.value || 0)) })} />
              )}
            </div>
            <div>
              <label className="text-xs">Popup image</label>
              <div className="mt-1"><UploadBtn label={enquirySettings?.popup_image ? 'Replace' : 'Upload'} bucket="cms-media" token={token || ''} onUrl={(u) => setEnquirySettings({ ...enquirySettings, popup_image: u })} /></div>
              {enquirySettings?.popup_image && <img src={enquirySettings.popup_image} className="w-24 h-16 object-cover mt-2" alt="popup" />}
            </div>
            <div className="col-span-2 rounded-sm border border-cream-dark bg-cream p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a0827]">Preview</p>
              <p className="mt-2 font-semibold text-navy">{enquirySettings?.title || 'Enquiry'}</p>
              <p className="text-sm text-gray-600">{enquirySettings?.description || 'Your enquiry form preview'}</p>
              <p className="text-xs text-gray-500 mt-2">Fields: {['show_name','show_phone','show_email','show_message'].filter((k) => enquirySettings?.[k]).map((k) => k.replace('show_','')).join(', ') || 'None'}</p>
            </div>
            <div className="col-span-2 flex gap-2 mt-3">
              <button onClick={async () => { try { const payload = ensureSettings(enquirySettings || {}); const saved = await apiJson<any>(`/enquiry/settings`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); setEnquirySettings(ensureSettings(saved)); toast.success('Saved'); setEditingEnquiry(false); } catch (err) { toast.error('Save failed'); } }} className="ml-auto rounded-sm bg-[#9a0827] px-3 py-2 text-white">Save</button>
              <button onClick={() => setEditingEnquiry(false)} className="rounded-sm border px-3 py-2">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
