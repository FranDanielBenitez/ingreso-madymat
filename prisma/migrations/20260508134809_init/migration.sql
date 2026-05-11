-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'PORTERIA', 'PROVEEDORES', 'SISTEMAS');

-- CreateEnum
CREATE TYPE "EstadoIngreso" AS ENUM ('BORRADOR', 'REGISTRADO', 'PENDIENTE_VALIDACION_PROVEEDOR', 'VALIDADO_PROVEEDORES', 'PDF_GENERADO', 'ENVIADO_FEX', 'FINALIZADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "OrigenDato" AS ENUM ('BEJERMAN', 'SJALA', 'MANUAL');

-- CreateEnum
CREATE TYPE "TipoServicioLogistico" AS ENUM ('FLETERO', 'TRANSPORTE');

-- CreateEnum
CREATE TYPE "TipoChofer" AS ENUM ('INTERNO', 'EXTERNO');

-- CreateTable
CREATE TABLE "usuarios_app" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "rol" "RolUsuario" NOT NULL DEFAULT 'PORTERIA',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "legajo_sjala" INTEGER,
    "nombre_sjala" TEXT,
    "seccion_sjala" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_app_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_ingreso" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_ingreso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_formulario" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_formulario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingresos" (
    "id" SERIAL NOT NULL,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoIngreso" NOT NULL DEFAULT 'REGISTRADO',
    "tipo_ingreso_id" INTEGER NOT NULL,
    "categoria_formulario_id" INTEGER,
    "remito_proveedor" TEXT,
    "observaciones" TEXT,
    "proveedor_origen_dato" "OrigenDato" NOT NULL DEFAULT 'BEJERMAN',
    "proveedor_codigo_bejerman" TEXT,
    "proveedor_nombre_cargado" TEXT NOT NULL,
    "proveedor_cuit_cargado" TEXT,
    "proveedor_grupo_bejerman" TEXT,
    "proveedor_subgrupo_bejerman" TEXT,
    "proveedor_fuera_sugerido" BOOLEAN NOT NULL DEFAULT false,
    "proveedor_carga_manual" BOOLEAN NOT NULL DEFAULT false,
    "proveedor_codigo_validado" TEXT,
    "proveedor_nombre_validado" TEXT,
    "proveedor_cuit_validado" TEXT,
    "proveedor_validado" BOOLEAN NOT NULL DEFAULT false,
    "tipo_servicio_logistico" "TipoServicioLogistico",
    "servicio_origen_dato" "OrigenDato",
    "servicio_codigo_bejerman" TEXT,
    "servicio_nombre_cargado" TEXT,
    "servicio_cuit_cargado" TEXT,
    "servicio_grupo_bejerman" TEXT,
    "servicio_subgrupo_bejerman" TEXT,
    "servicio_fuera_sugerido" BOOLEAN NOT NULL DEFAULT false,
    "servicio_carga_manual" BOOLEAN NOT NULL DEFAULT false,
    "servicio_codigo_validado" TEXT,
    "servicio_nombre_validado" TEXT,
    "servicio_cuit_validado" TEXT,
    "servicio_validado" BOOLEAN NOT NULL DEFAULT false,
    "tipo_chofer" "TipoChofer",
    "chofer_origen_dato" "OrigenDato",
    "chofer_legajo_sjala" INTEGER,
    "chofer_nombre_cargado" TEXT,
    "chofer_documento_cargado" TEXT,
    "chofer_carga_manual" BOOLEAN NOT NULL DEFAULT false,
    "chofer_legajo_validado" INTEGER,
    "chofer_nombre_validado" TEXT,
    "chofer_validado" BOOLEAN NOT NULL DEFAULT false,
    "patente_camion" TEXT,
    "patente_acoplado" TEXT,
    "hachador_aplica" BOOLEAN NOT NULL DEFAULT false,
    "hachador_origen_dato" "OrigenDato",
    "hachador_codigo_bejerman" TEXT,
    "hachador_nombre_cargado" TEXT,
    "hachador_cuit_cargado" TEXT,
    "hachador_grupo_bejerman" TEXT,
    "hachador_subgrupo_bejerman" TEXT,
    "hachador_fuera_sugerido" BOOLEAN NOT NULL DEFAULT false,
    "hachador_carga_manual" BOOLEAN NOT NULL DEFAULT false,
    "hachador_codigo_validado" TEXT,
    "hachador_nombre_validado" TEXT,
    "hachador_cuit_validado" TEXT,
    "hachador_validado" BOOLEAN NOT NULL DEFAULT false,
    "tiene_carga_manual" BOOLEAN NOT NULL DEFAULT false,
    "tiene_fuera_sugerido" BOOLEAN NOT NULL DEFAULT false,
    "pdf_generado" BOOLEAN NOT NULL DEFAULT false,
    "ruta_pdf" TEXT,
    "registrado_por_id" INTEGER,
    "validado_por_id" INTEGER,
    "validado_en" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingresos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingreso_articulos" (
    "id" SERIAL NOT NULL,
    "ingreso_id" INTEGER NOT NULL,
    "origen_dato" "OrigenDato" NOT NULL DEFAULT 'BEJERMAN',
    "articulo_gen" TEXT,
    "articulo_codigo" TEXT,
    "articulo_clase" TEXT,
    "articulo_descripcion" TEXT,
    "articulo_proceso" TEXT,
    "articulo_grupo" TEXT,
    "articulo_subgrupo" TEXT,
    "categoria_formulario" TEXT,
    "cantidad" DECIMAL(12,3) NOT NULL,
    "unidad" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingreso_articulos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingreso_logs" (
    "id" SERIAL NOT NULL,
    "ingreso_id" INTEGER NOT NULL,
    "usuario_id" INTEGER,
    "estado" TEXT NOT NULL,
    "detalle" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingreso_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_app_email_key" ON "usuarios_app"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_ingreso_codigo_key" ON "tipos_ingreso"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_formulario_codigo_key" ON "categorias_formulario"("codigo");

-- AddForeignKey
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_tipo_ingreso_id_fkey" FOREIGN KEY ("tipo_ingreso_id") REFERENCES "tipos_ingreso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_categoria_formulario_id_fkey" FOREIGN KEY ("categoria_formulario_id") REFERENCES "categorias_formulario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "usuarios_app"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_validado_por_id_fkey" FOREIGN KEY ("validado_por_id") REFERENCES "usuarios_app"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingreso_articulos" ADD CONSTRAINT "ingreso_articulos_ingreso_id_fkey" FOREIGN KEY ("ingreso_id") REFERENCES "ingresos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingreso_logs" ADD CONSTRAINT "ingreso_logs_ingreso_id_fkey" FOREIGN KEY ("ingreso_id") REFERENCES "ingresos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingreso_logs" ADD CONSTRAINT "ingreso_logs_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios_app"("id") ON DELETE SET NULL ON UPDATE CASCADE;
