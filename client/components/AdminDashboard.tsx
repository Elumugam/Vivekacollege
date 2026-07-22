"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Trash2, Download } from "lucide-react";
import { apiJson } from "@/lib/api";
import { courseCatalog, galleryItems } from "@/lib/site-data";
import { HomeContentTab, AboutTab } from "./cms/ContentTabs";
import { CoursesTab } from "./cms/CoursesTab";
import { GalleryTab } from "./cms/GalleryTab";
import MediaManager from "./cms/MediaManager";
import PageSections from "./cms/PageSections";
import AnnouncementBarAdmin from "./cms/AnnouncementBarAdmin";
import PopupsTab from "./cms/PopupsTab";
import HeaderManagement from "./cms/HeaderManagement";
import { exportApplicationsPdf, exportApplicationsXlsx } from "@/utils/applicationExport";

type Tab = "overview" | "home" | "header" | "about" | "courses" | "gallery" | "contacts" | "applications" | "media" | "sections" | "announcement" | "popups";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "home", label: "Home Content" },
  { key: "header", label: "Header Management" },
  { key: "popups", label: "Popups" },
  { key: "about", label: "About Page" },
  { key: "courses", label: "Courses" },
  { key: "gallery", label: "Gallery" },
  { key: "media", label: "Media Manager" },
  { key: "sections", label: "Page Sections" },
  { key: "announcement", label: "Announcement Bar" },
  { key: "contacts", label: "Contact Messages" },
  { key: "applications", label: "Applications" },
];

const empty = {
  hero: { title:"", subtitle:"", buttonText:"", button2Text:"", button2Url:"", mediaUrl:"", mediaType:"image" },
  popup: { id:null, enabled:false, title:"", message:"", ctaText:"", ctaUrl:"", imageUrl:"", videoUrl:"", mediaType:"image", displayMode:"immediate", displayDelay:0, previous_data:null },
  navbar: { title:"", ctaText:"", ctaUrl:"", announcement:"", phone:"", email:"" },
  home: { title:"", subtitle:"", description:"", announcementText:"", statStudents:"", statCourses:"", statYears:"", statPlacements:"", mediaUrl:"", mediaType:"image" },
  about: { mission:"", vision:"", principal:"", principalName:"", imageUrl:"" },
  contact: { address:"", phone:"", phone2:"", email:"", workingHours:"", mapUrl:"", facebook:"", instagram:"", youtube:"" },
};

const fallbackCourses = courseCatalog.map((course) => ({
  ...course,
  fees: course.fees || "Contact centre",
  seats: String(course.seats ?? 0),
  eligibility: course.eligibility || "",
  description: course.description || "",
  highlights: course.highlights || [],
  promoVideo: "",
  is_featured: false,
}));

const fallbackGallery = galleryItems.map((item) => ({
  ...item,
  description: "",
}));

export default function AdminDashboard() {
  const [token, setToken] = useState<string|null>(null);
  const [adminName, setAdminName] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const didSeedCourses = useRef(false);

  const [hero, setHero] = useState<any>(empty.hero);
  const [popup, setPopup] = useState<any>(empty.popup);
  const [navbar, setNavbar] = useState<any>(empty.navbar);
  const [home, setHome] = useState<any>(empty.home);
  const [about, setAbout] = useState<any>(empty.about);
  const [contactInfo, setContactInfo] = useState<any>(empty.contact);
  const [courses, setCourses] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "application" | "contact"; id: string } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const authH = useCallback((t: string) => ({ Authorization: `Bearer ${t}` }), []);

  const load = useCallback(async (t: string) => {
    const get = (p: string) => apiJson<any>(p, { headers: authH(t) }).catch(() => null);
    setApplicationsLoading(true);
    setApplicationsError(null);
    const [contentRows, crs, gal, cons, popupRow] = await Promise.all([
      get("/content"),
      get("/courses"),
      get("/gallery"),
      get("/contact"),
      get("/popup-poster/current"),
    ]);
    try {
      const apps = await apiJson<any[]>("/applications", { headers: authH(t) });
      setApplications(Array.isArray(apps) ? apps : []);
    } catch (error) {
      setApplications([]);
      setApplicationsError(error instanceof Error ? error.message : "Unable to load applications.");
    } finally {
      setApplicationsLoading(false);
    }

    const contentMap = new Map<string, any>();
    if (Array.isArray(contentRows)) {
      contentRows.forEach((row: any) => {
        if (row?.key) contentMap.set(String(row.key), row.content || {});
      });
    }

    const pickContent = (keys: string[], fallback: any) => {
      for (const key of keys) {
        if (contentMap.has(key)) return { ...fallback, ...contentMap.get(key) };
      }
      return fallback;
    };

    setHero(pickContent(["hero"], empty.hero));
    const popupContent = popupRow && typeof popupRow === 'object' ? popupRow : pickContent(["popup", "popup_poster", "popup-poster"], empty.popup);
    setPopup({
      ...empty.popup,
      ...(popupContent || {}),
      message: popupContent?.description || popupContent?.message || "",
      ctaText: popupContent?.cta_text || popupContent?.ctaText || "",
      ctaUrl: popupContent?.cta_url || popupContent?.ctaUrl || "",
      imageUrl: popupContent?.media_type === "image" ? (popupContent?.media_url || popupContent?.imageUrl || "") : (popupContent?.imageUrl || ""),
      videoUrl: popupContent?.media_type === "video" ? (popupContent?.media_url || popupContent?.videoUrl || "") : (popupContent?.videoUrl || ""),
      displayDelay: popupContent?.display_delay ?? popupContent?.displayDelay ?? 0,
      displayMode: popupContent?.display_delay === 0 ? "immediate" : [2,5,10].includes(Number(popupContent?.display_delay)) ? String(popupContent?.display_delay) : "custom",
    });
    setNavbar(pickContent(["navbar", "header"], empty.navbar));
    setHome(pickContent(["home", "homepage"], empty.home));
    setAbout(pickContent(["about"], empty.about));
    setContactInfo(pickContent(["contact_info", "contact-info", "contact"], empty.contact));

    if (Array.isArray(crs) && crs.length === 0 && !didSeedCourses.current) {
      didSeedCourses.current = true;
      try {
        await apiJson<any[]>("/courses/seed", {
          method: "POST",
          headers: { ...authH(t), "Content-Type": "application/json" },
          body: JSON.stringify({ courses: fallbackCourses }),
        });
        const seededCourses = await get("/courses");
        setCourses(Array.isArray(seededCourses) ? seededCourses : fallbackCourses);
      } catch {
        setCourses(fallbackCourses);
      }
    } else {
      setCourses(Array.isArray(crs) ? crs : fallbackCourses);
    }
    setGallery(Array.isArray(gal) ? gal : fallbackGallery);
    if (Array.isArray(cons)) setContacts(cons);
    setLoading(false);
  }, [authH]);

  useEffect(() => {
    const t = typeof window !== "undefined" ? window.localStorage.getItem("tnou-admin-token") : null;
    if (!t) { setLoading(false); return; }
    apiJson<any>("/auth/me", { headers: authH(t) })
      .then(r => { setToken(t); setAdminName(r?.admin?.name || "Admin"); load(t); })
      .catch(() => { window.localStorage.removeItem("tnou-admin-token"); setLoading(false); });
  }, [authH, load]);

  const saveContent = async (key: string, data: any) => {
    await apiJson(`/content/${key}`, {
      method: "PUT",
      headers: { ...authH(token!), "Content-Type": "application/json" },
      body: JSON.stringify({ content: data }),
    });
    if (key === "hero" && typeof window !== "undefined") {
      try {
        window.localStorage.setItem("hero_content_update", JSON.stringify({
          mediaUrl: data?.mediaUrl || "",
          mediaType: data?.mediaType || "image",
          ts: Date.now(),
        }));
      } catch (error) {
        // Ignore localStorage failures and continue.
      }
    }
    toast.success(`${key.replace(/_/g," ")} saved ✓`);
  };

  const logout = () => { window.localStorage.removeItem("tnou-admin-token"); setToken(null); };

  const promptDelete = (kind: "application" | "contact", id: string) => {
    setDeleteTarget({ kind, id });
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !token) return;

    setDeleteBusy(true);
    try {
      const endpoint = deleteTarget.kind === "application" ? `/applications/${deleteTarget.id}` : `/contact/${deleteTarget.id}`;
      await apiJson(endpoint, {
        method: "DELETE",
        headers: authH(token),
      });

      if (deleteTarget.kind === "application") {
        setApplications((current) => current.filter((item) => String(item.id) !== String(deleteTarget.id)));
        toast.success("Application deleted successfully");
      } else {
        setContacts((current) => current.filter((item) => String(item.id) !== String(deleteTarget.id)));
        toast.success("Message deleted successfully");
      }

      setDeleteTarget(null);
    } catch {
      toast.error("Unable to delete record. Please try again.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const openWebsitePreview = () => {
    window.localStorage.setItem("tnou-admin-preview", "1");
    window.open("/?adminPreview=1", "_blank", "noopener,noreferrer");
  };

  if (loading) return (
    <section className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-maroon border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500">Loading dashboard…</p>
      </div>
    </section>
  );

  if (!token) return (
    <section className="min-h-[60vh] bg-[#f6efe6] py-24 flex items-center">
      <div className="mx-auto max-w-xl rounded-sm border border-cream-dark bg-white p-10 text-center shadow-xl">
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.34em] text-[#9a0827]">Admin Access Required</p>
        <h1 className="mb-6 font-serif text-4xl font-bold text-navy">Secure Dashboard</h1>
        <Link href="/admin/login" className="inline-flex rounded-sm bg-[#9a0827] px-8 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">Go to Login</Link>
      </div>
    </section>
  );

  return (
    <section className="h-screen overflow-hidden bg-[#f6efe6] pt-28 pb-8">
      <div className="mx-auto grid h-full max-w-330 gap-6 px-4 lg:grid-cols-[228px_1fr] lg:px-6">

        {/* Sidebar */}
        <aside className="flex h-full flex-col overflow-hidden rounded-sm bg-[#072d5a] text-white shadow-2xl lg:sticky lg:top-28 lg:max-h-[calc(100vh-9rem)]">
          <div className="border-b border-white/10 p-4">
            <p className="text-[10px] uppercase tracking-[0.34em] text-white/55">ADMIN PANEL</p>
            <p className="mt-1 truncate text-lg font-bold leading-tight">{adminName}</p>
          </div>
          <nav className="flex-1 space-y-2 overflow-y-auto p-3">
            {TABS.map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)} className={`w-full rounded-sm px-4 py-3 text-left text-sm font-semibold transition-colors ${tab === key ? "bg-[#9a0827] text-white" : "bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"}`}>
                {label}
              </button>
            ))}
          </nav>
          <div className="border-t border-white/10 p-4 space-y-3">
            <button onClick={openWebsitePreview} className="w-full rounded-sm bg-white px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#072d5a] transition-colors hover:bg-cream">
              View Website
            </button>
            <button onClick={logout} className="w-full rounded-sm border border-white/10 px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70 transition-colors hover:bg-white/10 hover:text-white">Logout</button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex h-full min-h-0 flex-col rounded-sm border border-cream-dark bg-white p-4 shadow-xl md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-cream-dark pb-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#9a0827]">Website CMS</p>
              <h1 className="mt-1 font-serif text-2xl font-bold text-navy">Content, courses, gallery, and leads</h1>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={openWebsitePreview} className="rounded-sm border border-cream-dark bg-cream px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-navy hover:bg-[#f1e4d6]">
                View Website
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {tab === "overview" && (
            <div>
              <div className="grid gap-6 rounded-sm border border-cream-dark bg-white p-7 shadow-[0_14px_30px_rgba(17,24,39,0.12)] md:grid-cols-[1.1fr_0.9fr] md:p-8">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#9a0827]">Dashboard</p>
                  <h2 className="mt-2 max-w-md font-serif text-4xl font-bold leading-tight text-navy md:text-[2.7rem]">Manage the website content dynamically</h2>
                  <p className="mt-5 text-sm leading-6 text-slate-500">No live records yet. Hook this tab to the applications API to approve or reject students.</p>
                </div>
                <div className="flex items-center md:pl-4">
                  <p className="max-w-md text-sm leading-6 text-slate-500">This dashboard is wired for JWT-protected APIs and covers homepage content, about content, courses, gallery, contact leads, and applications.</p>
                </div>
              </div>
              <p className="mt-6 text-sm text-slate-500">Welcome back, {adminName}.</p>
            </div>
          )}

          {tab === "home" && (
            <HomeContentTab
              hero={hero}
              popup={popup}
              navbar={navbar}
              home={home}
              contactInfo={contactInfo}
              token={token}
              onHeroChange={setHero}
              onPopupChange={setPopup}
              onNavbarChange={setNavbar}
              onHomeChange={setHome}
              onContactInfoChange={setContactInfo}
              onSave={saveContent}
            />
          )}

          {tab === "about" && <AboutTab data={about} token={token} onChange={setAbout} onSave={saveContent} />}
          {tab === "header" && <HeaderManagement token={token} />}
          {tab === "courses" && <CoursesTab courses={courses} token={token} onRefresh={() => load(token)} />}
          {tab === "gallery" && <GalleryTab gallery={gallery} token={token} onRefresh={() => load(token)} />}
          {tab === "media" && <MediaManager token={token} />}
          {tab === "sections" && <PageSections token={token} />}
          {tab === "announcement" && <AnnouncementBarAdmin token={token} />}
          {tab === "popups" && <PopupsTab token={token!} />}

          {tab === "contacts" && (
            <div className="overflow-x-auto">
              <div className="mb-6 border-b border-cream-dark pb-4">
                <h2 className="font-serif text-2xl font-bold text-navy">Contact Messages</h2>
                <p className="mt-1 text-sm text-gray-500">{contacts.length} records</p>
              </div>
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-cream-dark bg-cream">
                    <th className="p-3 text-xs font-bold uppercase tracking-wider text-navy">Name</th>
                    <th className="p-3 text-xs font-bold uppercase tracking-wider text-navy">Email</th>
                    <th className="p-3 text-xs font-bold uppercase tracking-wider text-navy">Details</th>
                    <th className="p-3 text-xs font-bold uppercase tracking-wider text-navy">Date</th>
                    <th className="p-3 text-xs font-bold uppercase tracking-wider text-navy">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((r: any) => (
                    <tr key={r.id} className="border-b border-cream-dark">
                      <td className="p-3 font-semibold text-navy">{r.name}</td>
                      <td className="p-3 text-gray-600">{r.email}</td>
                      <td className="p-3 max-w-xs truncate text-gray-500">{r.message || r.course || r.phone}</td>
                      <td className="p-3 text-xs text-gray-400">{new Date(r.created_at || 0).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => promptDelete("contact", String(r.id))}
                          className="inline-flex items-center gap-2 rounded-sm border border-[#9a0827] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a0827] transition-colors hover:bg-[#9a0827] hover:text-white"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {contacts.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">No records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tab === "applications" && (() => {
            const allIds = applications.map((r: any) => String(r.id));
            const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
            const someSelected = allIds.some((id) => selectedIds.has(id));
            const toggleAll = () => {
              if (allSelected) setSelectedIds(new Set());
              else setSelectedIds(new Set(allIds));
            };
            const toggleOne = (id: string) => {
              setSelectedIds((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id); else next.add(id);
                return next;
              });
            };
            const selectedRows = applications.filter((r: any) => selectedIds.has(String(r.id)));
            return (
              <div className="overflow-x-auto">
                <div className="mb-6 border-b border-cream-dark pb-4">
                  <h2 className="font-serif text-2xl font-bold text-navy">Applications</h2>
                  <p className="mt-1 text-sm text-gray-500">{applications.length} records</p>
                </div>
                {applicationsLoading && <p className="mb-4 text-sm text-gray-500">Loading applications...</p>}
                {applicationsError && <p className="mb-4 text-sm text-[#9a0827]">{applicationsError}</p>}

                {/* ── Download toolbar ── */}
                {!applicationsLoading && applications.length > 0 && (
                  <div className="mb-4 flex flex-wrap items-center gap-2 rounded-sm border border-cream-dark bg-cream/50 px-4 py-3">
                    <label className="flex items-center gap-2 text-xs font-semibold text-navy mr-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                        onChange={toggleAll}
                        className="h-4 w-4"
                      />
                      Select All
                    </label>
                    <button
                      onClick={() => exportApplicationsPdf(applications, "all-applications.pdf")}
                      className="inline-flex items-center gap-1.5 rounded-sm border border-[#072d5a] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#072d5a] hover:bg-[#072d5a] hover:text-white transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" /> Download All (PDF)
                    </button>
                    <button
                      onClick={() => exportApplicationsXlsx(applications, "all-applications.xlsx")}
                      className="inline-flex items-center gap-1.5 rounded-sm border border-[#072d5a] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#072d5a] hover:bg-[#072d5a] hover:text-white transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" /> Download All (Excel)
                    </button>
                    <button
                      disabled={!someSelected}
                      onClick={() => {
                        if (!someSelected) return;
                        exportApplicationsPdf(selectedRows, `selected-applications-${Date.now()}.pdf`);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-sm bg-[#9a0827] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-40 hover:bg-[#7f061f] transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" /> Download Selected ({selectedRows.length})
                    </button>
                  </div>
                )}

                <table className="w-full text-left border-collapse text-sm">
                  <thead><tr className="bg-cream border-b border-cream-dark">
                    <th className="p-3"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4" /></th>
                    <th className="p-3 font-bold text-navy text-xs uppercase tracking-wider">Name</th>
                    <th className="p-3 font-bold text-navy text-xs uppercase tracking-wider">Email</th>
                    <th className="p-3 font-bold text-navy text-xs uppercase tracking-wider">Details</th>
                    <th className="p-3 font-bold text-navy text-xs uppercase tracking-wider">Date</th>
                    <th className="p-3 font-bold text-navy text-xs uppercase tracking-wider">Actions</th>
                  </tr></thead>
                  <tbody>
                    {!applicationsLoading && applicationsError && applications.length === 0 && (
                      <tr><td colSpan={6} className="p-8 text-center text-gray-400">Unable to load applications.</td></tr>
                    )}
                    {applications.map((r: any) => {
                      const rid = String(r.id);
                      const isOpen = openDropdownId === rid;
                      return (
                        <tr key={r.id} className={`border-b border-cream-dark hover:bg-cream/50 transition-colors ${selectedIds.has(rid) ? 'bg-blue-50/40' : ''}`}>
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(rid)}
                              onChange={() => toggleOne(rid)}
                              className="h-4 w-4"
                            />
                          </td>
                          <td className="p-3 font-semibold text-navy">{r.fullName || r.name}</td>
                          <td className="p-3 text-gray-600">{r.email}</td>
                          <td className="p-3 max-w-xs whitespace-normal text-gray-500">
                            <div className="space-y-1">
                              <p>{r.courseTitle || r.course || r.courseId}</p>
                              <p>{r.courseType ? `Course Type: ${r.courseType}` : ''}</p>
                              <p>{r.dob ? `DOB: ${r.dob}` : ''}</p>
                              <p>{r.gender ? `Gender: ${r.gender}` : ''}</p>
                              <p>{r.mobile || r.phone ? `Mobile: ${r.mobile || r.phone}` : ''}</p>
                              <p>{r.address ? `Address: ${r.address}` : ''}</p>
                              <p>{r.qualification ? `Qualification: ${r.qualification}` : ''}</p>
                              <p>{Array.isArray(r.documents) && r.documents.length ? `Documents: ${r.documents.map((document: any) => document.originalName || document.fileName || document.filePath).filter(Boolean).join(', ')}` : ''}</p>
                            </div>
                          </td>
                          <td className="p-3 text-gray-400 text-xs">{new Date(r.created_at||0).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-2">
                              {/* Delete button – unchanged */}
                              <button
                                type="button"
                                onClick={() => promptDelete("application", rid)}
                                className="inline-flex items-center gap-2 rounded-sm border border-[#9a0827] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a0827] transition-colors hover:bg-[#9a0827] hover:text-white"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                              {/* Download dropdown */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setOpenDropdownId(isOpen ? null : rid)}
                                  className="inline-flex items-center gap-2 rounded-sm border border-[#072d5a] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#072d5a] transition-colors hover:bg-[#072d5a] hover:text-white"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  Download
                                </button>
                                {isOpen && (
                                  <div className="absolute right-0 top-full z-30 mt-1 w-40 rounded-sm border border-cream-dark bg-white shadow-lg">
                                    <button
                                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-navy hover:bg-cream transition-colors"
                                      onClick={() => {
                                        exportApplicationsPdf([r], `application-${rid}.pdf`);
                                        setOpenDropdownId(null);
                                      }}
                                    >
                                      Download as PDF
                                    </button>
                                    <button
                                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-navy hover:bg-cream transition-colors"
                                      onClick={() => {
                                        exportApplicationsXlsx([r], `application-${rid}.xlsx`);
                                        setOpenDropdownId(null);
                                      }}
                                    >
                                      Download as Excel
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!applicationsLoading && applications.length === 0 && !applicationsError && (
                      <tr><td colSpan={6} className="p-8 text-center text-gray-400">No records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            );
          })()}
          </div>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-80 flex items-center justify-center bg-navy/70 px-4">
          <div className="w-full max-w-md rounded-sm border border-cream-dark bg-white p-6 shadow-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#9a0827]">Delete Record</p>
            <h2 className="mt-2 font-serif text-2xl font-bold text-navy">Delete Record</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Are you sure you want to delete this item? This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-sm border border-cream-dark px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-navy transition-colors hover:bg-cream"
                disabled={deleteBusy}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-sm bg-[#9a0827] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#7f061f] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={deleteBusy}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
