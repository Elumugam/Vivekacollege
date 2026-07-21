"use client";
import { useState } from "react";
import { apiJson } from "@/lib/api";
import { inp, ta, Field, SaveBtn, UploadBtn, MediaPreview, SectionHeader } from "./CmsHelpers";

const removeIfExists = async (bucket: string, url: string, token: string) => {
  if (!url) return;
  try {
    await apiJson(`/upload?bucket=${encodeURIComponent(bucket)}&url=${encodeURIComponent(url)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // Ignore delete failures so editors can still update content.
  }
};

const mediaKind = (url: string, fallback: string = "image") => {
  const value = String(url || "").toLowerCase();
  if (/\.(mp4|webm|mov)(\?|$)/.test(value)) return "video";
  return fallback;
};

function SectionBlock({ children }: { children: React.ReactNode }) {
  return <section className="rounded-sm border border-cream-dark bg-white p-5 md:p-6">{children}</section>;
}

export function HeroTab({ data, token, onChange, onSave }: any) {
  const [busy, setBusy] = useState(false);
  const save = async () => { setBusy(true); await onSave("hero", data).finally(() => setBusy(false)); };
  const set = (k: string, v: any) => onChange({ ...data, [k]: v });
  const currentType = data.mediaType || mediaKind(data.mediaUrl, "image");
  return (
    <SectionBlock>
      <SectionHeader title="Hero Section" subtitle="Manage the main banner on the homepage." />
      <div className="space-y-4">
        <Field name="Hero Title"><input value={data.title || ""} onChange={e => set("title", e.target.value)} className={inp} placeholder="Distance Education for Career Growth" /></Field>
        <Field name="Subtitle"><textarea value={data.subtitle || ""} onChange={e => set("subtitle", e.target.value)} className={ta} rows={3} placeholder="Supporting copy below the main heading" /></Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field name="Primary Button Text"><input value={data.buttonText || ""} onChange={e => set("buttonText", e.target.value)} className={inp} placeholder="Apply Now" /></Field>
          <Field name="Primary Button URL"><input value={data.buttonUrl || ""} onChange={e => set("buttonUrl", e.target.value)} className={inp} placeholder="/apply" /></Field>
          <Field name="Secondary Button Text"><input value={data.button2Text || ""} onChange={e => set("button2Text", e.target.value)} className={inp} placeholder="Explore Courses" /></Field>
          <Field name="Secondary Button URL"><input value={data.button2Url || ""} onChange={e => set("button2Url", e.target.value)} className={inp} placeholder="/courses" /></Field>
        </div>
        <Field name="Media Type">
          <select value={currentType} onChange={e => set("mediaType", e.target.value)} className={`${inp} w-full md:w-auto`}>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </Field>
        <Field name="Hero Media">
          <div className="flex flex-wrap items-center gap-3">
            <UploadBtn label={data.mediaUrl ? "Replace Media" : "Upload Media"} bucket="hero-media" token={token} accept={currentType === "video" ? "video/*" : "image/*"} page="home" section="education-skill-social-empowerment-image" onUrl={u => set("mediaUrl", u)} />
            {data.mediaUrl && <button onClick={async () => { await removeIfExists("hero-media", data.mediaUrl, token); set("mediaUrl", ""); }} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a0827]">Remove Media</button>}
          </div>
          <MediaPreview url={data.mediaUrl} type={currentType} />
        </Field>
        <SaveBtn onClick={save} busy={busy} />
      </div>
    </SectionBlock>
  );
}

export function PopupTab({ data, token, onChange, onSave }: any) {
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      const response = await apiJson<any>("/popup-poster", {
        method: data.id ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          id: data.id,
          enabled: !!data.enabled,
          title: data.title || "",
          description: data.message || "",
          cta_text: data.ctaText || "",
          cta_url: data.ctaUrl || "",
          media_url: data.mediaType === "video" ? (data.videoUrl || "") : (data.imageUrl || ""),
          media_type: data.mediaType || (data.videoUrl ? "video" : "image"),
          display_delay: Number(data.displayDelay ?? 0),
          image_width: data.imageWidth ?? data.image_width ?? null,
          image_height: data.imageHeight ?? data.image_height ?? null,
        }),
      });
      onChange({
        ...data,
        ...response,
        message: response.description || data.message || "",
        ctaText: response.cta_text || data.ctaText || "",
        ctaUrl: response.cta_url || data.ctaUrl || "",
        imageUrl: response.media_type === "image" ? (response.media_url || data.imageUrl || "") : "",
        videoUrl: response.media_type === "video" ? (response.media_url || data.videoUrl || "") : "",
        displayDelay: response.display_delay ?? data.displayDelay ?? 0,
        imageWidth: response.image_width ?? response.imageWidth ?? data.imageWidth ?? data.image_width ?? null,
        imageHeight: response.image_height ?? response.imageHeight ?? data.imageHeight ?? data.image_height ?? null,
      });
    } finally {
      setBusy(false);
    }
  };
  const set = (k: string, v: any) => onChange({ ...data, [k]: v });
  const currentType = data.mediaType || mediaKind(data.videoUrl || data.imageUrl, data.videoUrl ? "video" : "image");
  const displayMode = data.displayMode || (data.displayDelay === 0 ? "immediate" : [2, 5, 10].includes(Number(data.displayDelay)) ? String(data.displayDelay) : "custom");
  const resolvedDelay = displayMode === "custom" ? Number(data.displayDelay || 0) : Number(displayMode === "immediate" ? 0 : displayMode);
  return (
    <SectionBlock>
      <SectionHeader title="Popup Poster" subtitle="Control the visitor popup media and text." />
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-navy">
          <input type="checkbox" checked={!!data.enabled} onChange={e => set("enabled", e.target.checked)} className="h-4 w-4 rounded border-cream-dark" />
          Enable popup
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <Field name="Popup Title"><input value={data.title || ""} onChange={e => set("title", e.target.value)} className={inp} placeholder="Admissions Open" /></Field>
          <Field name="CTA Text"><input value={data.ctaText || ""} onChange={e => set("ctaText", e.target.value)} className={inp} placeholder="Apply Now" /></Field>
        </div>
        <Field name="Popup Text"><textarea value={data.message || ""} onChange={e => set("message", e.target.value)} className={ta} rows={4} placeholder="Popup description text" /></Field>
        <Field name="CTA URL"><input value={data.ctaUrl || ""} onChange={e => set("ctaUrl", e.target.value)} className={inp} placeholder="/apply" /></Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field name="Display Timing">
            <select value={displayMode} onChange={(e) => {
              const nextMode = e.target.value;
              set("displayMode", nextMode);
              set("displayDelay", nextMode === "immediate" ? 0 : nextMode === "custom" ? Number(data.displayDelay || 0) : Number(nextMode));
            }} className={inp}>
              <option value="immediate">Show immediately</option>
              <option value="2">Show after 2 seconds</option>
              <option value="5">Show after 5 seconds</option>
              <option value="10">Show after 10 seconds</option>
              <option value="custom">Custom delay</option>
            </select>
          </Field>
          {displayMode === "custom" && (
            <Field name="Delay in seconds"><input type="number" min="0" value={resolvedDelay} onChange={e => set("displayDelay", Number(e.target.value))} className={inp} placeholder="5" /></Field>
          )}
        </div>
        <Field name="Popup Media Type">
          <select value={currentType} onChange={e => set("mediaType", e.target.value)} className={`${inp} w-full md:w-auto`}>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </Field>
        <Field name="Popup Media">
          <div className="flex flex-wrap items-center gap-3">
            <UploadBtn label={currentType === "video" ? (data.videoUrl ? "Replace Video" : "Upload Video") : (data.imageUrl ? "Replace Image" : "Upload Image")} bucket="popup-media" token={token} accept={currentType === "video" ? "video/*" : "image/*"} onUrl={u => currentType === "video" ? set("videoUrl", u) : set("imageUrl", u)} />
            {currentType === "video" && data.videoUrl && <button onClick={async () => { await removeIfExists("popup-media", data.videoUrl, token); set("videoUrl", ""); }} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a0827]">Remove Media</button>}
            {currentType !== "video" && data.imageUrl && <button onClick={async () => { await removeIfExists("popup-media", data.imageUrl, token); set("imageUrl", ""); }} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a0827]">Remove Media</button>}
          </div>
          <MediaPreview url={currentType === "video" ? data.videoUrl : data.imageUrl} type={currentType} />
        </Field>
        {currentType === "image" && (
          <Field name="Image Size">
            <div className="flex flex-wrap items-center gap-3">
              <select value={data.imageWidth ? `custom-${data.imageWidth}x${data.imageHeight}` : (data.imageWidth === null && data.imageHeight === null ? "full" : String(data.imageWidth || ""))} onChange={(e) => {
                const v = e.target.value;
                if (v === "small") { onChange({ ...data, imageWidth: 400, imageHeight: 300 }); }
                else if (v === "medium") { onChange({ ...data, imageWidth: 800, imageHeight: 600 }); }
                else if (v === "large") { onChange({ ...data, imageWidth: 1200, imageHeight: 900 }); }
                else if (v === "full") { onChange({ ...data, imageWidth: null, imageHeight: null }); }
                else if (v.startsWith("custom-")) {
                  // keep custom marker; actual values set by inputs below
                }
              }} className={inp}>
                <option value="small">Small — 400×300</option>
                <option value="medium">Medium — 800×600</option>
                <option value="large">Large — 1200×900</option>
                <option value="full">Full width</option>
                <option value={`custom-${data.imageWidth || 0}x${data.imageHeight || 0}`}>Custom</option>
              </select>
              <div className="flex gap-2">
                <input type="number" min="0" value={data.imageWidth ?? ""} onChange={e => onChange({ ...data, imageWidth: e.target.value ? Number(e.target.value) : null })} placeholder="Width" className={`${inp} w-28`} />
                <input type="number" min="0" value={data.imageHeight ?? ""} onChange={e => onChange({ ...data, imageHeight: e.target.value ? Number(e.target.value) : null })} placeholder="Height" className={`${inp} w-28`} />
              </div>
            </div>
          </Field>
        )}
        <div className="flex flex-wrap gap-2">
          <SaveBtn onClick={save} busy={busy} text={data.id ? "Update" : "Save"} />
          {data.previous_data && (
            <button onClick={async () => {
              if (!data.id) { toast.error('No original data to revert'); return; }
              setBusy(true);
              try {
                const reverted = await apiJson<any>(`/popup-poster/${encodeURIComponent(data.id)}/revert`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${token}` },
                });
                onChange({
                  ...data,
                  ...reverted,
                  message: reverted.description || data.message || "",
                  ctaText: reverted.cta_text || data.ctaText || "",
                  ctaUrl: reverted.cta_url || data.ctaUrl || "",
                  imageUrl: reverted.media_type === "image" ? (reverted.media_url || "") : "",
                  videoUrl: reverted.media_type === "video" ? (reverted.media_url || "") : "",
                  displayDelay: reverted.display_delay ?? 0,
                });
              } finally {
                setBusy(false);
              }
            }} className="px-4 py-2 rounded-sm border border-cream-dark text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 hover:bg-cream">Revert to Original</button>
          )}
          <button onClick={() => setPreviewOpen((current) => !current)} className="px-4 py-2 rounded-sm border border-cream-dark text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 hover:bg-cream">Preview</button>
        </div>
        {previewOpen && (
          <div className="rounded-sm border border-cream-dark bg-cream/40 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#9a0827]">Preview</p>
            <p className="mt-2 font-serif text-xl font-bold text-navy">{data.title || "Popup title"}</p>
            <p className="mt-2 text-sm text-slate-600">{data.message || "Popup description text"}</p>
            {currentType === "video" && data.videoUrl ? <video src={data.videoUrl} controls className="mt-3 h-40 w-full rounded-sm object-cover" /> : data.imageUrl ? <img src={data.imageUrl} alt="Popup preview" className="mt-3 h-40 w-full rounded-sm object-cover" /> : null}
          </div>
        )}
      </div>
    </SectionBlock>
  );
}

export function NavbarTab({ data, token, onChange, onSave }: any) {
  const [busy, setBusy] = useState(false);
  const save = async () => { setBusy(true); await onSave("navbar", data).finally(() => setBusy(false)); };
  const set = (k: string, v: any) => onChange({ ...data, [k]: v });
  return (
    <SectionBlock>
      <SectionHeader title="Header Content" subtitle="Edit the navigation and announcement bar content." />
      <div className="space-y-4">
        <Field name="Website Title"><input value={data.title || ""} onChange={e => set("title", e.target.value)} className={inp} placeholder="Viveka College of Arts & Science" /></Field>
        <Field name="Announcement"><textarea value={data.announcement || ""} onChange={e => set("announcement", e.target.value)} className={ta} rows={2} placeholder="Latest news ticker text" /></Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field name="CTA Text"><input value={data.ctaText || ""} onChange={e => set("ctaText", e.target.value)} className={inp} placeholder="Apply Now" /></Field>
          <Field name="CTA URL"><input value={data.ctaUrl || ""} onChange={e => set("ctaUrl", e.target.value)} className={inp} placeholder="/apply" /></Field>
          <Field name="Phone"><input value={data.phone || ""} onChange={e => set("phone", e.target.value)} className={inp} placeholder="04561 459374" /></Field>
          <Field name="Email"><input value={data.email || ""} onChange={e => set("email", e.target.value)} className={inp} placeholder="info@example.com" /></Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field name="Menu Item 1 Label"><input value={data.menu1Label || ""} onChange={e => set("menu1Label", e.target.value)} className={inp} placeholder="Home" /></Field>
          <Field name="Menu Item 1 URL"><input value={data.menu1Url || ""} onChange={e => set("menu1Url", e.target.value)} className={inp} placeholder="/" /></Field>
          <Field name="Menu Item 2 Label"><input value={data.menu2Label || ""} onChange={e => set("menu2Label", e.target.value)} className={inp} placeholder="About" /></Field>
          <Field name="Menu Item 2 URL"><input value={data.menu2Url || ""} onChange={e => set("menu2Url", e.target.value)} className={inp} placeholder="/about" /></Field>
          <Field name="Menu Item 3 Label"><input value={data.menu3Label || ""} onChange={e => set("menu3Label", e.target.value)} className={inp} placeholder="Courses" /></Field>
          <Field name="Menu Item 3 URL"><input value={data.menu3Url || ""} onChange={e => set("menu3Url", e.target.value)} className={inp} placeholder="/courses" /></Field>
          <Field name="Menu Item 4 Label"><input value={data.menu4Label || ""} onChange={e => set("menu4Label", e.target.value)} className={inp} placeholder="Gallery" /></Field>
          <Field name="Menu Item 4 URL"><input value={data.menu4Url || ""} onChange={e => set("menu4Url", e.target.value)} className={inp} placeholder="/gallery" /></Field>
        </div>
        <Field name="Logo">
          <div className="flex flex-wrap items-center gap-3">
            <UploadBtn label={data.logoUrl ? "Replace Logo" : "Upload Logo"} bucket="cms-media" token={token} onUrl={u => set("logoUrl", u)} />
            {data.logoUrl && <button onClick={async () => { await removeIfExists("cms-media", data.logoUrl, token); set("logoUrl", ""); }} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a0827]">Remove Logo</button>}
          </div>
          <MediaPreview url={data.logoUrl} />
        </Field>
        <SaveBtn onClick={save} busy={busy} />
      </div>
    </SectionBlock>
  );
}

export function HomeTab({ data, token, onChange, onSave }: any) {
  const [busy, setBusy] = useState(false);
  const save = async () => { setBusy(true); await onSave("home", data).finally(() => setBusy(false)); };
  const set = (k: string, v: any) => onChange({ ...data, [k]: v });
  const currentType = data.mediaType || mediaKind(data.mediaUrl, "image");
  return (
    <SectionBlock>
      <SectionHeader title="Homepage Copy" subtitle="Edit the text and call-to-action blocks on the homepage." />
      <div className="space-y-4">
        <Field name="Title"><input value={data.title || ""} onChange={e => set("title", e.target.value)} className={inp} placeholder="Welcome to Our College" /></Field>
        <Field name="Subtitle"><input value={data.subtitle || ""} onChange={e => set("subtitle", e.target.value)} className={inp} placeholder="Flexible, Recognized, Career-Focused" /></Field>
        <Field name="Description"><textarea value={data.description || ""} onChange={e => set("description", e.target.value)} className={ta} rows={5} placeholder="Main intro paragraph" /></Field>
        <Field name="Announcement Text"><textarea value={data.announcementText || ""} onChange={e => set("announcementText", e.target.value)} className={ta} rows={3} placeholder="Homepage news or announcement text" /></Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field name="Stats Students"><input value={data.statStudents || ""} onChange={e => set("statStudents", e.target.value)} className={inp} placeholder="5000+" /></Field>
          <Field name="Stats Courses"><input value={data.statCourses || ""} onChange={e => set("statCourses", e.target.value)} className={inp} placeholder="100+" /></Field>
          <Field name="Stats Years"><input value={data.statYears || ""} onChange={e => set("statYears", e.target.value)} className={inp} placeholder="25+" /></Field>
          <Field name="Stats Placements"><input value={data.statPlacements || ""} onChange={e => set("statPlacements", e.target.value)} className={inp} placeholder="100%" /></Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field name="CTA 1 Text"><input value={data.cta1Text || ""} onChange={e => set("cta1Text", e.target.value)} className={inp} placeholder="Apply Now" /></Field>
          <Field name="CTA 1 URL"><input value={data.cta1Url || ""} onChange={e => set("cta1Url", e.target.value)} className={inp} placeholder="/apply" /></Field>
          <Field name="CTA 2 Text"><input value={data.cta2Text || ""} onChange={e => set("cta2Text", e.target.value)} className={inp} placeholder="View Courses" /></Field>
          <Field name="CTA 2 URL"><input value={data.cta2Url || ""} onChange={e => set("cta2Url", e.target.value)} className={inp} placeholder="/courses" /></Field>
        </div>
        <Field name="Homepage Media Type">
          <select value={currentType} onChange={e => set("mediaType", e.target.value)} className={`${inp} w-full md:w-auto`}>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </Field>
        <Field name="Homepage Media">
          <div className="flex flex-wrap items-center gap-3">
            <UploadBtn label={data.mediaUrl ? "Replace Media" : "Upload Media"} bucket="cms-media" token={token} accept={currentType === "video" ? "video/*" : "image/*"} onUrl={u => set("mediaUrl", u)} />
            {data.mediaUrl && <button onClick={async () => { await removeIfExists("cms-media", data.mediaUrl, token); set("mediaUrl", ""); }} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a0827]">Remove Media</button>}
          </div>
          <MediaPreview url={data.mediaUrl} type={currentType} />
        </Field>
        <SaveBtn onClick={save} busy={busy} />
      </div>
    </SectionBlock>
  );
}

export function AboutTab({ data, token, onChange, onSave }: any) {
  const [busy, setBusy] = useState(false);
  const save = async () => { setBusy(true); await onSave("about", data).finally(() => setBusy(false)); };
  const set = (k: string, v: any) => onChange({ ...data, [k]: v });
  return (
    <SectionBlock>
      <SectionHeader title="About Page" subtitle="Mission, vision, principal note, and about media." />
      <div className="space-y-4">
        <Field name="Mission"><textarea value={data.mission || ""} onChange={e => set("mission", e.target.value)} className={ta} rows={5} placeholder="Mission statements" /></Field>
        <Field name="Vision"><textarea value={data.vision || ""} onChange={e => set("vision", e.target.value)} className={ta} rows={5} placeholder="Vision statements" /></Field>
        <Field name="Principal's Message"><textarea value={data.principal || ""} onChange={e => set("principal", e.target.value)} className={ta} rows={6} placeholder="Principal message" /></Field>
        <Field name="Principal Name"><input value={data.principalName || ""} onChange={e => set("principalName", e.target.value)} className={inp} placeholder="Name" /></Field>
        <Field name="Media Type">
          <select value={data.mediaType || mediaKind(data.imageUrl || data.videoUrl, "image")} onChange={e => set("mediaType", e.target.value)} className={`${inp} w-full md:w-auto`}>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </Field>
        <Field name="About Media">
          <div className="flex flex-wrap items-center gap-3">
            <UploadBtn label={data.imageUrl ? "Replace Image" : "Upload Image"} bucket="cms-media" token={token} onUrl={u => set("imageUrl", u)} />
            <UploadBtn label={data.videoUrl ? "Replace Video" : "Upload Video"} bucket="cms-media" token={token} accept="video/*" onUrl={u => set("videoUrl", u)} />
            {data.imageUrl && <button onClick={async () => { await removeIfExists("cms-media", data.imageUrl, token); set("imageUrl", ""); }} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a0827]">Remove Image</button>}
            {data.videoUrl && <button onClick={async () => { await removeIfExists("cms-media", data.videoUrl, token); set("videoUrl", ""); }} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a0827]">Remove Video</button>}
          </div>
          {data.imageUrl && <MediaPreview url={data.imageUrl} />}
          {data.videoUrl && <MediaPreview url={data.videoUrl} type="video" />}
        </Field>
        <SaveBtn onClick={save} busy={busy} />
      </div>
    </SectionBlock>
  );
}

export function ContactInfoTab({ data, onChange, onSave }: any) {
  const [busy, setBusy] = useState(false);
  const save = async () => { setBusy(true); await onSave("contact_info", data).finally(() => setBusy(false)); };
  const set = (k: string, v: any) => onChange({ ...data, [k]: v });
  return (
    <SectionBlock>
      <SectionHeader title="Contact Info" subtitle="Address, phone, email, map, and social links." />
      <div className="space-y-4">
        <Field name="Address"><textarea value={data.address || ""} onChange={e => set("address", e.target.value)} className={ta} rows={3} placeholder="Full address" /></Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field name="Phone 1"><input value={data.phone || ""} onChange={e => set("phone", e.target.value)} className={inp} placeholder="Phone number" /></Field>
          <Field name="Phone 2"><input value={data.phone2 || ""} onChange={e => set("phone2", e.target.value)} className={inp} placeholder="Alternate number" /></Field>
          <Field name="Email"><input value={data.email || ""} onChange={e => set("email", e.target.value)} className={inp} placeholder="Email address" /></Field>
          <Field name="Working Hours"><input value={data.workingHours || ""} onChange={e => set("workingHours", e.target.value)} className={inp} placeholder="Mon - Sat | 9:30 AM - 5:30 PM" /></Field>
        </div>
        <Field name="Google Maps Embed URL"><input value={data.mapUrl || ""} onChange={e => set("mapUrl", e.target.value)} className={inp} placeholder="Maps embed URL" /></Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field name="Facebook URL"><input value={data.facebook || ""} onChange={e => set("facebook", e.target.value)} className={inp} placeholder="Facebook URL" /></Field>
          <Field name="Instagram URL"><input value={data.instagram || ""} onChange={e => set("instagram", e.target.value)} className={inp} placeholder="Instagram URL" /></Field>
          <Field name="YouTube URL"><input value={data.youtube || ""} onChange={e => set("youtube", e.target.value)} className={inp} placeholder="YouTube URL" /></Field>
        </div>
        <SaveBtn onClick={save} busy={busy} />
      </div>
    </SectionBlock>
  );
}

export function HomeContentTab(props: {
  hero: any;
  popup: any;
  navbar: any;
  home: any;
  contactInfo: any;
  token: string;
  onHeroChange: (value: any) => void;
  onPopupChange: (value: any) => void;
  onNavbarChange: (value: any) => void;
  onHomeChange: (value: any) => void;
  onContactInfoChange: (value: any) => void;
  onSave: (key: string, value: any) => Promise<void>;
}) {
  const { hero, popup, navbar, home, contactInfo, token, onHeroChange, onPopupChange, onNavbarChange, onHomeChange, onContactInfoChange, onSave } = props;

  return (
    <div className="space-y-6">
      <HeroTab data={hero} token={token} onChange={onHeroChange} onSave={onSave} />
      <PopupTab data={popup} token={token} onChange={onPopupChange} onSave={onSave} />
      <NavbarTab data={navbar} token={token} onChange={onNavbarChange} onSave={onSave} />
      <HomeTab data={home} token={token} onChange={onHomeChange} onSave={onSave} />
      <ContactInfoTab data={contactInfo} onChange={onContactInfoChange} onSave={onSave} />
    </div>
  );
}
