"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchPublicJson } from "@/lib/api";

type HeroContent = {
    title?: string;
    subtitle?: string;
    buttonText?: string;
    buttonUrl?: string;
    button2Text?: string;
    button2Url?: string;
    mediaUrl?: string;
    mediaType?: string;
};

const fallbackHero: Required<Pick<HeroContent, "title" | "subtitle" | "buttonText" | "buttonUrl" | "button2Text" | "button2Url" | "mediaUrl" | "mediaType">> = {
    title: "Distance Education for",
    subtitle: "Career Growth & Flexible Learning",
    buttonText: "Apply Now",
    buttonUrl: "/apply",
    button2Text: "Explore Courses",
    button2Url: "/courses",
    mediaUrl: "",
    mediaType: "image",
};

const resolveHeroMediaUrl = (rawUrl?: string | null) => {
    const value = String(rawUrl || "").trim();
    if (!value) return "";
    if (/^(https?:)?\/\//i.test(value) || value.startsWith("/")) {
        return value;
    }

    const base = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
    if (!base) return "";
    return `${base}/storage/v1/object/public/hero-media/${value.replace(/^\/+/, "")}`;
};

const withCacheBuster = (url: string, version: string) => {
    if (!url) return url;
    const joiner = url.includes("?") ? "&" : "?";
    return `${url}${joiner}v=${encodeURIComponent(version)}`;
};

const preloadImage = (url: string) => {
    if (!url) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Hero image failed to load"));
        image.src = url;
    });
};

const Hero = () => {
    const [hero, setHero] = useState({ ...fallbackHero, mediaUrl: "" });
    const [mediaReady, setMediaReady] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [cacheVersion, setCacheVersion] = useState<string>("initial");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setMediaReady(false);
            setImageLoaded(false);
            setHero((current) => ({ ...current, mediaUrl: "" }));
            const response = await fetchPublicJson<{ content?: HeroContent; updatedAt?: string | null; updated_at?: string | null }>("/content/hero");
            const content = response?.content || {};
            const resolvedMediaUrl = resolveHeroMediaUrl(content.mediaUrl);
            const nextVersion = String(response?.updatedAt || response?.updated_at || Date.now());
            const nextMediaType = content.mediaType || (resolvedMediaUrl && /\.(mp4|webm|mov)(\?|$)/i.test(resolvedMediaUrl) ? "video" : fallbackHero.mediaType);

            if (resolvedMediaUrl && nextMediaType !== "video") {
                await preloadImage(withCacheBuster(resolvedMediaUrl, nextVersion)).catch(() => undefined);
            }

            if (cancelled) return;

            setHero({
                ...fallbackHero,
                ...content,
                mediaUrl: resolvedMediaUrl,
                mediaType: nextMediaType,
            });
            setCacheVersion(nextVersion);
            setImageLoaded(!!resolvedMediaUrl && nextMediaType !== "video");
            setMediaReady(!!resolvedMediaUrl);
        };
        load();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const handler = (event: StorageEvent) => {
            if (event.key !== "hero_content_update" || !event.newValue) return;
            try {
                const payload = JSON.parse(event.newValue);
                const resolvedMediaUrl = resolveHeroMediaUrl(payload?.mediaUrl);
                const nextVersion = String(payload?.ts || Date.now());
                const nextMediaType = payload?.mediaType || (resolvedMediaUrl && /\.(mp4|webm|mov)(\?|$)/i.test(resolvedMediaUrl) ? "video" : "image");
                setMediaReady(false);
                setImageLoaded(false);
                setHero((current) => ({ ...current, mediaUrl: "" }));

                const applyUpdate = () => {
                    setHero((current) => ({
                        ...current,
                        mediaUrl: resolvedMediaUrl,
                        mediaType: nextMediaType,
                    }));
                    setCacheVersion(nextVersion);
                    setImageLoaded(!!resolvedMediaUrl && nextMediaType !== "video");
                    setMediaReady(!!resolvedMediaUrl);
                };

                if (resolvedMediaUrl && nextMediaType !== "video") {
                    void preloadImage(withCacheBuster(resolvedMediaUrl, nextVersion)).finally(applyUpdate);
                } else {
                    applyUpdate();
                }
            } catch (error) {
                // Ignore malformed storage payloads.
            }
        };

        window.addEventListener("storage", handler);
        return () => window.removeEventListener("storage", handler);
    }, []);

    const heroMediaUrl = withCacheBuster(hero.mediaUrl || "", cacheVersion);
    const isVideo = hero.mediaType === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(hero.mediaUrl || "");

    return (
        <section className="relative h-screen min-h-175 flex items-center justify-center overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                {!mediaReady ? (
                    <div className="absolute inset-0 bg-navy-dark" />
                ) : isVideo ? (
                    <video
                        key={heroMediaUrl}
                        src={heroMediaUrl}
                        autoPlay
                        muted
                        loop
                        playsInline
                        controls={false}
                        preload="auto"
                        onPause={(event) => { void event.currentTarget.play().catch(() => void 0); }}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <img
                        src={heroMediaUrl}
                        alt="Homepage hero"
                        onLoad={() => setImageLoaded(true)}
                        onError={() => {
                            setHero((current) => ({ ...current, mediaUrl: "" }));
                            setMediaReady(false);
                            setImageLoaded(true);
                        }}
                        className={`h-full w-full object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                    />
                )}
                <div className="absolute inset-0 bg-navy-dark/45"></div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 relative z-10 text-center">
                <div className="relative max-w-4xl mx-auto">
                    <h2 className="text-maroon font-sans font-bold tracking-[0.3em] uppercase mb-6 animate-fade-in text-sm sm:text-base">
                        Viveka College
                    </h2>
                    <h1 className="text-4xl md:text-7xl font-serif font-bold text-white mb-8 leading-tight animate-slide-up">
                        {hero.title} <br />
                        <span className="italic text-cream/90 font-normal">{hero.subtitle}</span>
                    </h1>
                    <p className="text-lg md:text-xl text-cream/80 font-sans mb-8 leading-relaxed max-w-3xl mx-auto animate-fade-in delay-200">
                        Government recognized distance education programs focused on skill development, employability and lifelong learning. Accredited by NAAC and UGC-DEB.
                    </p>

                    {/* Action buttons intentionally removed per design request. */}
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 animate-bounce opacity-50">
                <span className="text-cream text-[10px] tracking-[0.2em] font-sans uppercase">Scroll to Discover</span>
                <div className="w-px h-12 bg-cream/30"></div>
            </div>

            <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 1s ease-out forwards; }
        .animate-slide-up { animation: slideUp 1s ease-out forwards; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-500 { animation-delay: 0.5s; }
      `}</style>
        </section>
    );
};

export default Hero;
