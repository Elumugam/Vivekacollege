import Link from "next/link";
import { courseCatalog } from "@/lib/site-data";

const ProgramsTeaser = ({ courses = courseCatalog }: { courses?: typeof courseCatalog }) => {
    const featured = ["ba-tamil", "bsc-computer-science", "mcom"]
        .map((slug) => courses.find((course) => course.slug === slug))
        .filter((course): course is (typeof courseCatalog)[number] => Boolean(course));

    return (
        <section className="py-24 bg-cream">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div className="max-w-2xl">
                        <h2 className="text-maroon font-sans font-bold tracking-[0.2em] uppercase text-sm mb-4">
                            Academic Excellence
                        </h2>
                        <h3 className="text-4xl md:text-5xl font-serif font-bold text-navy leading-tight">
                            A Curriculum Designed for <span className="italic font-normal">Impact</span>
                        </h3>
                    </div>
                    <Link
                        href="/courses"
                        className="text-navy font-semibold flex items-center gap-2 group border-b-2 border-maroon pb-1"
                    >
                        View All Programs
                        <svg
                            className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {featured.map((program) => (
                        <div
                            key={program.slug}
                            className="group bg-white rounded-sm overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 border border-cream-dark"
                        >
                            <div className="relative h-64 overflow-hidden">
                                <img
                                    src={program.image}
                                    alt={program.title}
                                    loading="lazy"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute top-4 left-4">
                                    <span className="bg-navy/90 text-white text-[10px] font-bold px-3 py-1 uppercase tracking-wider rounded-full backdrop-blur-sm">
                                        {program.category}
                                    </span>
                                </div>
                            </div>
                            <div className="p-8">
                                <span className="text-maroon text-[11px] font-bold uppercase tracking-widest block mb-2">
                                    {program.duration}
                                </span>
                                <h4 className="text-2xl font-serif font-bold text-navy mb-4 group-hover:text-maroon transition-colors">
                                    {program.title}
                                </h4>
                                <p className="text-gray-text text-sm leading-relaxed mb-6">
                                    {program.description}
                                </p>
                                <Link
                                    href={`/courses/${program.slug}`}
                                    className="inline-block text-navy font-bold text-sm tracking-widest hover:text-maroon transition-colors"
                                >
                                    LEARN MORE
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ProgramsTeaser;
