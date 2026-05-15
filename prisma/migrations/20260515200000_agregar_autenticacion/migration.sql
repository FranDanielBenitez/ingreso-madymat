-- Create a nullable user login column for internal application users
ALTER TABLE "usuarios_app"
ADD COLUMN IF NOT EXISTS "usuario" text UNIQUE;

-- Create a session table for authenticated application users
CREATE TABLE IF NOT EXISTS "usuario_sesiones" (
  "id" serial PRIMARY KEY,
  "usuario_id" integer NOT NULL REFERENCES "usuarios_app"("id") ON DELETE CASCADE,
  "token" text NOT NULL UNIQUE,
  "expires_at" timestamp(3) NOT NULL,
  "created_at" timestamp(3) NOT NULL DEFAULT now()
);
