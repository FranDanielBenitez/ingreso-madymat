-- AlterTable
ALTER TABLE "procedencia_dim"
ADD COLUMN "aplica_rollizos" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "aplica_materiales" BOOLEAN NOT NULL DEFAULT true;
