-- Rate limiting lintas instance (Vercel serverless) berbasis counter jendela tetap.
-- Hanya service_role yang boleh memanggil fungsi ini; tabel tidak terbuka untuk klien.
CREATE TABLE IF NOT EXISTS public.rate_limits (
    key          text PRIMARY KEY,
    count        integer NOT NULL DEFAULT 0,
    window_start timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.rate_limit_hit(p_key text, p_limit integer, p_window_seconds integer)
RETURNS TABLE (allowed boolean, retry_after integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count integer;
    v_start timestamptz;
BEGIN
    INSERT INTO public.rate_limits AS rl (key, count, window_start)
    VALUES (p_key, 1, now())
    ON CONFLICT (key) DO UPDATE SET
        count = CASE
            WHEN rl.window_start <= now() - make_interval(secs => p_window_seconds) THEN 1
            ELSE rl.count + 1
        END,
        window_start = CASE
            WHEN rl.window_start <= now() - make_interval(secs => p_window_seconds) THEN now()
            ELSE rl.window_start
        END
    RETURNING rl.count, rl.window_start INTO v_count, v_start;

    -- Bersihkan baris lama sesekali agar tabel tidak membengkak
    IF random() < 0.01 THEN
        DELETE FROM public.rate_limits WHERE window_start < now() - interval '2 days';
    END IF;

    allowed := v_count <= p_limit;
    retry_after := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_start + make_interval(secs => p_window_seconds) - now())))::integer);
    RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.rate_limit_hit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_hit(text, integer, integer) TO service_role;
