-- AlterTable
ALTER TABLE "ingresos" ADD COLUMN     "procedencia_id" INTEGER;

-- CreateTable
CREATE TABLE "procedencia_dim" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procedencia_dim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "procedencia_dim_nombre_key" ON "procedencia_dim"("nombre");

-- AddForeignKey
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_procedencia_id_fkey" FOREIGN KEY ("procedencia_id") REFERENCES "procedencia_dim"("id") ON DELETE SET NULL ON UPDATE CASCADE;
