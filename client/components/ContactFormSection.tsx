"use client";

import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { contactDetails } from "@/lib/site-data";
import { apiRequest, fetchPublicJson } from "@/lib/api";

const emptyForm = { name: "", email: "", phone: "", subject: "", message: "" };

const ContactFormSection = () => {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(contactDetails);

  useEffect(() => {
    fetchPublicJson<{ content?: any }>("/content/contact_info").then((response) => {
      if (!response?.content) return;
      const content = response.content;
      setDetails((current) => ({
        ...current,
        address: content.address || current.address,
        phones: [content.phone, content.phone2].filter(Boolean).length > 0 ? [content.phone, content.phone2].filter(Boolean) : current.phones,
        emails: content.email ? [content.email] : current.emails,
        hours: content.workingHours || current.hours,
        mapEmbedUrl: content.mapUrl || current.mapEmbedUrl,
      }));
    });
  }, []);

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error("Please complete the required fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/contact', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Unable to submit contact form");
      }

      toast.success("Your message has been sent successfully.");
      setForm(emptyForm);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 md:py-20 bg-cream">
      <div className="container mx-auto px-6 grid gap-10 lg:grid-cols-[1fr_0.9fr] items-start">
        <form onSubmit={submitForm} className="bg-white border border-cream-dark shadow-xl rounded-sm p-6 md:p-8 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Full name" className="input" />
            <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" placeholder="Email address" className="input" />
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Phone number" className="input" />
            <input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="Subject" className="input" />
          </div>
          <textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} rows={6} placeholder="Message" className="input resize-none" />
          <button disabled={loading} className="bg-maroon text-white px-6 py-3 rounded-sm font-bold uppercase tracking-[0.2em] text-sm hover:bg-maroon-dark transition-colors disabled:opacity-60">
            {loading ? "Sending..." : "Send Message"}
          </button>
        </form>

        <div className="space-y-6">
          <div className="bg-navy text-white rounded-sm p-6 shadow-xl">
            <p className="text-[11px] uppercase tracking-[0.25em] text-cream/60 mb-2">Contact Information</p>
            <h2 className="font-serif text-3xl font-bold mb-4">Let’s start a conversation</h2>
            <p className="text-cream/75 leading-relaxed">Reach our admissions and support team for course guidance, campus visits, and general assistance.</p>
          </div>

          <div className="bg-white border border-cream-dark rounded-sm p-6 space-y-4">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-maroon">Address</p>
            <p className="text-gray-text whitespace-pre-line">{details.address}</p>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-maroon">Phone</p>
            <div className="space-y-1 text-gray-text">
              {details.phones.map((phone) => <div key={phone}>{phone}</div>)}
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-maroon">Email</p>
            <div className="space-y-1 text-gray-text">
              {details.emails.map((email) => <div key={email}>{email}</div>)}
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-maroon">Working Hours</p>
            <p className="text-gray-text">{details.hours}</p>
          </div>

          <iframe title="Google Maps" src={details.mapEmbedUrl} loading="lazy" className="w-full h-72 rounded-sm border border-cream-dark" />
        </div>
      </div>
      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #e8e0d5;
          border-radius: 0.125rem;
          padding: 0.875rem 1rem;
          background: #fff;
          color: #00264d;
          outline: none;
        }
      `}</style>
    </section>
  );
};

export default ContactFormSection;
