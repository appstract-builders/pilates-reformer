-- Registro de la alumna, independiente de la asistencia del coach.
ALTER TABLE "booking" ADD COLUMN IF NOT EXISTS "taken_at" timestamp (3);
