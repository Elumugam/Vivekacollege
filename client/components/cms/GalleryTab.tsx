"use client";
import { useEffect, useState } from "react";
import { useRef } from "react";
import toast from "react-hot-toast";
import { apiJson, deleteFile } from "@/lib/api";
import { inp, Field, SaveBtn, UploadBtn, MediaPreview, SectionHeader } from "./CmsHelpers";

const GALLERY_CATEGORIES = ["Campus", "Students", "Events", "Training", "Classroom", "Workshops", "Cultural", "Sports"];

const emptyGallery = { title: "", description: "", category: "Campus", type: "image", src: "" };

const toForm = (item: any) => ({
  ...emptyGallery,
  ...item,
  src: item?.src || item?.mediaUrl || "",
  type: item?.type || item?.mediaType || "image",
  description: item?.description || item?.caption || "",
});

const isVideoUrl = (url: string) => /\.(mp4|webm|mov)(\?|$)/i.test(String(url || ""));

export function GalleryTab({ gallery, token, onRefresh }: { gallery: any[]; token: string; onRefresh: () => void }) {
  const [form, setForm] = useState<any>(emptyGallery);
  const [editing, setEditing] = useState<string | null>(null);
  const [original, setOriginal] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const didSeedInitialItem = useRef(false);

  useEffect(() => {
    if (!editing) return;
    const match = gallery.find((item: any) => String(item.id) === String(editing));
    if (match) {
      setOriginal(match);
      setForm(toForm(match));
    }
  }, [editing, gallery]);

  useEffect(() => {
    if (didSeedInitialItem.current) return;
    if (editing || gallery.length === 0) return;

    const firstItem = gallery[0];
    if (!firstItem) return;

    didSeedInitialItem.current = true;
    setOriginal(firstItem);
    setEditing(String(firstItem.id));
    setForm(toForm(firstItem));
  }, [editing, gallery]);

  const set = (key: string, value: any) => setForm((current: any) => ({ ...current, [key]: value }));

  const cleanupOldMedia = async (previousItem: any, nextItem: any) => {
    const previousUrl = previousItem?.src || previousItem?.mediaUrl || "";
    if (previousUrl && previousUrl !== nextItem?.src) {
      await deleteFile("gallery-media", previousUrl, token).catch(() => null);
    }
  };

  const save = async () => {
    if (!form.src) return toast.error("Please upload a media file first");

    setBusy(true);
    try {
      if (editing) {
        await apiJson(`/gallery/${editing}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        await cleanupOldMedia(original, form);
        toast.success("Media updated!");
      } else {
        await apiJson("/gallery", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        toast.success("Media added!");
      }
      setForm(emptyGallery);
      setEditing(null);
      setOriginal(null);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (item: any) => {
    setForm(toForm(item));
    setEditing(String(item.id));
    setOriginal(item);
  };

  const del = async (id: string) => {
    if (!confirm("Delete this media?")) return;
    try {
      const current = gallery.find((item: any) => String(item.id) === String(id));
      await apiJson(`/gallery/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (current?.src || current?.mediaUrl) {
        await deleteFile("gallery-media", current.src || current.mediaUrl, token).catch(() => null);
      }
      toast.success("Deleted");
      if (editing === id) {
        setForm(emptyGallery);
        setEditing(null);
        setOriginal(null);
      }
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed");
    }
  };

  const removeMedia = async () => {
    if (!form.src) return;
    await deleteFile("gallery-media", form.src, token).catch(() => null);
    set("src", "");
  };

  const previewType = form.type === "video" || isVideoUrl(form.src) ? "video" : "image";

  return (
    <div className="space-y-5">
      <SectionHeader title="Gallery" subtitle="Upload, replace, delete, and organize gallery media." />
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <div className="rounded-sm border border-cream-dark bg-white p-4 space-y-3 h-fit">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#9a0827]">{editing ? "Editing Gallery Item" : "Upload New Media"}</h3>
          <Field name="Title"><input value={form.title} onChange={(e) => set("title", e.target.value)} className={inp} placeholder="e.g. Annual Day 2024" /></Field>
          <Field name="Description"><textarea value={form.description} onChange={(e) => set("description", e.target.value)} className={`${inp} resize-none`} rows={3} placeholder="Short description" /></Field>
          <Field name="Category">
            <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inp}>
              {GALLERY_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
            </select>
          </Field>
          <Field name="Media Type">
            <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inp}>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </Field>
          <Field name="File">
            <div className="flex gap-2 flex-wrap items-center mt-1">
              <UploadBtn label={form.src ? "Replace File" : "Upload File"} bucket="gallery-media" token={token}
                accept={form.type === "image" ? "image/*" : "video/*"}
                onUrl={(url) => set("src", url)} />
              {form.src && <button onClick={removeMedia} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a0827]">Remove Media</button>}
            </div>
            <MediaPreview url={form.src} type={previewType} />
          </Field>
          <div className="flex gap-2 pt-1 flex-wrap">
            <SaveBtn onClick={save} busy={busy} text={editing ? "Update Media" : "Add to Gallery"} />
            {editing && <button onClick={() => { setForm(emptyGallery); setEditing(null); setOriginal(null); }} className="px-4 py-2 rounded-sm border border-cream-dark text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 hover:bg-cream">Cancel</button>}
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs text-slate-400">{gallery.length} item(s) in gallery</p>
          <div className="grid grid-cols-1 gap-3 overflow-y-auto pr-1 max-h-190 sm:grid-cols-2 xl:grid-cols-2">
            {gallery.length === 0 && <p className="col-span-full py-8 text-center text-sm text-slate-400">No gallery items yet.</p>}
            {gallery.map((item: any) => {
              const src = item.src || item.mediaUrl || "";
              const mediaType = item.type === "video" || item.mediaType === "video" || isVideoUrl(src) ? "video" : "image";
              return (
                <article key={item.id} className={`overflow-hidden rounded-sm border bg-white ${editing === String(item.id) ? "border-[#9a0827]" : "border-cream-dark"}`}>
                  {mediaType === "video"
                    ? <video src={src} controls className="h-40 w-full bg-black object-cover" />
                    : <img src={src} className="h-40 w-full object-cover" alt={item.title || "Gallery item"} />}
                  <div className="space-y-2 p-3">
                    <p className="truncate text-sm font-semibold text-navy">{item.title || "Untitled"}</p>
                    {item.description && <p className="text-sm text-slate-500 line-clamp-2">{item.description}</p>}
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{item.category || ""}</p>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => startEdit(item)} className="rounded-sm bg-[#0b3568] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">Edit</button>
                      <button onClick={() => del(String(item.id))} className="rounded-sm bg-[#9a0827] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">Delete</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
