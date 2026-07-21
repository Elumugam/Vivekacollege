"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { apiJson, fetchPublicJson } from "@/lib/api";
import { Field, inp, ta, SaveBtn, UploadBtn, MediaPreview, SectionHeader } from "./CmsHelpers";

export default function PageSections({ token }: { token: string | null }) {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [previewId, setPreviewId] = useState<string | number | null>(null);

  const isHomeAboutUniversity = (section: any) =>
    String(section.page_name || '').toLowerCase() === 'home page' &&
    String(section.section_name || '').toLowerCase() === 'about the university';

  const normalizeAboutUniversityContent = (content: any) => ({
    smallHeading: String(content?.smallHeading || content?.small_heading || 'ABOUT THE UNIVERSITY'),
    mainHeading: String(content?.mainHeading || content?.main_heading || 'Viveka College — Flexible, Recognized, Career-Focused'),
    description: String(content?.description || ''),
    additionalDescription: String(content?.additionalDescription || content?.additional_description || ''),
    buttonText: String(content?.buttonText || content?.button_text || 'Learn More About Us'),
    buttonLink: String(content?.buttonLink || content?.button_link || '/about'),
    // Media management defaults
    mediaType: String(content?.mediaType || content?.media_type || 'image'),
    mediaUrl: String(content?.mediaUrl || content?.media_url || ''),
    mediaSettings: content?.mediaSettings || content?.media_settings || {},
    // Quote card defaults
    quoteEnabled: content?.quoteEnabled ?? (content?.quote_enabled ?? true),
    quoteText: String(content?.quoteText || content?.quote_text || 'Distance learning that builds careers and community futures'),
    quoteAuthor: String(content?.quoteAuthor || content?.quote_author || '— Viveka College'),
    quoteBgColor: String(content?.quoteBgColor || content?.quote_bg_color || ''),
    quoteTextColor: String(content?.quoteTextColor || content?.quote_text_color || ''),
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await apiJson<any[]>('/page-sections', { headers: { Authorization: `Bearer ${token}` } });
        setSections(Array.isArray(rows) ? rows.map((row) => ({
          ...row,
          contentText: typeof row.content === 'string' ? row.content : JSON.stringify(row.content || {}, null, 2),
          content: row.content,
          aboutContent: isHomeAboutUniversity(row) ? normalizeAboutUniversityContent(row.content) : undefined,
        })) : []);
      } catch (err) {
        setSections([]);
        setError(err instanceof Error ? err.message : 'Failed to load page sections');
      } finally { setLoading(false); }
    };
    if (token) void load();
    else {
      setLoading(false);
      setError('Admin token required');
    }
  }, [token]);

  const saveSection = async (section: any) => {
    if (!token) return toast.error('Admin token required');
    try {
      const aboutUniversity = isHomeAboutUniversity(section) ? normalizeAboutUniversityContent(section.aboutContent || section.content || {}) : null;
      // Try parse contentText as JSON before sending
      let contentToSend: any = section.contentText;
      if (typeof section.contentText === 'string') {
        try { contentToSend = JSON.parse(section.contentText); } catch (e) { contentToSend = section.contentText; }
      }
      if (aboutUniversity) contentToSend = aboutUniversity;
      const isNew = !section.id || String(section.id).startsWith('new-');
      const url = isNew ? '/page-sections' : `/page-sections/${encodeURIComponent(section.id)}`;
      const method = isNew ? 'POST' : 'PUT';
      const next: any = await apiJson(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_name: section.page_name,
          section_name: section.section_name,
          title: section.title,
          content: contentToSend,
          image_url: aboutUniversity ? (aboutUniversity.mediaUrl || section.image_url) : section.image_url,
          previous_data: section.previous_data,
        })
      });

      if (aboutUniversity) {
        const homeResponse = await fetchPublicJson<{ content?: any; updated_at?: string | null }>('/content/home').catch(() => ({} as any));
        const homeContent = homeResponse?.content || {};
        await apiJson('/content/home', {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: {
              ...homeContent,
              title: aboutUniversity.smallHeading,
              subtitle: aboutUniversity.mainHeading,
              description: aboutUniversity.description,
              additionalDescription: aboutUniversity.additionalDescription,
              cta1Text: aboutUniversity.buttonText,
              cta1Url: aboutUniversity.buttonLink,
              mediaUrl: (aboutUniversity.mediaUrl ?? aboutUniversity.media_url) || homeContent.mediaUrl || '',
              mediaType: aboutUniversity.mediaType || homeContent.mediaType || '',
              mediaSettings: aboutUniversity.mediaSettings || homeContent.mediaSettings || {},
              quoteEnabled: aboutUniversity.quoteEnabled ?? homeContent.quoteEnabled ?? true,
              quoteText: aboutUniversity.quoteText || homeContent.quoteText || '',
              quoteAuthor: aboutUniversity.quoteAuthor || homeContent.quoteAuthor || '',
              quoteBgColor: aboutUniversity.quoteBgColor || homeContent.quoteBgColor || '',
              quoteTextColor: aboutUniversity.quoteTextColor || homeContent.quoteTextColor || '',
            },
          }),
        });
      }

      toast.success('Saved');
      try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem('home_content_update', JSON.stringify({ ts: Date.now() })); } catch (e) { }
      setSections((current) => current.map((item) => item.id === section.id ? { ...item, ...next, id: next.id, contentText: typeof next.content === 'string' ? next.content : JSON.stringify(next.content || {}, null, 2) } : item));
      setEditingId(null);
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    }
  };

  const normalized = useMemo(() => sections.map((section) => ({
    ...section,
    contentText: typeof section.content === 'string' ? section.content : JSON.stringify(section.content || {}, null, 2),
  })), [sections]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <SectionHeader title="Page Sections" subtitle="Manage page-level editable sections from Supabase." />
        <div>
          <button onClick={() => {
            const newId = `new-${Date.now()}`;
            const newSection = { id: newId, page_name: '', section_name: '', title: '', contentText: '', image_url: '', previous_data: null };
            setSections((cur) => [newSection, ...(cur || [])]);
            setEditingId(newId);
            setPreviewId(null);
          }} className="rounded-sm bg-[#9a0827] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">Add New Section</button>
        </div>
      </div>
      {loading && <p className="text-sm text-gray-500">Loading page sections…</p>}
      {error && <p className="mb-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {!loading && !error && normalized.length === 0 && <p className="text-sm text-gray-500">No page sections found.</p>}
      <div className="space-y-4">
        {normalized.map((section) => {
          const isEditing = editingId === section.id;
          const isPreviewing = previewId === section.id;
          const previousData = section.previous_data || null;
          const aboutUniversity = isHomeAboutUniversity(section) ? normalizeAboutUniversityContent(section.aboutContent || section.content || section) : null;
          return (
            <div key={section.id} className="rounded-sm border border-cream-dark bg-white p-4">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#9a0827]">{section.page_name}</p>
                  <h3 className="mt-1 font-serif text-xl font-bold text-navy">{section.section_name || section.title}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => { setEditingId(section.id); setPreviewId(null); }} className="rounded-sm border border-cream-dark px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 hover:bg-cream">Edit</button>
                  <button onClick={() => setPreviewId((current) => current === section.id ? null : section.id)} className="rounded-sm border border-cream-dark px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 hover:bg-cream">Preview</button>
                  <button onClick={() => saveSection(section)} className="rounded-sm bg-[#9a0827] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">{section.id ? 'Update' : 'Save'}</button>
                  {previousData && (
                    <button onClick={async () => {
                      if (!token) return toast.error('Admin token required');
                      try {
                        const reverted: any = await apiJson(`/page-sections/${encodeURIComponent(section.id)}/revert`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                        setSections((current) => current.map((item) => item.id === section.id ? { ...item, ...reverted } : item));
                        toast.success('Reverted');
                      } catch (err: any) {
                        toast.error(err.message || 'Revert failed');
                      }
                    }} className="rounded-sm border border-cream-dark px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 hover:bg-cream">Revert to Original</button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  {aboutUniversity ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field name="Small heading"><input value={aboutUniversity.smallHeading} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, aboutContent: { ...(item.aboutContent || {}), smallHeading: event.target.value } } : item))} className={inp} /></Field>
                        <Field name="Main heading"><input value={aboutUniversity.mainHeading} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, aboutContent: { ...(item.aboutContent || {}), mainHeading: event.target.value } } : item))} className={inp} /></Field>
                      </div>
                      <Field name="Description"><textarea value={aboutUniversity.description} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, aboutContent: { ...(item.aboutContent || {}), description: event.target.value } } : item))} className={ta} rows={5} /></Field>
                      <Field name="Additional description"><textarea value={aboutUniversity.additionalDescription} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, aboutContent: { ...(item.aboutContent || {}), additionalDescription: event.target.value } } : item))} className={ta} rows={5} /></Field>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field name="Button text"><input value={aboutUniversity.buttonText} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, aboutContent: { ...(item.aboutContent || {}), buttonText: event.target.value } } : item))} className={inp} /></Field>
                        <Field name="Button link"><input value={aboutUniversity.buttonLink} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, aboutContent: { ...(item.aboutContent || {}), buttonLink: event.target.value } } : item))} className={inp} /></Field>
                      </div>
                      {/* Media Management */}
                      <div className="mt-2">
                        <Field name="Media Management">
                          <div className="space-y-3">
                            <div className="grid gap-4 md:grid-cols-2">
                              <label className="block">
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Media Type</p>
                                <select value={aboutUniversity.mediaType} onChange={(e) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, aboutContent: { ...(item.aboutContent || {}), mediaType: e.target.value } } : item))} className={inp}>
                                  <option value="image">Image</option>
                                  <option value="video">Video</option>
                                </select>
                              </label>
                              <div />
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                              {token && <UploadBtn label={aboutUniversity.mediaUrl ? `Replace ${aboutUniversity.mediaType}` : `Upload ${aboutUniversity.mediaType}`} bucket="cms-media" token={token} accept={aboutUniversity.mediaType === 'video' ? 'video/*' : 'image/*'} page="home" section="about-the-university" onUrl={(url) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, aboutContent: { ...(item.aboutContent || {}), mediaUrl: url } } : item))} />}
                              {aboutUniversity.mediaUrl && token && (
                                <button onClick={async () => {
                                  if (!confirm('Remove this media?')) return;
                                  try {
                                    await apiJson(`/upload?bucket=cms-media&url=${encodeURIComponent(aboutUniversity.mediaUrl)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                                    setSections((current) => current.map((item) => item.id === section.id ? { ...item, aboutContent: { ...(item.aboutContent || {}), mediaUrl: '' } } : item));
                                    toast.success('Media removed');
                                  } catch (err: any) { toast.error(err.message || 'Remove failed'); }
                                }} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a0827]">Remove</button>
                              )}
                            </div>

                            {aboutUniversity.mediaUrl && <MediaPreview url={aboutUniversity.mediaUrl} type={aboutUniversity.mediaType} />}

                            {/* Video settings */}
                            {aboutUniversity.mediaType === 'video' && (
                              <div className="grid gap-4 md:grid-cols-2">
                                <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(aboutUniversity.mediaSettings?.autoplay)} onChange={(e) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, aboutContent: { ...(item.aboutContent || {}), mediaSettings: { ...(item.aboutContent?.mediaSettings || {}), autoplay: e.target.checked } } } : item))} /> Auto play</label>
                                <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(aboutUniversity.mediaSettings?.loop)} onChange={(e) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, aboutContent: { ...(item.aboutContent || {}), mediaSettings: { ...(item.aboutContent?.mediaSettings || {}), loop: e.target.checked } } } : item))} /> Loop</label>
                                <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(aboutUniversity.mediaSettings?.muted)} onChange={(e) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, aboutContent: { ...(item.aboutContent || {}), mediaSettings: { ...(item.aboutContent?.mediaSettings || {}), muted: e.target.checked } } } : item))} /> Mute</label>
                                <label className="block">
                                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Object fit</p>
                                  <select value={aboutUniversity.mediaSettings?.objectFit || 'cover'} onChange={(e) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, aboutContent: { ...(item.aboutContent || {}), mediaSettings: { ...(item.aboutContent?.mediaSettings || {}), objectFit: e.target.value } } } : item))} className={inp}>
                                    <option value="cover">Cover</option>
                                    <option value="contain">Contain</option>
                                  </select>
                                </label>
                              </div>
                            )}

                            {/* Image size settings */}
                            {aboutUniversity.mediaType === 'image' && (
                              <div className="grid gap-4 md:grid-cols-3">
                                <Field name="Desktop width"><input value={aboutUniversity.mediaSettings?.desktopWidth || ''} onChange={(e) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, aboutContent: { ...(item.aboutContent || {}), mediaSettings: { ...(item.aboutContent?.mediaSettings || {}), desktopWidth: e.target.value } } } : item))} className={inp} /></Field>
                                <Field name="Desktop height"><input value={aboutUniversity.mediaSettings?.desktopHeight || ''} onChange={(e) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, aboutContent: { ...(item.aboutContent || {}), mediaSettings: { ...(item.aboutContent?.mediaSettings || {}), desktopHeight: e.target.value } } } : item))} className={inp} /></Field>
                                <Field name="Tablet width"><input value={aboutUniversity.mediaSettings?.tabletWidth || ''} onChange={(e) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, aboutContent: { ...(item.aboutContent || {}), mediaSettings: { ...(item.aboutContent?.mediaSettings || {}), tabletWidth: e.target.value } } } : item))} className={inp} /></Field>
                                <Field name="Tablet height"><input value={aboutUniversity.mediaSettings?.tabletHeight || ''} onChange={(e) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, aboutContent: { ...(item.aboutContent || {}), mediaSettings: { ...(item.aboutContent?.mediaSettings || {}), tabletHeight: e.target.value } } } : item))} className={inp} /></Field>
                                <Field name="Mobile width"><input value={aboutUniversity.mediaSettings?.mobileWidth || ''} onChange={(e) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, aboutContent: { ...(item.aboutContent || {}), mediaSettings: { ...(item.aboutContent?.mediaSettings || {}), mobileWidth: e.target.value } } } : item))} className={inp} /></Field>
                                <Field name="Mobile height"><input value={aboutUniversity.mediaSettings?.mobileHeight || ''} onChange={(e) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, aboutContent: { ...(item.aboutContent || {}), mediaSettings: { ...(item.aboutContent?.mediaSettings || {}), mobileHeight: e.target.value } } } : item))} className={inp} /></Field>
                              </div>
                            )}
                          </div>
                        </Field>
                      </div>

                      {/* Quote Card */}
                      <div className="mt-2">
                        <Field name="Quote Card">
                          <div className="grid gap-4 md:grid-cols-2">
                            <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(aboutUniversity.quoteEnabled)} onChange={(e) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, aboutContent: { ...(item.aboutContent || {}), quoteEnabled: e.target.checked } } : item))} /> Enable quote card</label>
                            <div />
                          </div>
                          <Field name="Quote text"><textarea value={aboutUniversity.quoteText} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, aboutContent: { ...(item.aboutContent || {}), quoteText: event.target.value } } : item))} className={ta} rows={3} /></Field>
                          <Field name="Quote author/source"><input value={aboutUniversity.quoteAuthor} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, aboutContent: { ...(item.aboutContent || {}), quoteAuthor: event.target.value } } : item))} className={inp} /></Field>
                          <div className="grid gap-4 md:grid-cols-2">
                            <Field name="Background color"><input value={aboutUniversity.quoteBgColor} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, aboutContent: { ...(item.aboutContent || {}), quoteBgColor: event.target.value } } : item))} className={inp} /></Field>
                            <Field name="Text color"><input value={aboutUniversity.quoteTextColor} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, aboutContent: { ...(item.aboutContent || {}), quoteTextColor: event.target.value } } : item))} className={inp} /></Field>
                          </div>
                        </Field>
                      </div>
                    </div>
                  ) : null}
                  <div className="grid gap-4 md:grid-cols-2">
                    {String(section.id).startsWith('new-') && (
                      <Field name="Section Type">
                        <select value={section.section_type || "text"} onChange={(e) => {
                          const t = e.target.value;
                          setSections((current) => current.map((item) => {
                            if (item.id !== section.id) return item;
                            let contentText: any = '';
                            let title = item.title || '';
                            if (t === 'text') { contentText = ''; if (!title) title = 'Text Section'; }
                            else if (t === 'image') { contentText = JSON.stringify({ image_url: '', caption: '' }, null, 2); if (!title) title = 'Image Section'; }
                            else if (t === 'video') { contentText = JSON.stringify({ video_url: '', caption: '' }, null, 2); if (!title) title = 'Video Section'; }
                            else if (t === 'cta') { contentText = JSON.stringify({ text: '', buttonText: '', buttonUrl: '' }, null, 2); if (!title) title = 'Call To Action'; }
                            else if (t === 'gallery') { contentText = JSON.stringify({ items: [] }, null, 2); if (!title) title = 'Gallery'; }
                            else if (t === 'statistics') { contentText = JSON.stringify({ stats: [] }, null, 2); if (!title) title = 'Statistics'; }
                            else { contentText = ''; if (!title) title = 'Section'; }
                            return { ...item, section_type: t, contentText, title };
                          }));
                        }} className={inp}>
                          <option value="text">Text</option>
                          <option value="image">Image</option>
                          <option value="video">Video</option>
                          <option value="cta">CTA</option>
                          <option value="gallery">Gallery</option>
                          <option value="statistics">Statistics</option>
                          <option value="mixed">Mixed</option>
                        </select>
                      </Field>
                    )}
                    <Field name="Section title"><input value={section.title || ""} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, title: event.target.value } : item))} className={inp} /></Field>
                    <Field name="Page name"><input value={section.page_name || ""} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, page_name: event.target.value } : item))} className={inp} /></Field>
                  </div>
                  <Field name="Section content"><textarea value={section.contentText} onChange={(event) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, contentText: event.target.value } : item))} className={ta} rows={6} /></Field>
                  {!aboutUniversity && (
                    <Field name="Section image">
                    <div className="flex flex-wrap items-center gap-3">
                      {token && <UploadBtn label={section.image_url ? 'Replace Image' : 'Upload Image'} bucket="cms-media" token={token} page="home" section={aboutUniversity ? 'about-the-university' : (section.section_name || `section-${section.id}`)} onUrl={(url) => setSections((current) => current.map((item) => item.id === section.id ? { ...item, image_url: url } : item))} />}
                      {section.image_url && token && (
                        <button onClick={async () => {
                          if (!confirm('Remove this image?')) return;
                          try {
                            await apiJson(`/upload?bucket=cms-media&url=${encodeURIComponent(section.image_url)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                            setSections((current) => current.map((item) => item.id === section.id ? { ...item, image_url: '' } : item));
                            toast.success('Image removed');
                          } catch (err: any) { toast.error(err.message || 'Remove failed'); }
                        }} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a0827]">Remove Image</button>
                      )}
                    </div>
                    {section.image_url && <MediaPreview url={section.image_url} />}
                    </Field>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <SaveBtn onClick={() => saveSection({ ...section, content: section.contentText })} busy={false} text={section.id ? 'Update' : 'Save'} />
                    {previousData && <button onClick={() => setSections((current) => current.map((item) => item.id === section.id ? { ...item, title: previousData.title || '', page_name: previousData.page_name || '', image_url: previousData.image_url || '', contentText: typeof previousData.content === 'string' ? previousData.content : JSON.stringify(previousData.content || {}, null, 2) } : item))} className="rounded-sm border border-cream-dark px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 hover:bg-cream">Reset</button>}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{section.contentText}</p>
                  {section.image_url && <MediaPreview url={section.image_url} />}
                </div>
              )}

              {isPreviewing && (
                <div className="mt-4 rounded-sm border border-cream-dark bg-cream/40 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#9a0827]">Preview</p>
                  <p className="mt-2 text-sm whitespace-pre-wrap text-slate-600">{section.contentText}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
