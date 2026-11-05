-- Perbaikan data: parser lama mengira "bi" di dalam kata (mis. "Bioskop") sebagai BI Analyst.
-- Hanya menyentuh lowongan Glints yang canonical_title-nya BI Analyst tanpa kata "BI"/"Business Intelligence" di judul.
update public.jobs
set canonical_title = title,
    updated_at = now()
where source_name = 'glints'
  and canonical_title = 'BI Analyst'
  and title !~* '(\ybi\y|business intelligence)';
