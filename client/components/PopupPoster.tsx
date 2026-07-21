"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchPublicJson } from "@/lib/api";

type PopupData = {
  enabled?: boolean;
  title?: string;
  description?: string;
  cta_text?: string;
  cta_url?: string;
  media_url?: string;
  media_type?: string;
  display_delay?: number;
};

const PopupPoster = () => {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<PopupData | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const load = async () => {
      const response = await fetchPublicJson<PopupData>("/popup-poster/current");
      if (!response || !response.enabled) return;
      setData(response);
      const delay = Number(response.display_delay ?? 0);
      timer = setTimeout(() => setVisible(true), Math.max(0, delay) * 1000);
    };

    void load();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!visible || !data?.enabled) return null;

  const isVideo = data.media_type === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(data.media_url || "");

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center px-4">
      <button aria-label="Close popup overlay" onClick={() => setVisible(false)} className="absolute inset-0 bg-navy/70" />
      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-sm bg-white shadow-2xl">
        <button onClick={() => setVisible(false)} aria-label="Close popup" className="absolute right-3 top-3 z-20 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-navy shadow-sm">X</button>
        <div className="grid gap-0 md:grid-cols-2">
          <div className="bg-cream">
            {isVideo ? (
              <video src={data.media_url} autoPlay muted loop playsInline className="h-full w-full object-cover" />
            ) : (
              <img src={data.media_url || "/collegeimage.png"} alt={data.title || "Popup poster"} className="h-full w-full object-cover" />
            )}
          </div>
          <div className="flex flex-col justify-center p-6 md:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#9a0827]">Popup Poster</p>
            <h2 className="mt-3 font-serif text-3xl font-bold text-navy">{data.title || "Admissions Open"}</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600">{data.description || ""}</p>
            {data.cta_text && data.cta_url && (
              <Link href={data.cta_url} className="mt-6 inline-flex w-fit rounded-sm bg-[#9a0827] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
                {data.cta_text}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopupPoster;