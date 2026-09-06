-- Existing settings and all canonical commercial/media records must survive the
-- additive 0029 migration byte-for-byte. This marker makes preservation explicit.
INSERT INTO "SiteSetting" ("key", "value")
VALUES ('0029-preservation-fixture', '{"preserved":true,"authority":"pre-0029"}'::jsonb);
