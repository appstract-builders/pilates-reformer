-- ---------------------------------------------------------------------------
-- 17 · account.issuer (better-auth >= 1.5)
--
-- better-auth dejó de identificar la cuenta por (provider_id, account_id) y
-- ahora usa (issuer, account_id). Sin esta columna fallan sign-up, sign-in y
-- reset-password: el adapter de Drizzle no encuentra el campo y genera SQL
-- inválido, que la app reporta como "El enlace ya no es válido o expiró".
--
-- Para email/contraseña el issuer es createLocalAccountIssuer("credential"),
-- es decir 'local:credential'. Para un proveedor OAuth sin issuer propio
-- sería 'local:oauth:<provider_id>'; esta app sólo usa credential.
--
-- Idempotente: se puede correr varias veces.
-- ---------------------------------------------------------------------------

BEGIN;

ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "issuer" text;

UPDATE "account"
   SET "issuer" = 'local:' || "provider_id"
 WHERE "issuer" IS NULL;

ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "account_issuer_account_id_uidx"
    ON "account" USING btree ("issuer", "account_id");

COMMIT;
