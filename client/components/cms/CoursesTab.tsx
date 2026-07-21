"use client";
import { useEffect, useState } from "react";
import { useRef } from "react";
import toast from "react-hot-toast";
import { apiJson, deleteFile } from "@/lib/api";
import { inp, ta, Field, SaveBtn, UploadBtn, MediaPreview, SectionHeader } from "./CmsHelpers";

const CATS = ["Undergraduate", "Postgraduate", "Diploma", "Certificate", "PG Diploma", "Engineering", "Medical / Paramedical"];

const emptyCourse = {
  title: "",
  category: "Undergraduate",
  duration: "",
  fees: "",
  seats: "",
  description: "",
  eligibility: "",
  image: "",
  promoVideo: "",
  slug: "",
  highlights: "",
  is_featured: false,
};

const toForm = (course: any) => ({
  ...emptyCourse,
  ...course,
  seats: String(course?.seats ?? ""),
  highlights: Array.isArray(course?.highlights) ? course.highlights.join(", ") : String(course?.highlights || ""),
  image: course?.image || course?.thumbnail || course?.thumbnailUrl || "",
  promoVideo: course?.promoVideo || course?.video || course?.videoUrl || course?.promo_video || "",
});

export function CoursesTab({ courses, token, onRefresh }: { courses: any[]; token: string; onRefresh: () => void }) {
  const [form, setForm] = useState<any>(emptyCourse);
  const [editing, setEditing] = useState<string | null>(null);
  const [original, setOriginal] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const didSeedInitialCourse = useRef(false);

  useEffect(() => {
    if (!editing) return;
    const match = courses.find((course: any) => course.slug === editing);
    if (match) {
      setOriginal(match);
      setForm(toForm(match));
    }
  }, [courses, editing]);

  useEffect(() => {
    if (didSeedInitialCourse.current) return;
    if (editing || courses.length === 0) return;

    const firstCourse = courses[0];
    if (!firstCourse) return;

    didSeedInitialCourse.current = true;
    setOriginal(firstCourse);
    setEditing(firstCourse.slug);
    setForm(toForm(firstCourse));
  }, [courses, editing]);

  const set = (key: string, value: any) => setForm((current: any) => ({ ...current, [key]: value }));

  const cleanupOldMedia = async (previousCourse: any, nextCourse: any) => {
    const previousImage = previousCourse?.image || previousCourse?.thumbnail || previousCourse?.thumbnailUrl || "";
    const previousVideo = previousCourse?.promoVideo || previousCourse?.video || previousCourse?.videoUrl || previousCourse?.promo_video || "";

    if (previousImage && previousImage !== nextCourse?.image) {
      await deleteFile("course-media", previousImage, token).catch(() => null);
    }

    if (previousVideo && previousVideo !== nextCourse?.promoVideo) {
      await deleteFile("course-media", previousVideo, token).catch(() => null);
    }
  };

  const save = async () => {
    if (!form.title.trim()) return toast.error("Course title is required");

    setBusy(true);
    const payload = {
      ...form,
      seats: form.seats,
      highlights: form.highlights,
    };

    try {
      if (editing) {
        await apiJson(`/courses/${editing}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await cleanupOldMedia(original, form);
        toast.success("Course updated!");
      } else {
        await apiJson("/courses", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        toast.success("Course added!");
      }
      setForm(emptyCourse);
      setEditing(null);
      setOriginal(null);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to save course");
    } finally {
      setBusy(false);
    }
  };

  const del = async (slug: string) => {
    if (!confirm("Delete this course?")) return;
    try {
      const current = courses.find((course: any) => course.slug === slug);
      await apiJson(`/courses/${slug}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (current?.image) await deleteFile("course-media", current.image, token).catch(() => null);
      if (current?.promoVideo || current?.video || current?.videoUrl) {
        await deleteFile("course-media", current.promoVideo || current.video || current.videoUrl, token).catch(() => null);
      }
      toast.success("Deleted");
      if (editing === slug) {
        setForm(emptyCourse);
        setEditing(null);
        setOriginal(null);
      }
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed");
    }
  };

  const startEdit = (course: any) => {
    setForm(toForm(course));
    setEditing(course.slug);
    setOriginal(course);
  };

  const removeMedia = async (field: "image" | "promoVideo") => {
    const currentUrl = form[field];
    if (!currentUrl) return;
    await deleteFile("course-media", currentUrl, token).catch(() => null);
    set(field, "");
  };

  return (
    <div className="space-y-5">
      <SectionHeader title="Courses" subtitle="Add, edit, replace media, or delete course listings." />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <div className="rounded-sm border border-cream-dark bg-white p-4 space-y-3 h-fit">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#9a0827]">{editing ? "Editing Course" : "Add New Course"}</h3>
          <Field name="Title *"><input value={form.title} onChange={(e) => set("title", e.target.value)} className={inp} placeholder="e.g. B.Sc Computer Science" /></Field>
          <Field name="Category">
            <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inp}>
              {CATS.map((category) => <option key={category}>{category}</option>)}
            </select>
          </Field>
          <Field name="Duration"><input value={form.duration} onChange={(e) => set("duration", e.target.value)} className={inp} placeholder="e.g. 3 Years" /></Field>
          <Field name="Fees"><input value={form.fees} onChange={(e) => set("fees", e.target.value)} className={inp} placeholder="e.g. ₹45,000/year" /></Field>
          <Field name="Seats"><input type="number" value={form.seats} onChange={(e) => set("seats", e.target.value)} className={inp} placeholder="60" /></Field>
          <Field name="Eligibility"><input value={form.eligibility} onChange={(e) => set("eligibility", e.target.value)} className={inp} placeholder="e.g. 10+2 with 50%" /></Field>
          <Field name="Highlights (comma separated)"><input value={form.highlights} onChange={(e) => set("highlights", e.target.value)} className={inp} placeholder="Industry experts, Labs, Internship…" /></Field>
          <Field name="Description"><textarea value={form.description} onChange={(e) => set("description", e.target.value)} className={ta} rows={4} placeholder="Course overview…" /></Field>
          <Field name="Thumbnail Image">
            <div className="flex gap-2 flex-wrap items-center mt-1">
              <UploadBtn label={form.image ? "Replace Image" : "Upload Image"} bucket="course-media" token={token} onUrl={(url) => set("image", url)} />
              {form.image && <button onClick={() => removeMedia("image")} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a0827]">Remove Media</button>}
            </div>
            {form.image && <img src={form.image} className="mt-3 h-28 w-full rounded-sm border border-cream-dark object-cover" alt="Course image preview" />}
          </Field>
          <Field name="Promo Video">
            <div className="flex gap-2 flex-wrap items-center mt-1">
              <UploadBtn label={form.promoVideo ? "Replace Video" : "Upload Video"} bucket="course-media" token={token} accept="video/*" onUrl={(url) => set("promoVideo", url)} />
              {form.promoVideo && <button onClick={() => removeMedia("promoVideo")} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a0827]">Remove Media</button>}
            </div>
            {form.promoVideo && <video src={form.promoVideo} controls className="mt-3 h-32 w-full rounded-sm border border-cream-dark bg-black object-cover" />}
          </Field>
          <label className="flex items-center gap-2 text-sm cursor-pointer pt-1 text-navy">
            <input type="checkbox" checked={!!form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} className="w-4 h-4" />
            Featured course
          </label>
          <div className="flex gap-2 pt-1 flex-wrap">
            <SaveBtn onClick={save} busy={busy} text={editing ? "Update Course" : "Add Course"} />
            {editing && <button onClick={() => { setForm(emptyCourse); setEditing(null); setOriginal(null); }} className="px-4 py-2 rounded-sm border border-cream-dark text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 hover:bg-cream">Cancel</button>}
          </div>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-190 pr-1">
          {courses.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No courses yet. Add one using the form.</p>}
          {courses.map((course: any) => {
            const image = course.image || course.thumbnail || course.thumbnailUrl || "";
            const video = course.promoVideo || course.video || course.videoUrl || course.promo_video || "";
            return (
              <article key={course.slug} className={`rounded-sm border bg-white p-4 ${editing === course.slug ? "border-[#9a0827]" : "border-cream-dark"}`}>
                  <div className="grid gap-4 md:grid-cols-[120px_120px_1fr_auto] items-start">
                    <div className="overflow-hidden rounded-sm border border-cream-dark bg-[#f7f2eb]">
                      {image ? <img src={image} className="h-20 w-full object-cover" alt={course.title} /> : <div className="flex h-20 items-center justify-center text-xs text-slate-400">No image</div>}
                    </div>
                    <div className="overflow-hidden rounded-sm border border-cream-dark bg-black">
                      {video ? <video src={video} controls className="h-20 w-full object-cover" /> : <div className="flex h-20 items-center justify-center text-xs text-slate-400 bg-[#f7f2eb]">No video</div>}
                    </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-navy text-sm md:text-base">{course.title}</h4>
                      <span className="text-[10px] uppercase tracking-[0.2em] bg-[#9a0827]/10 px-2 py-1 font-semibold text-[#9a0827]">{course.category}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{course.duration} · {course.fees}</p>
                    <p className="text-xs text-gray-400 mt-1">{course.seats} seats · {course.eligibility}</p>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{course.description}</p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button onClick={() => startEdit(course)} className="rounded-sm bg-[#0b3568] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">Edit</button>
                    <button onClick={() => del(course.slug)} className="rounded-sm bg-[#9a0827] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">Delete</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
