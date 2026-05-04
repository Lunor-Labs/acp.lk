-- RPC: get_student_monthly_scores
-- Returns per-student, per-month score aggregates for a given class and year.
-- Runs entirely in Postgres so the 1000-row PostgREST limit never applies.

CREATE OR REPLACE FUNCTION get_student_monthly_scores(
  p_class_id  UUID,
  p_year      INT
)
RETURNS TABLE (
  student_id        TEXT,
  student_name      TEXT,
  display_student_id TEXT,
  month_key         TEXT,
  monthly_score     NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    p.id                              AS student_id,
    p.full_name                       AS student_name,
    p.student_id                      AS display_student_id,
    TO_CHAR(e.end_time, 'YYYY-MM')    AS month_key,
    SUM(ea.score)                     AS monthly_score
  FROM exam_attempts ea
  JOIN exams    e ON ea.exam_id    = e.id
  JOIN profiles p ON ea.student_id = p.id
  WHERE
    e.class_id  = p_class_id
    AND e.end_time >= DATE_TRUNC('year', TO_DATE(p_year::TEXT, 'YYYY'))
    AND e.end_time <  DATE_TRUNC('year', TO_DATE(p_year::TEXT, 'YYYY')) + INTERVAL '1 year'
    AND e.end_time <  NOW()
    AND ea.status = 'submitted'
  GROUP BY
    p.id,
    p.full_name,
    p.student_id,
    TO_CHAR(e.end_time, 'YYYY-MM')
  ORDER BY
    month_key,
    monthly_score DESC;
$$;
