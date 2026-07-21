"use client";

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchPublicJson } from "@/lib/api";

const fallbackContact = {
    address: "12–16, SKM Complex, Bus Stand Opposite, Dindigul Road, Theni, Tamil Nadu",
    phone: "04561 – 459374 | 94884 55306 | 97863 92406 | 94882 55306",
    email: "admissions@tnou.edu.in",
};

const Footer = () => {
    const [contact, setContact] = useState(fallbackContact);

    useEffect(() => {
        fetchPublicJson<{ content?: Partial<typeof fallbackContact> & { phone2?: string } }>("/content/contact_info").then((response) => {
            if (!response?.content) return;
            const phoneParts = [response.content.phone, response.content.phone2].filter(Boolean);
            setContact({
                address: response.content.address || fallbackContact.address,
                phone: phoneParts.length > 0 ? phoneParts.join(" | ") : fallbackContact.phone,
                email: response.content.email || fallbackContact.email,
            });
        });
    }, []);

    return (
        <footer className="bg-navy-dark text-white pt-16 pb-8">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand Column */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <img
                                src="/logo.png"
                                alt="Viveka College Logo"
                                className="w-12 h-12 object-contain bg-white rounded-full p-1 shadow-md"
                            />
                            <h2 className="font-serif font-bold text-xl tracking-wide">Viveka College</h2>
                        </div>
                        <p className="text-cream/60 text-sm leading-relaxed">
                            Empowering minds since 1995. Dedicated to fostering academic excellence, critical thinking, and character development in our students.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-serif text-lg font-bold mb-6 border-b border-maroon pb-2 w-fit">Quick Links</h3>
                        <ul className="space-y-3 text-sm text-cream/70">
                            {[
                                { label: "About", href: "/about" },
                                { label: "Courses", href: "/courses" },
                                { label: "Gallery", href: "/gallery" },
                                { label: "Contact", href: "/contact" },
                                { label: "Apply Now", href: "/apply" },
                            ].map((link) => (
                                <li key={link.label}>
                                    <Link href={link.href} className="hover:text-maroon transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="font-serif text-lg font-bold mb-6 border-b border-maroon pb-2 w-fit">Contact Us</h3>
                        <ul className="space-y-4 text-sm text-cream/70">
                            <li className="flex gap-3">
                                <span className="text-maroon font-bold">A:</span>
                                {contact.address}
                            </li>
                            <li className="flex gap-3">
                                <span className="text-maroon font-bold">P:</span>
                                {contact.phone}
                            </li>
                            <li className="flex gap-3">
                                <span className="text-maroon font-bold">E:</span>
                                {contact.email}
                            </li>
                        </ul>
                    </div>

                    {/* Accreditation */}
                    <div>
                        <h3 className="font-serif text-lg font-bold mb-6 border-b border-maroon pb-2 w-fit">Accreditation</h3>
                        <div className="flex flex-wrap gap-4 opacity-70 grayscale hover:grayscale-0 transition-all">
                            {/* Placeholders for logos */}
                            <div className="w-16 h-16 bg-cream/10 rounded-sm flex items-center justify-center text-[10px] text-center border border-cream/20">
                                NAAC A++
                            </div>
                            <div className="w-16 h-16 bg-cream/10 rounded-sm flex items-center justify-center text-[10px] text-center border border-cream/20">
                                UGC RECOG
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-cream/10 pt-8 flex flex-col md:row justify-between items-center gap-4 text-[12px] text-cream/40">
                    <p>© {new Date().getFullYear()} Viveka College. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link href="/admin/login" className="hover:text-cream transition-colors">Admin Login</Link>
                        <Link href="/sitemap.xml" className="hover:text-cream transition-colors">Sitemap</Link>
                        <Link href="/contact" className="hover:text-cream transition-colors">Support</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
