import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { fetchPublicJson } from "@/lib/api";
import { findAssignedMedia } from "@/lib/media";
import { achievements, facultyHighlights, historyTimeline, infrastructure, missionPoints, siteStats, visionPoints } from "@/lib/site-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About Viveka College",
  description: "Viveka College offers distance education, undergraduate, postgraduate, diploma and professional programs with academic guidance and career support.",
};

const splitLines = (value?: string, fallback: string[] = []) => {
  const items = String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : fallback;
};

export default async function AboutPage() {
  const [response, mediaItems] = await Promise.all([
    fetchPublicJson<{ content?: any }>('/content/about'),
    fetchPublicJson<any[]>('/media?page=about'),
  ]);
  const aboutContent = response?.content || {};
  const heroSettings = await fetchPublicJson<any>(`/hero-settings?page=about`);
  const aboutBannerMedia = findAssignedMedia(mediaItems, 'about', 'about-banner');
  const principalMedia = findAssignedMedia(mediaItems, 'about', 'chairman-principal-message');
  const facultyMedia = findAssignedMedia(mediaItems, 'about', 'faculty-highlights');
  const historyMedia = findAssignedMedia(mediaItems, 'about', 'history');
  const aboutMediaUrl = aboutBannerMedia?.url || aboutContent.imageUrl || aboutContent.videoUrl || heroSettings?.media_url || '';
  const aboutMediaType = aboutBannerMedia?.media_type || aboutContent.mediaType || heroSettings?.media_type || (aboutContent.videoUrl ? 'video' : aboutContent.imageUrl ? 'image' : 'image');
  const mediaBlock = (mediaItem: any, fallbackUrl = '', fallbackType = 'image') => {
    const mediaUrl = mediaItem?.url || fallbackUrl;
    const mediaType = mediaItem?.media_type || fallbackType;
    if (!mediaUrl) return null;
    return mediaType === 'video' ? (
      <video
        src={mediaUrl}
        autoPlay
        muted
        loop
        playsInline
        controls={false}
        preload="auto"
        onPause={(event) => { void event.currentTarget.play().catch(() => void 0); }}
        className="w-full h-72 object-cover bg-black"
      />
    ) : (
      <img src={mediaUrl} alt="About media" className="w-full h-72 object-cover" />
    );
  };

  return (
    <main>
      <PageHeader
        eyebrow="About the College"
        title="Education built on purpose, dignity, and community impact"
        description={aboutContent.principal || "Viveka College combines academic direction, practical skill-building, and social responsibility to support students and the wider community."}
        actionLabel="Apply Now"
        actionHref="/apply"
        heroMedia={aboutBannerMedia ? { ...heroSettings, media_url: aboutBannerMedia.url, media_type: aboutBannerMedia.media_type } : heroSettings || null}
        pageName="about"
      />

      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 grid gap-8 md:grid-cols-2">
          <article className="bg-cream p-8 rounded-sm border border-cream-dark shadow-sm">
            <p className="text-maroon uppercase tracking-[0.25em] text-[11px] font-bold mb-3">Mission</p>
            <h2 className="font-serif text-3xl font-bold text-navy mb-4">Opening pathways through accessible learning</h2>
            <ul className="space-y-3 text-gray-text leading-relaxed">
              {splitLines(aboutContent.mission, missionPoints).map((point) => <li key={point}>• {point}</li>)}
            </ul>
          </article>
          <article className="bg-navy text-white p-8 rounded-sm border border-navy-dark shadow-sm">
            <p className="text-cream/60 uppercase tracking-[0.25em] text-[11px] font-bold mb-3">Vision</p>
            <h2 className="font-serif text-3xl font-bold mb-4">A college that lifts communities while shaping careers</h2>
            <ul className="space-y-3 text-cream/80 leading-relaxed">
              {splitLines(aboutContent.vision, visionPoints).map((point) => <li key={point}>• {point}</li>)}
            </ul>
          </article>
        </div>
      </section>

      <section className="py-16 bg-cream">
        <div className="container mx-auto px-6 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] items-center">
          <div className="space-y-6">
            {aboutMediaUrl ? (
              <div className="bg-white border border-cream-dark overflow-hidden rounded-sm shadow-lg">
                {mediaBlock(aboutBannerMedia, aboutMediaUrl, aboutMediaType)}
              </div>
            ) : null}
            <div className="bg-white border border-cream-dark p-6 rounded-sm shadow-lg">
              <p className="text-[11px] uppercase tracking-[0.25em] text-maroon font-bold mb-2">Chairman / Principal Message</p>
              {principalMedia ? (
                <div className="mb-4 overflow-hidden rounded-sm border border-cream-dark">
                  {mediaBlock(principalMedia, '', 'image')}
                </div>
              ) : null}
              <h2 className="font-serif text-3xl font-bold text-navy mb-4">Leadership that stays close to students and outcomes</h2>
              <p className="text-gray-text leading-relaxed">{aboutContent.principal || "The university and local study centre leadership focus on faculty support, flexible curriculum delivery, and student services to ensure learners are prepared for career and further study."}</p>
              {aboutContent.principalName ? <p className="mt-4 text-sm font-semibold text-maroon">{aboutContent.principalName}</p> : null}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {achievements.map((item) => (
                <div key={item.label} className="bg-white p-5 rounded-sm border border-cream-dark shadow-sm">
                  <p className="font-serif text-3xl font-bold text-maroon">{item.value}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mt-2">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="bg-white p-6 rounded-sm border border-cream-dark shadow-sm">
              <p className="text-maroon uppercase tracking-[0.25em] text-[11px] font-bold mb-3">Why choose us</p>
              <div className="grid gap-4 md:grid-cols-2">
                {siteStats.map((stat) => (
                  <div key={stat.label} className="bg-cream p-4 rounded-sm">
                    <p className="font-serif text-3xl font-bold text-navy">{stat.value}</p>
                    <p className="text-sm font-semibold text-maroon mt-2">{stat.label}</p>
                    <p className="text-sm text-gray-text mt-2">{stat.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-sm border border-cream-dark shadow-sm">
              <p className="text-maroon uppercase tracking-[0.25em] text-[11px] font-bold mb-3">Faculty highlights</p>
              {facultyMedia ? (
                <div className="mb-4 overflow-hidden rounded-sm border border-cream-dark">
                  {mediaBlock(facultyMedia, '', 'image')}
                </div>
              ) : null}
              <div className="grid gap-4">
                {facultyHighlights.map((item) => (
                  <div key={item.name}>
                    <h3 className="font-serif text-xl font-bold text-navy">{item.name}</h3>
                    <p className="text-gray-text">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] items-start">
          <div>
            <p className="text-maroon uppercase tracking-[0.25em] text-[11px] font-bold mb-3">History</p>
            {historyMedia ? (
              <div className="mb-4 overflow-hidden rounded-sm border border-cream-dark shadow-sm">
                {mediaBlock(historyMedia, '', 'image')}
              </div>
            ) : null}
            <h2 className="font-serif text-4xl font-bold text-navy mb-4">A timeline of steady growth</h2>
            <p className="text-gray-text leading-relaxed">Each stage in our journey has been shaped by community needs, practical education, and sustained improvement in infrastructure and teaching quality.</p>
          </div>
          <div className="space-y-4">
            {historyTimeline.map((item) => (
              <div key={item.year} className="grid md:grid-cols-[120px_1fr] gap-4 bg-cream p-5 rounded-sm border border-cream-dark">
                <div className="font-serif text-3xl font-bold text-maroon">{item.year}</div>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-navy">{item.title}</h3>
                  <p className="text-gray-text mt-2">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-cream">
        <div className="container mx-auto px-6 grid gap-8 md:grid-cols-2">
          <article className="bg-white p-8 rounded-sm border border-cream-dark shadow-sm">
            <p className="text-maroon uppercase tracking-[0.25em] text-[11px] font-bold mb-3">Infrastructure</p>
            <h2 className="font-serif text-3xl font-bold text-navy mb-4">Spaces designed for practical learning</h2>
            <ul className="space-y-3 text-gray-text leading-relaxed">
              {infrastructure.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </article>
          <article className="bg-navy text-white p-8 rounded-sm border border-navy-dark shadow-sm">
            <p className="text-cream/60 uppercase tracking-[0.25em] text-[11px] font-bold mb-3">CTA</p>
            <h2 className="font-serif text-3xl font-bold mb-4">Ready to explore admissions?</h2>
            <p className="text-cream/75 leading-relaxed mb-6">Start with the courses page or complete an application if you are ready to join the next intake.</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/courses" className="bg-maroon px-6 py-3 rounded-sm font-bold uppercase tracking-[0.2em] text-sm">Browse Courses</Link>
              <Link href="/apply" className="bg-white text-navy px-6 py-3 rounded-sm font-bold uppercase tracking-[0.2em] text-sm">Apply Now</Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
