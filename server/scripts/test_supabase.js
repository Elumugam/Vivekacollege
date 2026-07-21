require('dotenv').config();
const { getSupabaseAdminClient } = require('../src/lib/supabase');

(async () => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      console.error('No supabase client (missing env).');
      process.exit(2);
    }

    const resp = await supabase.from('website_content').select('*').limit(1);
    console.log('Response:', JSON.stringify(resp, null, 2));
  } catch (err) {
    console.error('Error:', err && err.toString ? err.toString() : err);
    console.error('Full error object:', err);
    process.exit(1);
  }
})();
