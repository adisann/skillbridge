// Uji SQL migrasi career/learning di database sementara (PGlite), dijalankan dari root repo:
//   npm install --prefix .tmp-ux-checks --no-package-lock --no-save @electric-sql/pglite
//   node supabase/tests/run-career-learning.mjs
process.on('uncaughtException', e => { console.error(e.message, e.where); process.exit(1); });
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const { PGlite } = await import(pathToFileURL(resolve(process.env.PGLITE_MODULE_PATH || '.tmp-ux-checks/node_modules/@electric-sql/pglite/dist/index.js')).href);
import { readFileSync } from 'node:fs';
const db = new PGlite();
await db.exec(`create role anon; create role authenticated; create schema auth;
create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
let base = readFileSync('supabase/migrations/20261103000000_init_skillbridge_schema.sql','utf8');
// Vector search is unrelated to these tests; PGlite uses text for the unused embedding.
base = base.replace(/create extension[^;]+;/g,'').replace('embedding vector(768)', 'embedding text').replace(/create index[^;]+using hnsw[^;]+;/g,'');
await db.exec(base);
await db.exec(`alter table resumes add column gpa numeric;
grant usage on schema public, auth to authenticated, anon;
grant all on all tables in schema public to authenticated;
grant execute on all functions in schema auth to authenticated;
insert into auth.users(id,email) values ('00000000-0000-0000-0000-000000000001','ux-one@example.test'),('00000000-0000-0000-0000-000000000002','ux-two@example.test');
insert into learning_items(user_id,skill_name,priority,is_done,reason,resource_suggestion) values
('00000000-0000-0000-0000-000000000001','Teamwork','Menengah',true,'old reason','old resource'),
('00000000-0000-0000-0000-000000000001','  TEAMWORK  ','Dasar',false,'second reason','second resource');
update learning_items set created_at = case when skill_name='Teamwork' then '2026-11-01'::timestamptz else '2026-11-02'::timestamptz end;
insert into jobs(id,source_name,external_id,source_url,title,canonical_title,company,location,description,content_hash,retrieval_method) values('00000000-0000-0000-0000-000000000003','seed','qa','https://example.test/job','QA fixture','QA','QA','Jakarta','Local test only','qa','seed');
insert into saved_jobs(user_id,job_id) values('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003');
insert into skills(name,category) values('PostgreSQL','Data'),('SQL','Data');
insert into skill_aliases(alias,skill_id) select 'postgres',id from skills where name='PostgreSQL';`);
await db.exec(readFileSync('supabase/migrations/20261108000000_career_learning_ux.sql','utf8'));
await db.exec(readFileSync('supabase/tests/career_learning_ux.sql','utf8'));
await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);`);
const results = await Promise.all(Array.from({ length: 20 }, () => db.query(`select (public.add_learning_item('Concurrent skill','','Tinggi','')).id`)));
if (new Set(results.map(r => r.rows[0].id)).size !== 1) throw new Error('Parallel calls created different items');
console.log('PASS: migration, legacy preservation, idempotence, aliases, CV context, durations, rollback, RLS');
await db.close();
