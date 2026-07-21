"use client";

import { useEffect, useState } from "react";
import { fetchPublicJson } from "@/lib/api";

const fallbackAnnouncement = "Admissions for Academic Year 2026-27 are now open | Scholarship applications available | Apply before March 31";

export default function AnnouncementBar({ slot = 'top' }: { slot?: 'top' | 'hero' }) {
  const [isVisible, setIsVisible] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});

  const load = async () => {
    try {
      const resp = await fetchPublicJson<any>(`/announcement/${slot}/public`);
      if (resp && resp.items && Array.isArray(resp.items) && resp.items.length > 0) {
        setItems(resp.items);
        setSettings(resp.settings || {});
      } else {
        // fallback to legacy single announcement
        const response = await fetchPublicJson<{ content?: { announcement?: string } }>("/content/navbar");
        const cms = response?.content?.announcement;
        setItems([{ id: 'fallback', text: cms || fallbackAnnouncement, enabled: true }]);
        setSettings({ image_width: null, image_height: null, gap: 12, pause_on_hover: true, speed: 25 });
      }
    } catch (err) {
      setItems([{ id: 'fallback', text: fallbackAnnouncement, enabled: true }]);
    }
  };

  useEffect(() => {
    load();
    const poll = setInterval(() => { load(); }, 10000);
    const handleUpdate = () => { load(); };
    window.addEventListener("announcements:updated", handleUpdate);
    return () => { clearInterval(poll); window.removeEventListener("announcements:updated", handleUpdate); };
  }, [slot]);

  if (!isVisible) return null;

  const imageWidth = settings.image_width || settings.imageWidth || 32;
  const imageHeight = settings.image_height || settings.imageHeight || 32;
  const gap = settings.gap || 12;
  const speed = settings.speed || 25;
  const pauseOnHover = settings.pause_on_hover !== false;

  const renderItemNode = (it: any) => {
    const images = (it.image_url || it.imageUrl || '') ? String(it.image_url || it.imageUrl).split(',').map(s => s.trim()).filter(Boolean) : [];
    return (
      <span key={it.id || Math.random()} className="inline-flex items-center gap-3 mr-6">
        {images.map((src: string, idx: number) => (
          <img key={idx} src={src} alt="announcement" loading="lazy" style={{ width: imageWidth, height: imageHeight, objectFit: 'cover', display: 'inline-block', marginRight: gap }} />
        ))}
        <span>{it.text}</span>
        <span className="mx-2">|</span>
      </span>
    );
  };

  return (
    <div className="bg-maroon text-white relative z-60" style={{ overflow: 'hidden' }}>
      <div className="w-full py-2">
        <div className="flex items-center justify-between min-h-10 px-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="bg-white text-maroon text-[10px] font-bold px-2 py-0.5 rounded-sm whitespace-nowrap hidden sm:inline-block flex-shrink-0">LATEST NEWS</span>
            <div
              className="flex-1 min-w-0"
              style={{ overflow: 'hidden' }}
              onMouseEnter={(e) => { if (pauseOnHover) { const el = (e.currentTarget as HTMLElement).querySelector('.marquee-inner') as HTMLElement; if (el) el.style.animationPlayState = 'paused'; } }}
              onMouseLeave={(e) => { if (pauseOnHover) { const el = (e.currentTarget as HTMLElement).querySelector('.marquee-inner') as HTMLElement; if (el) el.style.animationPlayState = 'running'; } }}
            >
              <div
                className="marquee-inner whitespace-nowrap text-sm font-medium"
                style={{ display: 'inline-block', paddingLeft: '100vw', willChange: 'transform', animation: `marquee ${speed}s linear infinite` }}
              >
                {items.filter(it => it.enabled).map(renderItemNode)}
              </div>
            </div>
          </div>

          <button
            suppressHydrationWarning
            onClick={() => setIsVisible(false)}
            className="ml-3 p-1 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
            aria-label="Close announcement"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .marquee-inner { animation-play-state: running; }
      `}</style>
    </div>
  );
}
