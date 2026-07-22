"use client";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { apiJson, uploadFile } from "@/lib/api";
import {
  inp,
  ta,
  Field,
  SaveBtn,
  UploadBtn,
  MediaPreview,
  SectionHeader,
} from "./CmsHelpers";

// ─── Types ────────────────────────────────────────────────────────────────────
interface QuickLink {
  id: string;
  label: string;
  url: string;
  openInNewTab: boolean;
  enabled: boolean;
  order: number;
}

interface Accreditation {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
  enabled: boolean;
  order: number;
}

interface FooterContent {
  logoUrl: string;
  collegeName: string;
  description: string;
  copyright: string;
}

interface ContactInfo {
  address?: string;
  phone?: string;
  phone2?: string;
  email?: string;
  workingHours?: string;
  mapUrl?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  twitter?: string;
}

// ─── Shared block wrapper ─────────────────────────────────────────────────────
function Block({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-sm border border-cream-dark bg-white p-5 md:p-6">
      {children}
    </section>
  );
}

// ─── Sub-section A: Footer Content ───────────────────────────────────────────
function FooterContentSection({ token }: { token: string }) {
  const [data, setData] = useState<FooterContent>({
    logoUrl: "",
    collegeName: "Viveka College",
    description: "",
    copyright: "",
  });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiJson<any>("/footer/content", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => setData((prev) => ({ ...prev, ...(r?.content || r || {}) })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const set = (k: keyof FooterContent, v: string) =>
    setData((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      await apiJson("/footer/content", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      toast.success("Footer content saved ✓");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>;

  return (
    <Block>
      <SectionHeader
        title="Footer Content"
        subtitle="Logo, college name, description, and copyright text."
      />
      <div className="space-y-4">
        <Field name="College Name">
          <input
            value={data.collegeName}
            onChange={(e) => set("collegeName", e.target.value)}
            className={inp}
            placeholder="Viveka College"
          />
        </Field>
        <Field name="Description">
          <textarea
            value={data.description}
            onChange={(e) => set("description", e.target.value)}
            className={ta}
            rows={3}
            placeholder="Short tagline or description"
          />
        </Field>
        <Field name="Copyright Text">
          <input
            value={data.copyright}
            onChange={(e) => set("copyright", e.target.value)}
            className={inp}
            placeholder="© 2025 Viveka College. All rights reserved."
          />
        </Field>
        <Field name="Footer Logo">
          <div className="flex flex-wrap items-center gap-3">
            <UploadBtn
              label={data.logoUrl ? "Replace Logo" : "Upload Logo"}
              bucket="cms-media"
              token={token}
              accept="image/png,image/jpg,image/jpeg,image/svg+xml,image/webp"
              onUrl={(u) => set("logoUrl", u)}
            />
            {data.logoUrl && (
              <button
                onClick={() => set("logoUrl", "")}
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a0827]"
              >
                Remove Logo
              </button>
            )}
          </div>
          <MediaPreview url={data.logoUrl} />
        </Field>
        <SaveBtn onClick={save} busy={busy} />
      </div>
    </Block>
  );
}

// ─── Sub-section B: Quick Links ───────────────────────────────────────────────
function QuickLinksSection({ token }: { token: string }) {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiJson<any>("/footer/quick-links", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => setLinks(Array.isArray(r) ? r : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const addLink = () =>
    setLinks((prev) => [
      ...prev,
      {
        id: `link-${Date.now()}`,
        label: "",
        url: "/",
        openInNewTab: false,
        enabled: true,
        order: prev.length,
      },
    ]);

  const updateLink = (index: number, patch: Partial<QuickLink>) =>
    setLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, ...patch } : link))
    );

  const deleteLink = (index: number) =>
    setLinks((prev) => prev.filter((_, i) => i !== index).map((l, i) => ({ ...l, order: i })));

  const moveLink = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= links.length) return;
    setLinks((prev) => {
      const updated = [...prev];
      [updated[index], updated[next]] = [updated[next], updated[index]];
      return updated.map((l, i) => ({ ...l, order: i }));
    });
  };

  const save = async () => {
    for (const link of links) {
      if (!link.label.trim()) {
        toast.error("All links must have a label");
        return;
      }
    }
    setBusy(true);
    try {
      await apiJson("/footer/quick-links", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ links }),
      });
      toast.success("Quick links saved ✓");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>;

  return (
    <Block>
      <SectionHeader
        title="Quick Links"
        subtitle="Add, edit, delete, reorder or disable footer navigation links."
      />
      <div className="space-y-3">
        {links.map((link, index) => (
          <div
            key={link.id}
            className="rounded-sm border border-cream-dark bg-cream/30 p-3"
          >
            <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto_auto_auto_auto]">
              <input
                value={link.label}
                onChange={(e) => updateLink(index, { label: e.target.value })}
                className={inp}
                placeholder="Link Label"
              />
              <input
                value={link.url}
                onChange={(e) => updateLink(index, { url: e.target.value })}
                className={inp}
                placeholder="/about"
              />
              <select
                value={link.openInNewTab ? "new" : "same"}
                onChange={(e) =>
                  updateLink(index, { openInNewTab: e.target.value === "new" })
                }
                className={`${inp} w-auto`}
              >
                <option value="same">Same tab</option>
                <option value="new">New tab</option>
              </select>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-navy whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={link.enabled}
                  onChange={(e) => updateLink(index, { enabled: e.target.checked })}
                  className="h-4 w-4"
                />
                Enabled
              </label>
              <div className="flex gap-1">
                <button
                  onClick={() => moveLink(index, -1)}
                  disabled={index === 0}
                  className="rounded-sm border border-cream-dark px-2 py-1 text-xs text-navy disabled:opacity-30 hover:bg-cream"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveLink(index, 1)}
                  disabled={index === links.length - 1}
                  className="rounded-sm border border-cream-dark px-2 py-1 text-xs text-navy disabled:opacity-30 hover:bg-cream"
                  title="Move down"
                >
                  ↓
                </button>
              </div>
              <button
                onClick={() => deleteLink(index)}
                className="rounded-sm border border-[#9a0827] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a0827] hover:bg-[#9a0827] hover:text-white"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={addLink}
          className="rounded-sm border border-[#0b3568] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0b3568] hover:bg-[#0b3568] hover:text-white transition-colors"
        >
          + Add Link
        </button>
      </div>
      <div className="mt-4">
        <SaveBtn onClick={save} busy={busy} />
      </div>
    </Block>
  );
}

// ─── Sub-section C: Contact Information ──────────────────────────────────────
function FooterContactSection({ token }: { token: string }) {
  const [data, setData] = useState<ContactInfo>({});
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiJson<any>("/footer/contact", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => setData(r || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const set = (k: keyof ContactInfo, v: string) =>
    setData((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      await apiJson("/footer/contact", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      toast.success("Contact info saved ✓");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>;

  return (
    <Block>
      <SectionHeader
        title="Contact Information"
        subtitle="Address, phone, email, working hours, and map URL shown in the footer."
      />
      <div className="space-y-4">
        <Field name="Address">
          <textarea
            value={data.address || ""}
            onChange={(e) => set("address", e.target.value)}
            className={ta}
            rows={2}
            placeholder="Full address"
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field name="Phone">
            <input
              value={data.phone || ""}
              onChange={(e) => set("phone", e.target.value)}
              className={inp}
              placeholder="Primary phone"
            />
          </Field>
          <Field name="Alternate Phone">
            <input
              value={data.phone2 || ""}
              onChange={(e) => set("phone2", e.target.value)}
              className={inp}
              placeholder="Alternate phone"
            />
          </Field>
          <Field name="Email">
            <input
              value={data.email || ""}
              onChange={(e) => set("email", e.target.value)}
              className={inp}
              placeholder="contact@example.com"
            />
          </Field>
          <Field name="Working Hours">
            <input
              value={data.workingHours || ""}
              onChange={(e) => set("workingHours", e.target.value)}
              className={inp}
              placeholder="Mon–Sat | 9:30 AM – 5:30 PM"
            />
          </Field>
        </div>
        <Field name="Google Maps URL">
          <input
            value={data.mapUrl || ""}
            onChange={(e) => set("mapUrl", e.target.value)}
            className={inp}
            placeholder="Maps embed URL"
          />
        </Field>
        <SaveBtn onClick={save} busy={busy} />
      </div>
    </Block>
  );
}

// ─── Sub-section D: Social Media Links ───────────────────────────────────────
function SocialMediaSection({ token }: { token: string }) {
  const [data, setData] = useState<ContactInfo>({});
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiJson<any>("/footer/contact", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => setData(r || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const set = (k: keyof ContactInfo, v: string) =>
    setData((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      await apiJson("/footer/contact", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      toast.success("Social media links saved ✓");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>;

  return (
    <Block>
      <SectionHeader
        title="Social Media Links"
        subtitle="URLs for all social media platforms shown in the footer."
      />
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field name="Facebook URL">
            <input
              value={data.facebook || ""}
              onChange={(e) => set("facebook", e.target.value)}
              className={inp}
              placeholder="https://facebook.com/…"
            />
          </Field>
          <Field name="Instagram URL">
            <input
              value={data.instagram || ""}
              onChange={(e) => set("instagram", e.target.value)}
              className={inp}
              placeholder="https://instagram.com/…"
            />
          </Field>
          <Field name="YouTube URL">
            <input
              value={data.youtube || ""}
              onChange={(e) => set("youtube", e.target.value)}
              className={inp}
              placeholder="https://youtube.com/…"
            />
          </Field>
          <Field name="LinkedIn URL">
            <input
              value={data.linkedin || ""}
              onChange={(e) => set("linkedin", e.target.value)}
              className={inp}
              placeholder="https://linkedin.com/…"
            />
          </Field>
          <Field name="Twitter / X URL">
            <input
              value={data.twitter || ""}
              onChange={(e) => set("twitter", e.target.value)}
              className={inp}
              placeholder="https://x.com/…"
            />
          </Field>
        </div>
        <SaveBtn onClick={save} busy={busy} />
      </div>
    </Block>
  );
}

// ─── Sub-section E: Accreditation Management ──────────────────────────────────
function AccreditationsSection({ token }: { token: string }) {
  const [items, setItems] = useState<Accreditation[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    apiJson<any>("/footer/accreditations", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => setItems(Array.isArray(r) ? r : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      {
        id: `accred-${Date.now()}`,
        title: "",
        imageUrl: "",
        description: "",
        enabled: true,
        order: prev.length,
      },
    ]);

  const updateItem = (index: number, patch: Partial<Accreditation>) =>
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );

  const deleteItem = (index: number) =>
    setItems((prev) =>
      prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, order: i }))
    );

  const moveItem = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= items.length) return;
    setItems((prev) => {
      const updated = [...prev];
      [updated[index], updated[next]] = [updated[next], updated[index]];
      return updated.map((item, i) => ({ ...item, order: i }));
    });
  };

  const handleImageUpload = async (index: number, file: File) => {
    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviews((prev) => ({ ...prev, [items[index].id]: objectUrl }));
    try {
      const url = await uploadFile(file, "cms-media", token, {
        page: "footer",
        section: "accreditation",
      });
      updateItem(index, { imageUrl: url });
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    }
  };

  const save = async () => {
    for (const item of items) {
      if (!item.title.trim()) {
        toast.error("All accreditations must have a title");
        return;
      }
    }
    setBusy(true);
    try {
      await apiJson("/footer/accreditations", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
      });
      toast.success("Accreditations saved ✓");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>;

  return (
    <Block>
      <SectionHeader
        title="Accreditation Management"
        subtitle="Add, edit, reorder or disable accreditation badges shown in the footer."
      />
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="rounded-sm border border-cream-dark bg-cream/30 p-4 space-y-3"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <Field name="Title">
                <input
                  value={item.title}
                  onChange={(e) => updateItem(index, { title: e.target.value })}
                  className={inp}
                  placeholder="e.g. NAAC A++"
                />
              </Field>
              <Field name="Description (optional)">
                <input
                  value={item.description}
                  onChange={(e) =>
                    updateItem(index, { description: e.target.value })
                  }
                  className={inp}
                  placeholder="Short description"
                />
              </Field>
            </div>
            <Field name="Accreditation Image">
              <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer inline-flex items-center justify-center gap-2 bg-[#0b3568] text-white px-4 py-2 rounded-sm text-[11px] font-semibold uppercase tracking-[0.18em] hover:bg-[#0a2f5d] transition-colors">
                  {item.imageUrl ? "Replace Image" : "Upload Image"}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpg,image/jpeg,image/svg+xml,image/webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload(index, f);
                      e.target.value = "";
                    }}
                  />
                </label>
                {item.imageUrl && (
                  <button
                    onClick={() => {
                      updateItem(index, { imageUrl: "" });
                      setPreviews((prev) => {
                        const next = { ...prev };
                        delete next[item.id];
                        return next;
                      });
                    }}
                    className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a0827]"
                  >
                    Remove Image
                  </button>
                )}
              </div>
              {(previews[item.id] || item.imageUrl) && (
                <img
                  src={previews[item.id] || item.imageUrl}
                  alt="Preview"
                  className="mt-2 h-16 rounded-sm border border-cream-dark object-contain bg-white p-1"
                />
              )}
            </Field>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-navy">
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={(e) => updateItem(index, { enabled: e.target.checked })}
                  className="h-4 w-4"
                />
                Enabled
              </label>
              <button
                onClick={() => moveItem(index, -1)}
                disabled={index === 0}
                className="rounded-sm border border-cream-dark px-2 py-1 text-xs text-navy disabled:opacity-30 hover:bg-cream"
                title="Move up"
              >
                ↑
              </button>
              <button
                onClick={() => moveItem(index, 1)}
                disabled={index === items.length - 1}
                className="rounded-sm border border-cream-dark px-2 py-1 text-xs text-navy disabled:opacity-30 hover:bg-cream"
                title="Move down"
              >
                ↓
              </button>
              <button
                onClick={() => deleteItem(index)}
                className="rounded-sm border border-[#9a0827] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a0827] hover:bg-[#9a0827] hover:text-white"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={addItem}
          className="rounded-sm border border-[#0b3568] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0b3568] hover:bg-[#0b3568] hover:text-white transition-colors"
        >
          + Add Accreditation
        </button>
      </div>
      <div className="mt-4">
        <SaveBtn onClick={save} busy={busy} />
      </div>
    </Block>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function FooterManagement({ token }: { token: string }) {
  return (
    <div className="space-y-6">
      <div className="mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#9a0827]">
          CMS
        </p>
        <h2 className="mt-1 font-serif text-2xl font-bold text-navy">
          Footer Management
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Edit all footer content. Changes are saved to the database and
          immediately reflected on the website.
        </p>
      </div>
      <FooterContentSection token={token} />
      <QuickLinksSection token={token} />
      <FooterContactSection token={token} />
      <SocialMediaSection token={token} />
      <AccreditationsSection token={token} />
    </div>
  );
}
