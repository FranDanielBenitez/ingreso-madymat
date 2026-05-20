ALTER TABLE "ingreso_articulos"
ADD COLUMN "articulo_codigo_validado" TEXT,
ADD COLUMN "articulo_descripcion_validada" TEXT,
ADD COLUMN "articulo_validado" BOOLEAN NOT NULL DEFAULT false;
