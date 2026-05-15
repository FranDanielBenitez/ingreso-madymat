-- DropForeignKey
ALTER TABLE "usuario_sesiones" DROP CONSTRAINT "usuario_sesiones_usuario_id_fkey";

-- AddForeignKey
ALTER TABLE "usuario_sesiones" ADD CONSTRAINT "usuario_sesiones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios_app"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
