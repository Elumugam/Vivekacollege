"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchPublicJson } from "@/lib/api";
import { courseCategories, courseCatalog } from "@/lib/site-data";

const pageSize = 4;

const CoursesBrowser = () => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [courses, setCourses] = useState(courseCatalog);

  useEffect(() => {
    fetchPublicJson<any[]>("/courses").then((response) => {
      if (Array.isArray(response) && response.length > 0) {
        setCourses(response);
      }
    });
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesQuery = `${course.title} ${course.description} ${course.eligibility}`.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "All" || course.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [category, courses, query]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / pageSize));
  const paginatedCourses = filteredCourses.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <section className="py-16 md:py-20 bg-cream">
      <div className="container mx-auto px-6">
        <div className="grid gap-5 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] md:items-start mb-8">
          <label className="bg-white border border-cream-dark rounded-sm px-4 py-2 shadow-sm flex min-w-0 items-center gap-3 self-start">
            <span className="text-maroon font-bold text-xs uppercase tracking-[0.2em]">Search</span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by course, eligibility, or description"
              className="min-w-0 w-full h-10 bg-transparent outline-none text-navy placeholder:text-gray-400"
            />
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 self-start">
            {courseCategories.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setCategory(item);
                  setCurrentPage(1);
                }}
                className={`px-4 py-3 rounded-sm border text-sm font-semibold transition-colors ${category === item ? "bg-navy text-white border-navy" : "bg-white border-cream-dark text-navy hover:border-maroon hover:text-maroon"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-2">
          {paginatedCourses.map((course) => (
            <article key={course.slug} className="bg-white border border-cream-dark rounded-sm overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="relative h-60 overflow-hidden">
                <img src={course.image} alt={course.title} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-linear-to-t from-navy/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.2em]">
                  <span className="bg-maroon text-white px-3 py-1 rounded-full">{course.category}</span>
                  <span className="bg-white/90 text-navy px-3 py-1 rounded-full">{course.duration}</span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-2xl font-serif font-bold text-navy leading-tight">{course.title}</h3>
                  <span className="text-sm font-bold text-maroon whitespace-nowrap">{course.fees}</span>
                </div>
                <p className="text-gray-text leading-relaxed">{course.description}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-cream rounded-sm p-3"><span className="block text-[11px] uppercase tracking-[0.2em] text-gray-500">Eligibility</span>{course.eligibility}</div>
                  <div className="bg-cream rounded-sm p-3"><span className="block text-[11px] uppercase tracking-[0.2em] text-gray-500">Seats</span>{course.seats}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {course.highlights.slice(0, 3).map((highlight) => (
                    <span key={highlight} className="text-xs bg-navy/5 text-navy px-3 py-1 rounded-full">{highlight}</span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link href={`/courses/${course.slug}`} className="inline-flex items-center justify-center px-5 py-3 bg-navy text-white rounded-sm text-sm font-bold uppercase tracking-[0.2em] hover:bg-navy-dark transition-colors">
                    View Details
                  </Link>
                  <Link href="/apply" className="inline-flex items-center justify-center px-5 py-3 bg-maroon text-white rounded-sm text-sm font-bold uppercase tracking-[0.2em] hover:bg-maroon-dark transition-colors">
                    Apply Now
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center gap-3">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className="px-4 py-2 border border-cream-dark bg-white text-sm font-semibold disabled:opacity-50">
            Previous
          </button>
          <span className="text-sm text-gray-text">Page {currentPage} of {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className="px-4 py-2 border border-cream-dark bg-white text-sm font-semibold disabled:opacity-50">
            Next
          </button>
        </div>
      </div>
    </section>
  );
};

export default CoursesBrowser;
