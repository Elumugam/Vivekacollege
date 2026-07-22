"use client";
import React, { useEffect, useState } from "react";
import { fetchPublicJson } from "@/lib/api";
import { findAssignedMedia, resolveMediaUrl } from "@/lib/media";

export default function DynamicAbout() {
  const [homeContent, setHomeContent] = useState<any>(null);
  const [mediaAsset, setMediaAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  const load = async () => {
    setLoading(true);
    setImgError(false);
    try {
      const [homeResp, mediaResp] = await Promise.all([
        fetchPublicJson<any>('/content/home'),
        fetchPublicJson<any[]>('/media?page=home&section=about-the-university'),
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
  const rawMediaUrl = content.mediaUrl || content.image_url || content.media_url || content.image || mediaAsset?.url || mediaAsset?.path || '/collegeimage.png';
  const resolvedUrl = resolveMediaUrl(rawMediaUrl);
  const version = content.updated_at || content.updatedAt || mediaAsset?.created_at || Date.now();
  const displayUrl = imgError
    ? '/collegeimage.png'
    : (resolvedUrl.startsWith('data:') ? resolvedUrl : `${resolvedUrl}${resolvedUrl.includes('?') ? '&' : '?'}v=${encodeURIComponent(String(version))}`);
  const mediaType = (content.mediaType || content.media_type) || (mediaAsset?.media_type || (/\.(mp4|webm|mov)(\?|$)/i.test(resolvedUrl) ? 'video' : 'image'));

  // Render only the left column (media + quote) so this component can be mounted inside
  // the existing server-rendered layout without duplicating text content.
  return (
    <div className="relative">
      <div className="aspect-4/5 bg-cream rounded-sm overflow-hidden shadow-2xl">
        {mediaType === 'video' && !imgError ? (
          <video src={displayUrl} autoPlay muted loop playsInline controls={false} preload="auto" className="w-full h-full object-cover" onError={() => setImgError(true)} />
        ) : (
          <img src={displayUrl} alt="Homepage media" loading="lazy" className="w-full h-full object-cover" onError={() => setImgError(true)} />
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
