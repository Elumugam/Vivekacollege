export type MediaSectionOption = {
  value: string;
  label: string;
};

export type MediaSectionGroup = {
  pageName: string;
  pageLabel: string;
  sections: MediaSectionOption[];
};

export type MediaAsset = {
  id?: string | number;
  name?: string;
  url?: string;
  bucket?: string;
  path?: string;
  created_at?: string | null;
  media_type?: string;
  page_name?: string;
  section_name?: string;
  meta?: Record<string, any>;
};

export const MEDIA_SECTION_GROUPS: MediaSectionGroup[] = [
  {
    pageName: "home",
    pageLabel: "HOME PAGE",
    sections: [
      { value: "hero", label: "Hero Section (Education, Skill & Social Empowerment area)" },
      { value: "education-skill-social-empowerment-image", label: "Education, Skill & Social Empowerment Image" },
      { value: "about-the-university", label: "About the University" },
    ],
  },
  {
    pageName: "about",
    pageLabel: "ABOUT PAGE",
    sections: [
      { value: "about-banner", label: "About Banner" },
      { value: "history", label: "History" },
      { value: "chairman-principal-message", label: "Chairman / Principal Message" },
      { value: "faculty-highlights", label: "Faculty Highlights" },
    ],
  },
];

export const parseMediaSectionValue = (value: string) => {
  const [pageName = "", sectionName = ""] = String(value || "").split("|");
  return { pageName, sectionName };
};

export const buildMediaSectionValue = (pageName: string, sectionName: string) => `${pageName}|${sectionName}`;

export const getMediaPageLabel = (pageName?: string) => {
  const group = MEDIA_SECTION_GROUPS.find((item) => item.pageName === pageName);
  return group?.pageLabel || String(pageName || "").toUpperCase();
};

export const getMediaSectionLabel = (pageName?: string, sectionName?: string) => {
  const group = MEDIA_SECTION_GROUPS.find((item) => item.pageName === pageName);
  const section = group?.sections.find((item) => item.value === sectionName);
  return section?.label || sectionName || "Unassigned";
};

export const getMediaType = (asset?: Partial<MediaAsset> | null) => {
  const type = String(asset?.media_type || asset?.meta?.media_type || "").toLowerCase();
  if (type === "video" || type === "image") return type;
  const source = String(asset?.url || asset?.path || asset?.name || "").toLowerCase();
  return /\.(mp4|webm|mov)(\?|$)/.test(source) ? "video" : "image";
};

export const normalizeMediaAsset = (asset: MediaAsset): Required<Pick<MediaAsset, "id" | "name" | "url" | "bucket" | "path" | "created_at" | "page_name" | "section_name" | "media_type">> & { meta: Record<string, any> } => {
  const meta = asset.meta && typeof asset.meta === "object" ? asset.meta : {};
  const pageName = String(asset.page_name || meta.page_name || "").toLowerCase();
  const sectionName = String(asset.section_name || meta.section_name || "").toLowerCase();

  return {
    id: asset.id ?? "",
    name: asset.name || "",
    url: asset.url || "",
    bucket: asset.bucket || "",
    path: asset.path || "",
    created_at: asset.created_at || null,
    page_name: pageName,
    section_name: sectionName,
    media_type: getMediaType(asset),
    meta,
  };
};

export const findAssignedMedia = <T extends MediaAsset>(items: T[] | null | undefined, pageName: string, sectionName: string) => {
  const list = Array.isArray(items) ? items : [];
  return list
    .map((item) => normalizeMediaAsset(item))
    .filter((item) => item.page_name === pageName && item.section_name === sectionName)
    .sort((left, right) => new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime())[0] || null;
};
