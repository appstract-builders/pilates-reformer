-- Registro de la alumna, independiente de la asistencia del coach.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "taken_at" timestamp (3);
COMMIT;
