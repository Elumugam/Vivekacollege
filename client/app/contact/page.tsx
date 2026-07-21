import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import { fetchPublicJson } from "@/lib/api";
import ContactFormSection from "@/components/ContactFormSection";

export const metadata: Metadata = {
  title: "Contact Viveka College",
  description: "Contact the study centre for admissions, support and campus information.",
};

export default async function ContactPage() {
  const heroSettings = await fetchPublicJson<any>(`/hero-settings?page=contact`);
  return (
    <main>
      <PageHeader
        eyebrow="Contact"
        title="Talk to the admissions and support team"
        description="Send a message, view contact details, and locate the campus with the embedded map."
        heroMedia={heroSettings || null}
        pageName="contact"
      />
      <ContactFormSection />
    </main>
  );
}
