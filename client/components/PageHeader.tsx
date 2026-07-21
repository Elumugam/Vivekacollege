"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  heroMedia?: {
    media_url?: string;
    media_type?: string;
    overlay_opacity?: number;
    overlay_enabled?: boolean;
    video_autoplay?: boolean;
    video_loop?: boolean;
    video_muted?: boolean;
    object_fit?: string;
  } | null;
  pageName?: string;
};
const PageHeader = ({ eyebrow, title, description, actionLabel, actionHref, heroMedia, pageName }: PageHeaderProps) => {
  const [mediaUrl, setMediaUrl] = useState(heroMedia?.media_url || '');
  const [mediaType, setMediaType] = useState(heroMedia?.media_type || '');
  const [overlayEnabled, setOverlayEnabled] = useState(heroMedia?.overlay_enabled ?? true);
  const [overlayOpacity, setOverlayOpacity] = useState(heroMedia?.overlay_opacity ?? 0.45);
  const [videoAutoplay, setVideoAutoplay] = useState(heroMedia?.video_autoplay ?? true);
  const [videoLoop, setVideoLoop] = useState(heroMedia?.video_loop ?? true);
  const [videoMuted, setVideoMuted] = useState(heroMedia?.video_muted ?? true);
  const [objectFit, setObjectFit] = useState(heroMedia?.object_fit || 'cover');

  useEffect(() => {
    setMediaUrl(heroMedia?.media_url || '');
    setMediaType(heroMedia?.media_type || '');
    setOverlayEnabled(heroMedia?.overlay_enabled ?? true);
    setOverlayOpacity(heroMedia?.overlay_opacity ?? 0.45);
    setVideoAutoplay(heroMedia?.video_autoplay ?? true);
    setVideoLoop(heroMedia?.video_loop ?? true);
    setVideoMuted(heroMedia?.video_muted ?? true);
    setObjectFit(heroMedia?.object_fit || 'cover');
  }, [heroMedia]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== 'hero_settings_update' || !e.newValue) return;
      try {
        const payload = JSON.parse(e.newValue as string);
        if (!payload || !payload.page) return;
        if (pageName && payload.page !== pageName) return;
        setMediaUrl(payload.media_url || '');
        setMediaType(payload.media_type || '');
        setVideoAutoplay(payload.video_autoplay ?? true);
        setVideoLoop(payload.video_loop ?? true);
        setVideoMuted(payload.video_muted ?? true);
        setObjectFit(payload.object_fit || 'cover');
      } catch (err) {}
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [pageName]);

  return (
    <section className="relative overflow-hidden bg-navy text-white pt-32 pb-16 md:pt-36 md:pb-20">
      {/* Background media injected via heroMedia prop when available */}
      <div className="absolute inset-0 z-0">
        {mediaUrl ? (
          String(mediaType || '').toLowerCase() === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(mediaUrl) ? (
            <video src={mediaUrl} autoPlay={videoAutoplay} muted={videoMuted} loop={videoLoop} playsInline controls={false} preload="auto" style={{ objectFit: objectFit as any }} className="h-full w-full absolute inset-0" />
          ) : (
            <div className="absolute inset-0" style={{ backgroundImage: `url("${mediaUrl}")`, backgroundSize: objectFit as any, backgroundPosition: 'center' }} />
          )
        ) : null}
        <div className="absolute inset-0" style={{ backgroundColor: `rgba(3,9,18,${overlayEnabled ? overlayOpacity : 0})` }} />
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(128,0,32,0.28), transparent 35%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at bottom left, rgba(255,255,255,0.08), transparent 30%)' }} />
        </div>
      </div>
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl">
          <p className="text-maroon uppercase tracking-[0.3em] text-[11px] font-bold mb-4">{eyebrow}</p>
          <h1 className="text-4xl md:text-6xl font-serif font-bold leading-tight mb-5">{title}</h1>
          <p className="text-cream/75 text-base md:text-lg leading-relaxed max-w-3xl">{description}</p>
          {actionLabel && actionHref ? (
            <Link href={actionHref} className="inline-flex mt-8 bg-maroon px-6 py-3 text-sm font-bold uppercase tracking-[0.2em] rounded-sm hover:bg-maroon-dark transition-colors">
              {actionLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default PageHeader;
