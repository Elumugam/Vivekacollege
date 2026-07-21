import Link from "next/link";
import Hero from "@/components/Hero";
import AnnouncementBar from "@/components/AnnouncementBar";
import HeroAnnouncementBar from "@/components/HeroAnnouncementBar";
import ProgramsTeaser from "@/components/ProgramsTeaser";
import { fetchPublicJson } from "@/lib/api";
import { findAssignedMedia } from "@/lib/media";
import AboutClientWrapper from '@/components/AboutClientWrapper';

export const dynamic = "force-dynamic";

export default async function Home() {
  const [homeResponse, coursesResponse, mediaResponse] = await Promise.all([
    fetchPublicJson<{ content?: any; updated_at?: string; updatedAt?: string }>("/content/home"),
    fetchPublicJson<any[]>("/courses"),
    fetchPublicJson<any[]>("/media?page=home&section=about-the-university"),
  ]);

  const homeContent = homeResponse?.content || {};
  const homeMediaVersion = String(homeResponse?.updated_at || homeResponse?.updatedAt || homeContent.updated_at || homeContent.updatedAt || Date.now());
  const courses = Array.isArray(coursesResponse) && coursesResponse.length > 0 ? coursesResponse : undefined;
  const homeMedia = findAssignedMedia(mediaResponse, "home", "about-the-university");
  // Prefer explicit content-level mediaUrl (saved by admin). Fallback to assigned media or default image.
  const homeMediaUrl = homeContent.mediaUrl || homeMedia?.url || "/collegeimage.png";
  // Use content updated_at when available to bust caches, otherwise prefer media created_at
  const contentUpdated = String(homeResponse?.updated_at || homeResponse?.updatedAt || homeContent.updated_at || homeContent.updatedAt || Date.now());
  const mediaVersion = homeContent.updated_at || homeContent.updatedAt || (homeMedia ? String(homeMedia.created_at || homeMedia.id) : contentUpdated);
  const displayHomeMediaUrl = `${homeMediaUrl}${homeMediaUrl.includes("?") ? "&" : "?"}v=${encodeURIComponent(mediaVersion)}`;
  const homeMediaType = (homeContent.mediaType || homeContent.media_type) || homeMedia?.media_type || (/\.(mp4|webm|mov)(\?|$)/i.test(homeMediaUrl) ? "video" : "image");

  // Debug: log homeContent on server render to verify data binding
  try { console.log('homeContent', JSON.stringify(homeContent)); } catch (e) { /* ignore */ }

  return (
    <div className="flex flex-col">
      <Hero />

      {/* Hero announcement bar (below hero) */}
      <HeroAnnouncementBar />

      {/* Highlights Strip */}
      <section className="bg-cream py-6">
        <div className="container mx-auto px-6 flex flex-wrap justify-center gap-4">
          {[
            'UGC-DEB Recognized',
            'NAAC Accredited',
            'Government Job Eligibility',
            'Placement Assistance',
            'Scholarship Support',
          ].map((h) => (
            <div key={h} className="bg-white/80 border border-cream-dark px-5 py-3 rounded-sm shadow-sm text-sm font-semibold text-navy">
              {h}
            </div>
          ))}
        </div>
      </section>

      {/* Marquee Announcement Bar handled in layout (top) */}

      {/* Introduction Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          {/* Client-side dynamic About section to ensure admin updates appear immediately */}
          <AboutClientWrapper />

          <div className="space-y-8">
            <div>
              <h2 className="text-maroon font-sans font-bold tracking-[0.2em] uppercase text-sm mb-4">
                {homeContent.title || "About the University"}
              </h2>
              <h3 className="text-4xl md:text-5xl font-serif font-bold text-navy leading-tight">
                Viveka College — <span className="italic font-normal">{homeContent.subtitle || "Flexible, Recognized, Career-Focused"}</span>
              </h3>
            </div>
            <div className="text-gray-text space-y-6 leading-relaxed text-lg">
              <p>
                {homeContent.description || "Viveka College provides government-approved distance education programs, designed to support career growth, flexible learning schedules and skill development for rural and urban learners."}
              </p>
              <p>
                {homeContent.additionalDescription || "Our study centre, Vivega Samuthaya Kalvi, located in Theni, offers local student support, counseling, practical training sessions and placement assistance for eligible candidates across a wide range of undergraduate, postgraduate, diploma and professional programs."}
              </p>
            </div>
            <Link
              href={homeContent.cta1Url || "/about"}
              className="inline-block bg-navy-dark text-white px-8 py-4 rounded-sm font-semibold hover:bg-maroon transition-colors shadow-lg uppercase tracking-widest"
            >
              {homeContent.cta1Text || "Learn More About Us"}
            </Link>
          </div>
        </div>
      </section>

      {/* Focus Areas Section */}
      <section className="py-24 bg-cream overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-maroon font-sans font-bold tracking-[0.2em] uppercase text-sm mb-4">
              Our Areas of Impact
            </h2>
            <h3 className="text-4xl md:text-5xl font-serif font-bold text-navy">
              Strength Through <span className="italic font-normal">Action</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Women Empowerment",
                desc: "Skill training and life education programs to strengthen women's independence and leadership."
              },
              {
                title: "Youth Development",
                desc: "Computer education, paramedical training, and vocational courses for career readiness."
              },
              {
                title: "Rural & Farmer Support",
                desc: "Livelihood awareness and sustainable development initiatives for rural communities."
              },
              {
                title: "Adolescent & Community Welfare",
                desc: "Health awareness, life skills training, and social development programs."
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-10 border border-navy/5 shadow-xl hover:-translate-y-2 transition-transform duration-500">
                <div className="w-10 h-0.5 bg-maroon mb-6"></div>
                <h4 className="font-serif text-xl font-bold text-navy mb-4">{item.title}</h4>
                <p className="text-gray-text text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProgramsTeaser courses={courses} />

      {/* News/Announcements Placeholder */}
      <section className="py-24 bg-light-gray">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-navy mb-8">Latest News & Announcements</h2>
          <p className="text-gray-text text-lg">
            {homeContent.announcementText || "Stay updated with the latest happenings, events, and announcements from the study centre and Viveka College."}
            <br />
            (Content for news and announcements will go here.)
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-navy-dark py-20 text-white border-y border-white/10">
        <div className="container mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { label: "Trained Professionals", value: "5,000+" },
            { label: "Community Centers", value: "12" },
            { label: "Years of Impact", value: "18+" },
            { label: "Rural Projects", value: "45+" },
          ].map((stat, idx) => (
            <div key={idx} className="space-y-2">
              <p className="text-4xl md:text-5xl font-serif font-bold text-maroon">{stat.value}</p>
              <p className="text-cream/60 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-cream relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-maroon/5 -skew-x-12 translate-x-1/2"></div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-navy">Ready to begin your journey?</h2>
            <p className="text-gray-text text-lg leading-relaxed">
              Applications are currently being accepted for our vocational and vocational training programs. Connect with our team to learn more.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link
                href={homeContent.cta1Url || "/apply"}
                className="bg-maroon text-white px-10 py-4 rounded-sm font-bold shadow-xl hover:bg-maroon-dark transition-all scale-105 tracking-widest uppercase"
              >
                {homeContent.cta1Text || "Start Application"}
              </Link>
              <Link
                href={homeContent.cta2Url || "/contact"}
                className="bg-white text-navy border border-navy/10 px-10 py-4 rounded-sm font-bold hover:shadow-lg transition-all tracking-widest uppercase"
              >
                {homeContent.cta2Text || "Request Info"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
