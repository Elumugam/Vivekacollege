"use client";

import { useState } from "react";

const ContactForm = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("sending");

        // Simulate API call
        setTimeout(() => {
            setStatus("success");
            setFormData({ name: "", email: "", subject: "", message: "" });
        }, 1500);
    };

    return (
        <div className="bg-white p-8 md:p-12 shadow-2xl border border-cream-dark rounded-sm">
            <h3 className="text-3xl font-serif font-bold text-navy mb-8">Send us a Message</h3>

            {status === "success" ? (
                <div className="bg-green-50 text-green-700 p-6 rounded-sm border border-green-200 animate-fade-in">
                    <p className="font-bold flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Message Sent Successfully!
                    </p>
                    <p className="text-sm mt-2">Thank you for reaching out. Our team will get back to you shortly.</p>
                    <button
                        onClick={() => setStatus("idle")}
                        className="mt-6 text-sm font-bold text-green-800 underline underline-offset-4"
                    >
                        Send another message
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-navy/60">Full Name</label>
                            <input
                                type="text"
                                required
                                className="w-full border-b-2 border-cream-dark focus:border-maroon outline-none py-3 transition-colors font-sans"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-navy/60">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full border-b-2 border-cream-dark focus:border-maroon outline-none py-3 transition-colors font-sans"
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-navy/60">Subject</label>
                        <input
                            type="text"
                            required
                            className="w-full border-b-2 border-cream-dark focus:border-maroon outline-none py-3 transition-colors font-sans"
                            placeholder="Inquiry about B.A. Admissions"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-navy/60">Message</label>
                        <textarea
                            required
                            rows={5}
                            className="w-full border-b-2 border-cream-dark focus:border-maroon outline-none py-3 transition-colors font-sans resize-none"
                            placeholder="How can we help you?"
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={status === "sending"}
                        className="w-full bg-navy hover:bg-navy-dark text-white py-4 rounded-sm font-bold tracking-[0.2em] transition-all disabled:opacity-50 shadow-xl hover:-translate-y-1"
                    >
                        {status === "sending" ? "SENDING..." : "SEND MESSAGE"}
                    </button>
                </form>
            )}
        </div>
    );
};

export default ContactForm;
