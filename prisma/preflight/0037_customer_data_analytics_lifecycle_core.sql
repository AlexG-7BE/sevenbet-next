-- Read-only migration 0037 preflight. Aggregate output only; no email value is
-- selected or printed.
WITH normalized AS (
  SELECT lower(btrim("email")) AS normalized_email, COUNT(*)::bigint AS row_count
  FROM "User"
  GROUP BY lower(btrim("email"))
), duplicates AS (
  SELECT row_count FROM normalized WHERE row_count > 1
)
SELECT
  (SELECT COUNT(*)::bigint FROM "User") AS "canonicalUsers",
  (SELECT COUNT(*)::bigint FROM duplicates) AS "duplicateNormalizedEmailGroups",
  (SELECT COALESCE(SUM(row_count), 0)::bigint FROM duplicates) AS "duplicateNormalizedEmailRows",
  (SELECT COUNT(*)::bigint FROM "User" WHERE "email" <> lower(btrim("email"))) AS "emailsRequiringNormalization";
