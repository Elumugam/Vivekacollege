"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { courseCatalog } from "@/lib/site-data";
import { apiMultipart, fetchPublicJson } from "@/lib/api";

const emptyForm = {
  fullName: "",
  dob: "",
  gender: "",
  email: "",
  mobile: "",
  address: "",
  courseId: courseCatalog[0]?.slug ?? "",
  courseType: "",
  qualification: "",
};

const ApplicationForm = () => {
  const [form, setForm] = useState(emptyForm);
  const [documents, setDocuments] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState(courseCatalog);
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [courseDropdownPosition, setCourseDropdownPosition] = useState<"down" | "up">("down");
  const courseDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchPublicJson<any[]>("/courses").then((response) => {
      if (Array.isArray(response) && response.length > 0) {
        setCourses(response);
        setForm((current) => ({ ...current, courseId: response[0]?.slug || current.courseId }));
      }
    });
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target as Node)) {
        setCourseDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCourseDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!courseDropdownOpen || !courseDropdownRef.current) return;

    const updatePosition = () => {
      const bounds = courseDropdownRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const estimatedHeight = Math.min(320, courses.length * 44 + 16);
      const spaceBelow = window.innerHeight - bounds.bottom;
      const spaceAbove = bounds.top;
      setCourseDropdownPosition(spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove ? "down" : "up");
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [courseDropdownOpen, courses.length]);

  const submitApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    if (!form.fullName || !form.dob || !form.gender || !form.email || !form.mobile || !form.address || !form.courseId || !form.courseType || !form.qualification) {
      toast.error("Please fill in every required field.");
      return;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      const selectedCourse = courses.find((course) => course.slug === form.courseId);
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (selectedCourse?.title) {
        payload.append("courseTitle", selectedCourse.title);
      }
      Array.from(documents ?? []).forEach((file) => payload.append("documents", file));

      await apiMultipart<any>('/applications', {
        method: "POST",
        body: payload,
      }, 60000);

      toast.success("Application submitted successfully.");
      setForm(emptyForm);
      setDocuments(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 md:py-20 bg-cream">
      <div className="container mx-auto px-6 max-w-5xl">
        <form onSubmit={submitApplication} className="bg-white border border-cream-dark rounded-sm shadow-xl p-6 md:p-8 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <input className="input" placeholder="Student full name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
            <input className="input" type="date" value={form.dob} onChange={(event) => setForm({ ...form, dob: event.target.value })} />
            <select className="input" value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}>
              <option value="">Select gender</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
            <input className="input" placeholder="Email address" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <input className="input" placeholder="Mobile number" value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} />
            <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
              <div className="relative" ref={courseDropdownRef}>
                <button
                  type="button"
                  className="input flex items-center justify-between gap-3 text-left"
                  aria-haspopup="listbox"
                  aria-expanded={courseDropdownOpen}
                  onClick={() => setCourseDropdownOpen((current) => !current)}
                >
                  <span className="min-w-0 truncate">
                    {courses.find((course) => course.slug === form.courseId)?.title || "Select course"}
                  </span>
                  <span aria-hidden="true" className="text-xs text-gray-400">▾</span>
                </button>
                {courseDropdownOpen ? (
                  <div
                    role="listbox"
                    className={`absolute left-0 z-20 w-full overflow-hidden rounded-sm border border-cream-dark bg-white shadow-xl ${courseDropdownPosition === "up" ? "bottom-full mb-1" : "top-full mt-1"}`}
                  >
                    <div className="max-h-72 overflow-y-auto overscroll-contain">
                      {courses.map((course) => (
                        <button
                          key={course.slug}
                          type="button"
                          role="option"
                          aria-selected={form.courseId === course.slug}
                          onClick={() => {
                            setForm({ ...form, courseId: course.slug });
                            setCourseDropdownOpen(false);
                          }}
                          className={`block w-full px-4 py-3 text-left text-sm text-navy hover:bg-cream ${form.courseId === course.slug ? "bg-cream/60 font-semibold" : ""}`}
                        >
                          <span className="block truncate">{course.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              <select className="input" value={form.courseType} onChange={(event) => setForm({ ...form, courseType: event.target.value })}>
                <option value="">Select course type</option>
                <option value="Regular">Regular</option>
                <option value="Correspondence">Correspondence</option>
              </select>
            </div>
          </div>
          <textarea className="input resize-none" rows={4} placeholder="Address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
          <textarea className="input resize-none" rows={4} placeholder="Qualification details" value={form.qualification} onChange={(event) => setForm({ ...form, qualification: event.target.value })} />
          <input className="input" type="file" multiple onChange={(event) => setDocuments(event.target.files)} />
          <button disabled={loading} className="bg-maroon text-white px-6 py-3 rounded-sm font-bold uppercase tracking-[0.2em] text-sm hover:bg-maroon-dark transition-colors disabled:opacity-60">
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #e8e0d5;
          border-radius: 0.125rem;
          padding: 0.875rem 1rem;
          background: #fff;
          color: #00264d;
          outline: none;
        }
      `}</style>
    </section>
  );
};

export default ApplicationForm;
