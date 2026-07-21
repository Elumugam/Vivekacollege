import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { fetchPublicJson } from "@/lib/api";
import ApplicationFormClient from "@/components/ApplicationFormClient";

export const metadata: Metadata = {
  title: "Apply Now | Viveka College",
  description: "Submit your application for distance and vocational programs.",
};

export default async function ApplyPage() {
  const heroSettings = await fetchPublicJson<any>(`/hero-settings?page=apply`);
  return (
    <main>
      <PageHeader
        eyebrow="Admissions"
        title="Submit your student application"
        description="Complete the form, upload your documents, and send the application directly to the admissions backend."
        heroMedia={heroSettings || null}
        pageName="apply"
      />
      <ApplicationFormClient />
    </main>
  );
}
