-- PostgreSQL requires an enum value to be committed before a later statement
-- can use it. This idempotent preflight keeps migration 0015 reproducible on
-- databases where MISSION_COMPLETION does not yet exist.
ALTER TYPE "XpEventType" ADD VALUE IF NOT EXISTS 'MISSION_COMPLETION';
