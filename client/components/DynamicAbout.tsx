"use client";
import React, { useEffect, useState } from "react";
import { fetchPublicJson, apiJson } from "@/lib/api";
import { findAssignedMedia } from "@/lib/media";

export default function DynamicAbout() {
  const [homeContent, setHomeContent] = useState<any>(null);
  const [mediaAsset, setMediaAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [homeResp, mediaResp] = await Promise.all([
        fetch('/api/content/home').then((r) => r.ok ? r.json().catch(() => null) : null).catch(() => null),
        fetch('/api/media?page=home&section=about-the-university').then((r) => r.ok ? r.json().catch(() => []) : []).catch(() => []),
      ]);

      const home = homeResp?.content || (homeResp?.content === undefined ? null : homeResp);
      setHomeContent(home || {});

      const media = Array.isArray(mediaResp) ? findAssignedMedia(mediaResp, 'home', 'about-the-university') : null;
      setMediaAsset(media || null);
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  if (!homeContent && loading) {
    // Render nothing until loaded to avoid content shift
    return null;
  }

  const content = homeContent || {};
  const mediaUrl = content.mediaUrl || mediaAsset?.url || '/collegeimage.png';
  const version = content.updated_at || content.updatedAt || mediaAsset?.created_at || Date.now();
  const displayUrl = `${mediaUrl}${mediaUrl.includes('?') ? '&' : '?'}v=${encodeURIComponent(String(version))}`;
  const mediaType = (content.mediaType || content.media_type) || (mediaAsset?.media_type || (/\.(mp4|webm|mov)(\?|$)/i.test(mediaUrl) ? 'video' : 'image'));

  // Render only the left column (media + quote) so this component can be mounted inside
  // the existing server-rendered layout without duplicating text content.
  return (
    <div className="relative">
      <div className="aspect-4/5 bg-cream rounded-sm overflow-hidden shadow-2xl">
        {mediaType === 'video' ? (
          <video src={displayUrl} autoPlay muted loop playsInline controls={false} preload="auto" className="w-full h-full object-cover" />
        ) : (
          <img src={displayUrl} alt="Homepage media" loading="lazy" className="w-full h-full object-cover" />
        )}
      </div>
      {content.quoteEnabled !== false && (
        <div className="absolute -bottom-10 -right-10 p-12 hidden lg:block shadow-2xl" style={{ background: content.quoteBgColor || undefined }}>
          <p className="font-serif text-3xl font-bold italic" style={{ color: content.quoteTextColor || '#ffffff' }}>{content.quoteText || '"Distance learning that builds careers and community futures"'}</p>
          <p className="mt-4 font-sans text-sm tracking-widest uppercase" style={{ color: (content.quoteTextColor ? (content.quoteTextColor + 'cc') : 'rgba(255,255,255,0.6)') }}>{content.quoteAuthor || '— Viveka College'}</p>
        </div>
      )}
    </div>
  );
}
