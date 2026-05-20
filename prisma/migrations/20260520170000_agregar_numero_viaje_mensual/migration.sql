-- Add monthly viaje numbering to ingresos
ALTER TABLE "ingresos"
  ADD COLUMN IF NOT EXISTS "numero_viaje" integer,
  ADD COLUMN IF NOT EXISTS "periodo_viaje" text;

CREATE UNIQUE INDEX IF NOT EXISTS "ingresos_tipo_ingreso_id_periodo_viaje_numero_viaje_key"
  ON "ingresos" ("tipo_ingreso_id", "periodo_viaje", "numero_viaje");
