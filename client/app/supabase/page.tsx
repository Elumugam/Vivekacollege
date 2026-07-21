import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  let courses: any[] | null = null;
  let error: any = null;
  try {
    const response = await supabase.from('courses').select('id,title,category').limit(5);
    courses = response.data;
    error = response.error;
  } catch (err) {
    error = err;
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-20">
      <div className="container mx-auto max-w-3xl rounded-sm border border-cream-dark bg-white p-8 shadow-xl">
        <p className="text-maroon uppercase tracking-[0.25em] text-[11px] font-bold mb-3">Supabase Status</p>
        <h1 className="font-serif text-4xl font-bold text-navy mb-4">Connected data preview</h1>
        {error ? (
          <p className="text-gray-text">Supabase is configured, but the courses table is not available yet.</p>
        ) : (
          <ul className="space-y-3 text-gray-text">
            {courses?.map((course) => (
              <li key={course.id} className="flex items-center justify-between border-b border-cream-dark pb-3 last:border-b-0 last:pb-0">
                <span>{course.title}</span>
                <span className="text-sm uppercase tracking-[0.2em] text-maroon">{course.category}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
