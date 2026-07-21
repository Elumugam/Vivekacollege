"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { uploadFile } from "@/lib/api";

export const inp = "w-full border border-cream-dark rounded-sm px-3 py-2 bg-white text-navy text-sm outline-none focus:ring-1 focus:ring-maroon";
export const ta = `${inp} resize-none`;
export const label = "block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1";

export function Field({ name, children }: { name: string; children: React.ReactNode }) {
  return <div><p className={label}>{name}</p>{children}</div>;
}

export function SaveBtn({ onClick, busy, text = "Save Changes" }: { onClick: () => void; busy?: boolean; text?: string }) {
  return (
    <button onClick={onClick} disabled={busy}
      className="inline-flex items-center justify-center bg-[#9a0827] text-white px-5 py-2.5 rounded-sm font-semibold uppercase tracking-[0.22em] text-[11px] disabled:opacity-50 hover:bg-[#82051f] transition-colors">
      {busy ? "Saving…" : text}
    </button>
  );
}

export function UploadBtn({ label: lbl, bucket, token, onUrl, accept = "image/*", page, section }: {
  label: string; bucket: string; token: string; onUrl: (u: string) => void; accept?: string; page?: string; section?: string;
}) {
  const [busy, setBusy] = useState(false);
    const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]; if (!f) return;
      setBusy(true);
      try {
        const url = await uploadFile(f, bucket, token, { page, section });
        onUrl(url);
        toast.success("Uploaded!");
      }
      catch (err: any) { toast.error(err.message || "Upload failed"); }
      finally { setBusy(false); e.target.value = ""; }
    };
  return (
    <label className="cursor-pointer inline-flex items-center justify-center gap-2 bg-[#0b3568] text-white px-4 py-2 rounded-sm text-[11px] font-semibold uppercase tracking-[0.18em] hover:bg-[#0a2f5d] transition-colors">
      {busy ? "Uploading…" : lbl}
      <input type="file" className="hidden" accept={accept} onChange={handle} disabled={busy} />
    </label>
  );
}

export function MediaPreview({ url, type = "image" }: { url: string; type?: string }) {
  if (!url) return null;
  return type === "video"
    ? <video src={url} controls className="mt-3 h-40 w-full rounded-sm border border-cream-dark bg-black object-cover" />
    : <img src={url} alt="preview" className="mt-3 h-40 w-full rounded-sm border border-cream-dark object-cover" />;
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#9a0827]">CMS</p>
      <h2 className="mt-1 font-serif text-2xl font-bold text-navy">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

export function Badge({ text, color = "navy" }: { text: string; color?: string }) {
  return <span className={`text-xs px-2 py-0.5 rounded-full bg-${color}/10 text-${color} font-semibold`}>{text}</span>;
}
