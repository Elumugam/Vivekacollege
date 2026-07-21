import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import CoursesBrowser from "@/components/CoursesBrowser";
import { fetchPublicJson } from "@/lib/api";

export const metadata: Metadata = {
  title: "Courses | Viveka College",
  description: "Explore recognized distance education courses, diplomas and professional programs.",
};

export default async function CoursesPage() {
  const heroSettings = await fetchPublicJson<any>(`/hero-settings?page=courses`);
  return (
    <main>
      <PageHeader
        eyebrow="Courses"
        title="Skill-focused programs designed for career outcomes"
        description="Search and filter through the college offerings, inspect course details, and apply directly from the course experience."
        actionLabel="Apply Now"
        actionHref="/apply"
        heroMedia={heroSettings || null}
        pageName="courses"
      />
      <CoursesBrowser />
    </main>
  );
}
