import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testAllJobUrls() {
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, title, company, source_name, source_url')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Checking ${jobs.length} jobs...`);
  const broken = [];
  const working = [];

  for (const j of jobs) {
    try {
      const res = await fetch(j.source_url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        redirect: 'follow',
        signal: AbortSignal.timeout(6000)
      });
      if (res.status >= 200 && res.status < 400) {
        working.push({ id: j.id, title: j.title, company: j.company, status: res.status });
      } else {
        broken.push({ id: j.id, title: j.title, company: j.company, url: j.source_url, status: res.status });
      }
    } catch (err) {
      broken.push({ id: j.id, title: j.title, company: j.company, url: j.source_url, error: err.message });
    }
  }

  console.log(`\nWorking URLs: ${working.length}`);
  console.log(`Broken URLs: ${broken.length}`);
  console.log('\n--- BROKEN LIST ---');
  for (const b of broken) {
    console.log(`[${b.status || 'ERR'}] ${b.company} - ${b.title}`);
    console.log(`      URL: ${b.url}`);
    if (b.error) console.log(`      Error: ${b.error}`);
  }
}

testAllJobUrls();

