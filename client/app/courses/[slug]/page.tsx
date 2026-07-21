import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { courseCatalog } from "@/lib/site-data";
import { fetchPublicJson } from "@/lib/api";

export const dynamic = "force-dynamic";

type CoursePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return courseCatalog.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const response = await fetchPublicJson<any>(`/courses/slug/${slug}`);
  const course = response || courseCatalog.find((item) => item.slug === slug);
  if (!course) {
    return { title: "Course not found" };
  }
  return { title: `${course.title} | Viveka College`, description: course.description };
}

export default async function CourseDetailPage({ params }: CoursePageProps) {
  const { slug } = await params;
  const liveCourse = await fetchPublicJson<any>(`/courses/slug/${slug}`);
  const course = liveCourse || courseCatalog.find((item) => item.slug === slug);

  if (!course) {
    notFound();
  }

  return (
    <main>
      <PageHeader eyebrow="Course Detail" title={course.title} description={course.description} actionLabel="Apply for this course" actionHref="/apply" />
      <section className="py-16 bg-cream">
        <div className="container mx-auto px-6 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <article className="bg-white border border-cream-dark rounded-sm overflow-hidden shadow-xl">
            <img src={course.image} alt={course.title} className="w-full h-105 object-cover" fetchPriority="high" />
            <div className="p-8 space-y-5">
              <p className="text-maroon uppercase tracking-[0.25em] text-[11px] font-bold">{course.category}</p>
              <h2 className="font-serif text-3xl font-bold text-navy">About this program</h2>
              <p className="text-gray-text leading-relaxed">{course.description}</p>
              <div className="grid sm:grid-cols-3 gap-4">
                <InfoCard label="Duration" value={course.duration} />
                <InfoCard label="Eligibility" value={course.eligibility} />
                <InfoCard label="Fees" value={course.fees} />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold text-navy mb-3">Learning highlights</h3>
                <div className="flex flex-wrap gap-3">
                  {(course.highlights || []).map((item: string) => <span key={item} className="bg-navy/5 text-navy px-4 py-2 rounded-full text-sm font-semibold">{item}</span>)}
                </div>
              </div>
            </div>
          </article>

          <aside className="space-y-6">
            <div className="bg-navy text-white rounded-sm p-8 shadow-xl">
              <p className="text-cream/60 uppercase tracking-[0.25em] text-[11px] font-bold mb-2">Seats Available</p>
              <p className="font-serif text-6xl font-bold text-maroon">{course.seats}</p>
              <p className="text-cream/75 mt-3">Apply early to secure your seat.</p>
            </div>
            <div className="bg-white border border-cream-dark rounded-sm p-8 shadow-lg space-y-4">
              <h3 className="font-serif text-2xl font-bold text-navy">Need help choosing?</h3>
              <p className="text-gray-text leading-relaxed">Our admissions desk can help you review eligibility, career scope, and application steps.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/contact" className="bg-navy text-white px-5 py-3 rounded-sm text-sm font-bold uppercase tracking-[0.2em]">Contact Us</Link>
                <Link href="/courses" className="bg-maroon text-white px-5 py-3 rounded-sm text-sm font-bold uppercase tracking-[0.2em]">Back to Courses</Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-cream rounded-sm p-4 border border-cream-dark">
      <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-bold">{label}</p>
      <p className="text-navy font-semibold mt-2">{value}</p>
    </div>
  );
}
