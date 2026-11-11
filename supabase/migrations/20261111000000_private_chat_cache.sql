-- Generated answers can contain text supplied by a user, including contact details.
-- Shared job caching remains available through the server's service client; direct
-- anonymous/authenticated table reads must not enumerate other users' answers.
drop policy if exists "Anyone can read job knowledge cache" on public.ai_chat_cache;

-- CV analysis keeps its existing owner-only SELECT policy. Writes remain server-only
-- as configured by 20261106000002_security_hardening.sql.
