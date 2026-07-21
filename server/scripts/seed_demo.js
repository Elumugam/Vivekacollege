/* Demo seeding script for local development
 * Usage:
 * 1. Ensure server/.env contains SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (service key)
 * 2. From repo root: cd server && npm run seed:demo
 *
 * This script will attempt to upsert a demo admin, homepage content, one course, and one gallery item.
 */

const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: './.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server/.env. Aborting.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const run = async () => {
  try {
    console.log('Seeding demo data to Supabase...');

    // Demo admin
    const demoEmail = 'admin@local';
    const demoPassword = 'password123';
    const passwordHash = await bcrypt.hash(demoPassword, 10);

    try {
      const { data: adminData, error: adminErr } = await supabase
        .from('admins')
        .upsert({ email: demoEmail, name: 'Local Admin', role: 'admin', password: passwordHash }, { onConflict: 'email' })
        .select('*')
        .maybeSingle();
      if (adminErr) {
        console.warn('Could not upsert admin:', adminErr.message || adminErr);
      } else {
        console.log('Admin seeded:', adminData?.email || demoEmail);
      }
    } catch (err) {
      console.warn('admins table may not exist or other error:', err?.message || err);
    }

    // Homepage content
    try {
      const homepagePayload = { key: 'hero', content: JSON.stringify({ title: 'Welcome to Viveka College', subtitle: 'Learn. Grow. Succeed.' }) };
      const { data: homeData, error: homeErr } = await supabase.from('homepage_content').upsert(homepagePayload, { onConflict: 'key' }).select('*').maybeSingle();
      if (homeErr) console.warn('Could not upsert homepage_content:', homeErr.message || homeErr);
      else console.log('Homepage content seeded');
    } catch (err) {
      console.warn('homepage_content table may not exist or other error:', err?.message || err);
    }

    // Courses
    try {
      const course = {
        title: 'BSc Computer Science',
        slug: 'bsc-computer-science',
        category: 'Undergraduate',
        description: 'A foundational program in computer science.',
        seats: 60,
        highlights: 'Programming,Algorithms,Data Structures',
      };
      const { data: courseData, error: courseErr } = await supabase.from('courses').upsert(course, { onConflict: 'slug' }).select('*').maybeSingle();
      if (courseErr) console.warn('Could not upsert course:', courseErr.message || courseErr);
      else console.log('Course seeded');
    } catch (err) {
      console.warn('courses table may not exist or other error:', err?.message || err);
    }

    // Gallery
    try {
      const item = {
        title: 'Campus View',
        description: 'A sunny view of campus',
        src: '',
        category: 'Campus',
      };
      const { data: gData, error: gErr } = await supabase.from('gallery').insert(item).select('*').maybeSingle();
      if (gErr) console.warn('Could not insert gallery item:', gErr.message || gErr);
      else console.log('Gallery item seeded');
    } catch (err) {
      console.warn('gallery table may not exist or other error:', err?.message || err);
    }

    console.log('\nSeeding complete. Demo admin credentials:');
    console.log('  email:', demoEmail);
    console.log('  password:', demoPassword);
    console.log('\nYou can now log in via the admin UI and run /api/media/backfill if desired.');
  } catch (error) {
    console.error('Seeding failed:', error?.message || error);
    process.exit(1);
  }
};

run();
