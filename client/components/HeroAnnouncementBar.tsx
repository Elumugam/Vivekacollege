"use client";

import { useEffect, useState } from "react";
import { fetchPublicJson } from "@/lib/api";

const fallbackAnnouncement = "Admissions for Academic Year 2026-27 are now open | Scholarship applications available | Apply before March 31";

export default function HeroAnnouncementBar() {
  const [items, setItems] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});

  const load = async () => {
    try {
      const resp = await fetchPublicJson<any>(`/announcement/hero/public`);
      if (resp && resp.items && Array.isArray(resp.items) && resp.items.length > 0) {
        setItems(resp.items);
        setSettings(resp.settings || {});
      } else {
        // For hero slot, do NOT reuse the navbar/content fallback. Use a local fallback only.
        setItems([{ id: 'fallback', text: fallbackAnnouncement, enabled: true }]);
        setSettings({ image_width: null, image_height: null, gap: 12, pause_on_hover: true, speed: 25 });
      }
    } catch (err) { setItems([{ id: 'fallback', text: fallbackAnnouncement, enabled: true }]); }
  };

  useEffect(() => { load(); const poll = setInterval(load, 10000); window.addEventListener('announcements:updated', load); return () => { clearInterval(poll); window.removeEventListener('announcements:updated', load); }; }, []);

  const imageWidth = settings.image_width || settings.imageWidth || 32;
  const imageHeight = settings.image_height || settings.imageHeight || 32;
  const gap = settings.image_gap || settings.gap || 12;
  const speed = settings.scroll_speed || settings.speed || 25;
  const borderRadius = settings.image_border_radius || 0;
  const objectFit = settings.image_object_fit || 'cover';
  const pauseOnHover = settings.pause_on_hover !== false;

  const renderItemNode = (it: any) => {
    const images = Array.isArray(it.image_urls)
      ? it.image_urls
      : ((it.image_url || it.imageUrl || '') ? String(it.image_url || it.imageUrl).split(',').map(s => s.trim()).filter(Boolean) : []);
    return (
      <span key={it.id || Math.random()} className="inline-flex items-center gap-3 mr-6">
        {images.map((src: string, idx: number) => (
          <img key={idx} src={src} alt="announcement" loading="lazy" style={{ width: imageWidth, height: imageHeight, objectFit, borderRadius, display: 'inline-block', marginRight: gap }} />
        ))}
        <span>{it.text}</span>
        <span className="mx-2">|</span>
      </span>
    );
  };

  return (
    <div className="bg-maroon text-white relative z-50">
      <div className="w-full py-2">
        <div className="container mx-auto px-6 flex items-center justify-between min-h-10">
          <div className="flex items-center gap-4 overflow-hidden w-full">
            {/* Hero announcement should NOT show the LATEST NEWS badge */}
            <div className="overflow-hidden flex-1">
              <div
                onMouseEnter={(e) => { if (pauseOnHover) { const el = (e.currentTarget as HTMLElement).querySelector('.marquee-inner') as HTMLElement; if (el) el.style.animationPlayState = 'paused'; } }}
                onMouseLeave={(e) => { if (pauseOnHover) { const el = (e.currentTarget as HTMLElement).querySelector('.marquee-inner') as HTMLElement; if (el) el.style.animationPlayState = 'running'; } }}
                className="whitespace-nowrap text-sm font-medium"
              >
                <div className="marquee-inner" style={{ display: 'inline-block', paddingLeft: '100%', willChange: 'transform', animation: `marquee ${speed}s linear infinite` }}>
                  {items.filter(it => it.enabled).map(renderItemNode)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-100%); } }
        .marquee-inner { animation-play-state: running; }
      `}</style>
    </div>
  );
}
