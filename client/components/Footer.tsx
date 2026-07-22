"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchPublicJson } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FooterContent {
  logoUrl?: string;
  collegeName?: string;
  description?: string;
  copyright?: string;
}

interface QuickLink {
  id: string;
  label: string;
  url: string;
  openInNewTab?: boolean;
  enabled?: boolean;
  order?: number;
}

interface Accreditation {
  id: string;
  title: string;
  imageUrl?: string;
  description?: string;
  enabled?: boolean;
  order?: number;
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

interface FooterData {
  content?: FooterContent;
  quickLinks?: QuickLink[];
  accreditations?: Accreditation[];
  contact?: ContactInfo;
}

// ─── Fallbacks ────────────────────────────────────────────────────────────────
const defaultContent: FooterContent = {
  logoUrl: "",
  collegeName: "Viveka College",
  description:
    "Empowering minds since 1995. Dedicated to fostering academic excellence, critical thinking, and character development in our students.",
  copyright: "",
};

const defaultLinks: QuickLink[] = [
  { id: "ql-1", label: "About", url: "/about", enabled: true, order: 0 },
  { id: "ql-2", label: "Courses", url: "/courses", enabled: true, order: 1 },
  { id: "ql-3", label: "Gallery", url: "/gallery", enabled: true, order: 2 },
  { id: "ql-4", label: "Contact", url: "/contact", enabled: true, order: 3 },
  { id: "ql-5", label: "Apply Now", url: "/apply", enabled: true, order: 4 },
];

const defaultAccreditations: Accreditation[] = [
  { id: "ac-1", title: "NAAC A++", imageUrl: "", enabled: true, order: 0 },
  { id: "ac-2", title: "UGC RECOG", imageUrl: "", enabled: true, order: 1 },
];

// ─── Component ────────────────────────────────────────────────────────────────
const Footer = () => {
  const [content, setContent] = useState<FooterContent>(defaultContent);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>(defaultLinks);
  const [accreditations, setAccreditations] = useState<Accreditation[]>(defaultAccreditations);
  const [contact, setContact] = useState<ContactInfo>({
    address: "12–16, SKM Complex, Bus Stand Opposite, Dindigul Road, Theni, Tamil Nadu",
    phone: "04561 – 459374 | 94884 55306 | 97863 92406 | 94882 55306",
    email: "admissions@tnou.edu.in",
  });

  useEffect(() => {
    fetchPublicJson<FooterData>("/footer").then((data) => {
      if (!data) return;

      if (data.content) {
        setContent((prev) => ({ ...prev, ...data.content }));
      }

      if (Array.isArray(data.quickLinks) && data.quickLinks.length > 0) {
        const enabled = data.quickLinks
          .filter((l) => l.enabled !== false)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setQuickLinks(enabled.length > 0 ? enabled : defaultLinks);
      }

      if (Array.isArray(data.accreditations) && data.accreditations.length > 0) {
        const enabled = data.accreditations
          .filter((a) => a.enabled !== false)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setAccreditations(enabled.length > 0 ? enabled : defaultAccreditations);
      }

      if (data.contact && typeof data.contact === "object") {
        const c = data.contact;
        const phoneParts = [c.phone, c.phone2].filter(Boolean);
        setContact({
          address: c.address || contact.address,
          phone: phoneParts.length > 0 ? phoneParts.join(" | ") : contact.phone,
          email: c.email || contact.email,
          facebook: c.facebook,
          instagram: c.instagram,
          youtube: c.youtube,
          linkedin: c.linkedin,
          twitter: c.twitter,
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const socialLinks = [
    { href: contact.facebook, label: "Facebook" },
    { href: contact.instagram, label: "Instagram" },
    { href: contact.youtube, label: "YouTube" },
    { href: contact.linkedin, label: "LinkedIn" },
    { href: contact.twitter, label: "Twitter" },
  ].filter((s) => s.href);

  const year = new Date().getFullYear();
  const copyrightText =
    content.copyright || `© 2026 ${content.collegeName || "Viveka College"}. All Rights Reserved.`;

  return (
    <footer className="bg-navy-dark text-white pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <img
                src={content.logoUrl || "/logo.png"}
                alt={`${content.collegeName || "Viveka College"} Logo`}
                className="w-12 h-12 object-contain bg-white rounded-full p-1 shadow-md"
              />
              <h2 className="font-serif font-bold text-xl tracking-wide">
                {content.collegeName || "Viveka College"}
              </h2>
            </div>
            <p className="text-cream/60 text-sm leading-relaxed">
              {content.description || defaultContent.description}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cream/60 hover:text-maroon transition-colors underline underline-offset-2"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-serif text-lg font-bold mb-6 border-b border-maroon pb-2 w-fit">
              Quick Links
            </h3>
            <ul className="space-y-3 text-sm text-cream/70">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.url}
                    target={link.openInNewTab ? "_blank" : undefined}
                    rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                    className="hover:text-maroon transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-serif text-lg font-bold mb-6 border-b border-maroon pb-2 w-fit">
              Contact Us
            </h3>
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
            <h3 className="font-serif text-lg font-bold mb-6 border-b border-maroon pb-2 w-fit">
              Accreditation
            </h3>
            <div className="flex flex-wrap gap-4 opacity-70 grayscale hover:grayscale-0 transition-all">
              {accreditations.map((item) =>
                item.imageUrl ? (
                  <img
                    key={item.id}
                    src={item.imageUrl}
                    alt={item.title}
                    title={item.title}
                    className="w-16 h-16 object-contain rounded-sm border border-cream/20 bg-cream/10 p-1"
                  />
                ) : (
                  <div
                    key={item.id}
                    className="w-16 h-16 bg-cream/10 rounded-sm flex items-center justify-center text-[10px] text-center border border-cream/20"
                  >
                    {item.title}
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-cream/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[12px] text-cream/40">
          <p>{copyrightText}</p>
          <div className="flex flex-wrap gap-6">
            <Link href="/sitemap.xml" className="hover:text-cream transition-colors">
              Sitemap
            </Link>
            <Link href="/privacy" className="hover:text-cream transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-cream transition-colors">
              Terms of Use
            </Link>
            <Link href="/contact" className="hover:text-cream transition-colors">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
