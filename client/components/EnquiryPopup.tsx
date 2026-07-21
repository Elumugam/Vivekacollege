"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { apiJson, fetchPublicJson } from "@/lib/api";

type Settings = {
  enabled?: boolean;
  title?: string;
  description?: string;
  show_name?: boolean;
  show_email?: boolean;
  show_phone?: boolean;
  show_message?: boolean;
  button_text?: string;
  success_message?: string;
  popup_image?: string;
  display_delay?: number;
};

const defaults: Settings = {
  enabled: false,
  title: "Enquiry",
  description: "Please share your details and we will contact you.",
  show_name: true,
  show_email: true,
  show_phone: true,
  show_message: true,
  button_text: "Submit",
  success_message: "Thank you. We will contact you soon.",
  popup_image: "",
  display_delay: 0,
};

export default function EnquiryPopup() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", description: "" });

  const merged = useMemo(() => ({ ...defaults, ...(settings || {}) }), [settings]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const load = async () => {
      const res = await fetchPublicJson<Settings>("/enquiry/settings/public");
      const next = { ...defaults, ...(res || {}) };
      setSettings(next);
      if (!next.enabled) return;
      const delay = Math.max(0, Number(next.display_delay ?? 0));
      timer = setTimeout(() => setVisible(true), delay * 1000);
    };

    void load();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!merged.enabled || !visible) return null;

  const validate = () => {
    if (merged.show_name && !form.name.trim()) return "Full Name is required";
    if (merged.show_phone && !form.phone.trim()) return "Phone Number is required";
    if (merged.show_email) {
      if (!form.email.trim()) return "Email Address is required";
      if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return "Enter a valid email";
    }
    if (merged.show_message && !form.description.trim()) return "Description / Purpose is required";
    return "";
  };

  const submit = async () => {
    const validation = validate();
    if (validation) {
      toast.error(validation);
      return;
    }

    setSubmitting(true);
    try {
      const result = await apiJson<{ message?: string; emailSent?: boolean }>("/enquiry/submit", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          description: form.description,
        }),
      });
      toast.success(result?.message || merged.success_message || "Submitted");
      setVisible(false);
    } catch (err: any) {
      toast.error(err?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center px-4">
      <button aria-label="Close enquiry popup overlay" onClick={() => setVisible(false)} className="absolute inset-0 bg-navy/70" />
      <div className={`relative z-10 w-full max-w-lg overflow-hidden rounded-sm bg-white shadow-2xl transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
        <div className="p-5 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#9a0827]">Enquiry</p>
              <h3 className="mt-2 font-serif text-2xl font-bold text-navy">{merged.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{merged.description}</p>
            </div>
            <button onClick={() => setVisible(false)} className="rounded-sm border px-2 py-1 text-xs" aria-label="Close enquiry popup">Close</button>
          </div>

          {merged.popup_image && (
            <div className="mt-3 overflow-hidden rounded-sm border border-cream-dark">
              <img src={merged.popup_image} alt="Enquiry popup" className="h-32 w-full object-cover" />
            </div>
          )}

          <div className="mt-4 grid gap-3">
            {merged.show_name && (
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full Name"
                className="w-full rounded-sm border border-cream-dark p-2 text-sm"
              />
            )}
            {merged.show_phone && (
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="Phone Number"
                className="w-full rounded-sm border border-cream-dark p-2 text-sm"
              />
            )}
            {merged.show_email && (
              <input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Email Address"
                className="w-full rounded-sm border border-cream-dark p-2 text-sm"
              />
            )}
            {merged.show_message && (
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Description / Purpose of Enquiry"
                className="min-h-24 w-full rounded-sm border border-cream-dark p-2 text-sm"
              />
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setVisible(false)} className="rounded-sm border px-3 py-2 text-sm">Close</button>
            <button disabled={submitting} onClick={submit} className="rounded-sm bg-[#9a0827] px-4 py-2 text-sm text-white disabled:opacity-60">
              {submitting ? "Submitting..." : merged.button_text || "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
