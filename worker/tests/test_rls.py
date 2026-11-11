from pathlib import Path


def test_migration_files_exist_and_contain_required_rls():
    migration_file = Path("supabase/migrations/20261103000000_init_skillbridge_schema.sql")
    assert migration_file.exists(), "File migrasi skema database utama harus ada"

    content = migration_file.read_text(encoding="utf-8")

    # 1. Pastikan ekstensi vector diaktifkan
    assert 'create extension if not exists "vector";' in content

    # 2. Pastikan tabel inti skema SkillBridge tersedia
    required_tables = [
        "profiles",
        "resumes",
        "skills",
        "skill_aliases",
        "resume_skills",
        "job_sources",
        "jobs",
        "job_skills",
        "matches",
        "saved_jobs",
        "learning_items",
        "worker_runs",
    ]
    for table in required_tables:
        assert f"create table if not exists public.{table}" in content, f"Tabel {table} harus ada di migrasi"
        assert f"alter table public.{table} enable row level security;" in content, f"RLS harus aktif di {table}"

    # 3. Pastikan HNSW index dibuat pada embedding
    assert "using hnsw (embedding vector_cosine_ops)" in content

    # 4. Pastikan fungsi admin dan subquery caching RLS terpasang
    assert "create or replace function public.is_admin()" in content
    assert "(select auth.uid())" in content


def test_skills_taxonomy_seed():
    seed_file = Path("supabase/migrations/20261103000001_seed_skills_taxonomy.sql")
    assert seed_file.exists(), "File seed taksonomi skill harus ada"

    content = seed_file.read_text(encoding="utf-8")
    assert "SQL" in content
    assert "PostgreSQL" in content
    assert "Python" in content
    assert "Power BI" in content
    assert "Tableau" in content
    assert "Microsoft Excel" in content
    assert "A/B Testing" in content


def test_rls_sql_test_file():
    rls_test_file = Path("supabase/tests/rls_test.sql")
    assert rls_test_file.exists(), "File rls_test.sql harus ada"

    content = rls_test_file.read_text(encoding="utf-8")
    assert "User cannot read another user profile" in content
    assert "Non-admin cannot view worker_runs audit log" in content
    assert "Admin can view all profiles and worker runs" in content

