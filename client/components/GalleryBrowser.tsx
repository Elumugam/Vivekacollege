"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchPublicJson } from "@/lib/api";
import { galleryCategories, galleryItems } from "@/lib/site-data";

const GalleryBrowser = () => {
  const [category, setCategory] = useState("All");
  const [activeItem, setActiveItem] = useState<(typeof galleryItems)[number] | null>(null);
  const [items, setItems] = useState(galleryItems);

  useEffect(() => {
    fetchPublicJson<any[]>("/gallery").then((response) => {
      if (Array.isArray(response) && response.length > 0) {
        setItems(response);
      }
    });
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => category === "All" || item.category === category);
  }, [category, items]);

  return (
    <section className="py-16 md:py-20 bg-cream">
      <div className="container mx-auto px-6">
        <div className="flex flex-wrap gap-3 mb-8">
          {galleryCategories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${category === item ? "bg-maroon text-white border-maroon" : "bg-white border-cream-dark text-navy hover:border-maroon hover:text-maroon"}`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="columns-1 sm:columns-2 xl:columns-3 gap-5 space-y-5">
          {filteredItems.map((item) => (
            <div key={item.id} role="button" tabIndex={0} onClick={() => setActiveItem(item)} onKeyDown={(event) => event.key === "Enter" && setActiveItem(item)} className="group w-full break-inside-avoid relative overflow-hidden rounded-sm bg-white shadow-md hover:shadow-2xl transition-all text-left cursor-pointer">
              {item.type === "video" ? (
                <video
                  src={item.src}
                  className="h-72 w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls={false}
                  preload="auto"
                  onPause={(event) => { void event.currentTarget.play().catch(() => void 0); }}
                />
              ) : (
                <img src={item.src} alt={item.title} className="h-72 w-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
              )}
              <div className="absolute inset-0 bg-linear-to-t from-navy/75 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <p className="text-[10px] uppercase tracking-[0.25em] text-cream/70">{item.category}</p>
                <h3 className="font-serif text-xl font-bold">{item.title}</h3>
              </div>
            </div>
          ))}
        </div>

        {activeItem ? (
          <div className="fixed inset-0 z-80 bg-navy/85 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setActiveItem(null)}>
            <div className="bg-white max-w-5xl w-full rounded-sm overflow-hidden shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-cream-dark">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-maroon font-bold">{activeItem.category}</p>
                  <h3 className="font-serif text-2xl font-bold text-navy">{activeItem.title}</h3>
                </div>
                <button onClick={() => setActiveItem(null)} className="text-sm font-bold uppercase tracking-[0.2em] text-gray-text">Close</button>
              </div>
              <div className="bg-black">
                {activeItem.type === "video" ? (
                  <video
                    src={activeItem.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls={false}
                    preload="auto"
                    onPause={(event) => { void event.currentTarget.play().catch(() => void 0); }}
                    className="w-full max-h-[75vh] object-contain bg-black"
                  />
                ) : (
                  <img src={activeItem.src} alt={activeItem.title} className="w-full max-h-[75vh] object-contain" />
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default GalleryBrowser;
