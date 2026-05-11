-- CreateEnum
CREATE TYPE "TipoFotoIngreso" AS ENUM ('CAMION_PATENTE', 'MATERIAL_CARGADO', 'REMITO_FISICO', 'ADICIONAL');

-- CreateTable
CREATE TABLE "ingreso_fotos" (
    "id" SERIAL NOT NULL,
    "ingreso_id" INTEGER NOT NULL,
    "tipo_foto" "TipoFotoIngreso" NOT NULL,
    "nombre_original" TEXT,
    "nombre_archivo" TEXT NOT NULL,
    "ruta_relativa" TEXT NOT NULL,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "observacion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingreso_fotos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ingreso_fotos" ADD CONSTRAINT "ingreso_fotos_ingreso_id_fkey" FOREIGN KEY ("ingreso_id") REFERENCES "ingresos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
