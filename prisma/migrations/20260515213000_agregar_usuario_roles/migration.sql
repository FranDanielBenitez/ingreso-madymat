-- CreateTable
CREATE TABLE "usuario_roles" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "rol" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_roles_usuario_id_rol_key" ON "usuario_roles"("usuario_id", "rol");

-- AddForeignKey
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios_app"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill roles from legacy field.
INSERT INTO "usuario_roles" ("usuario_id", "rol")
SELECT "id", 'DATA_ENTRY'
FROM "usuarios_app"
WHERE "rol" = 'PORTERIA'
ON CONFLICT ("usuario_id", "rol") DO NOTHING;

INSERT INTO "usuario_roles" ("usuario_id", "rol")
SELECT "id", 'PROVEEDORES_AUDITOR'
FROM "usuarios_app"
WHERE "rol" = 'PROVEEDORES'
ON CONFLICT ("usuario_id", "rol") DO NOTHING;

INSERT INTO "usuario_roles" ("usuario_id", "rol")
SELECT "id", 'IT_TECNICO'
FROM "usuarios_app"
WHERE "rol" = 'SISTEMAS'
ON CONFLICT ("usuario_id", "rol") DO NOTHING;

INSERT INTO "usuario_roles" ("usuario_id", "rol")
SELECT "id", 'ADMINISTRADOR'
FROM "usuarios_app"
WHERE "rol" = 'ADMIN'
ON CONFLICT ("usuario_id", "rol") DO NOTHING;

INSERT INTO "usuario_roles" ("usuario_id", "rol")
SELECT "id", 'IT_TECNICO'
FROM "usuarios_app"
WHERE "rol" = 'ADMIN'
ON CONFLICT ("usuario_id", "rol") DO NOTHING;

INSERT INTO "usuario_roles" ("usuario_id", "rol")
SELECT "id", 'DATA_ENTRY'
FROM "usuarios_app"
WHERE "rol" = 'ADMIN'
ON CONFLICT ("usuario_id", "rol") DO NOTHING;
