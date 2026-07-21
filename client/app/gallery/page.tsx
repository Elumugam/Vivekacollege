import type { Metadata } from "next";
import PageHeader from "@/components/PageHeader";
import GalleryBrowser from "@/components/GalleryBrowser";
import { fetchPublicJson } from "@/lib/api";

export const metadata: Metadata = {
  title: "Gallery | Viveka College",
  description: "Browse study centre campus, events, classroom and workshop media.",
};

export default async function GalleryPage() {
  const heroSettings = await fetchPublicJson<any>(`/hero-settings?page=gallery`);
  return (
    <main>
      <PageHeader
        eyebrow="Gallery"
        title="Moments from campus life, celebrations, and learning"
        description="Filter images and videos by category, preview them in a lightbox, and keep the structure ready for future uploads."
        heroMedia={heroSettings || null}
        pageName="gallery"
      />
      <GalleryBrowser />
    </main>
  );
}
