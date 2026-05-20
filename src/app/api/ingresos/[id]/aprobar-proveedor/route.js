import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  actualizarFlagsPendientes,
  jsonError,
  limpiarObservacion,
  nombreUsuario,
  observacionLog,
  obtenerIngresoParaAprobacion,
  validarIdIngreso,
  validarUsuarioAprobador,
} from "@/lib/ingresos/aprobaciones"

export async function PATCH(request, context) {
  try {
    const { usuario, error } = await validarUsuarioAprobador()
    if (error) return error

    const params = await context.params
    const id = validarIdIngreso(params.id)

    if (!id) return jsonError("ID de ingreso no valido", 400)

    const body = await request.json().catch(() => ({}))
    const observacion = limpiarObservacion(body?.observacion)

    const ingreso = await prisma.$transaction(async (tx) => {
      const ingresoExistente = await obtenerIngresoParaAprobacion(tx, id)

      if (!ingresoExistente) {
        throw Object.assign(new Error("Ingreso no encontrado"), { status: 404 })
      }

      if (ingresoExistente.estado === "ANULADO") {
        throw Object.assign(new Error("No se puede aprobar un ingreso anulado"), {
          status: 400,
        })
      }

      const tienePendiente =
        (ingresoExistente.proveedorCargaManual ||
          ingresoExistente.proveedorFueraSugerido ||
          ingresoExistente.proveedorOrigenDato === "MANUAL") &&
        ingresoExistente.proveedorValidado !== true

      if (!tienePendiente) {
        throw Object.assign(
          new Error("El proveedor no tiene pendientes de aprobacion"),
          { status: 400 }
        )
      }

      await tx.ingreso.update({
        where: { id },
        data: {
          proveedorValidado: true,
          proveedorCodigoValidado:
            ingresoExistente.proveedorCodigoValidado ||
            ingresoExistente.proveedorCodigoBejerman,
          proveedorNombreValidado:
            ingresoExistente.proveedorNombreValidado ||
            ingresoExistente.proveedorNombreCargado,
          proveedorCuitValidado:
            ingresoExistente.proveedorCuitValidado ||
            ingresoExistente.proveedorCuitCargado,
        },
      })

      await tx.ingresoLog.create({
        data: {
          ingresoId: id,
          usuarioId: usuario.id,
          estado: "PROVEEDOR_APROBADO",
          detalle: `Proveedor aprobado por ${nombreUsuario(usuario)}.${observacionLog(
            observacion
          )}`,
        },
      })

      return actualizarFlagsPendientes(tx, id)
    })

    return NextResponse.json({
      ok: true,
      message: "Proveedor aprobado correctamente",
      ingreso,
    })
  } catch (error) {
    console.error("Error aprobando proveedor:", error)
    return jsonError(error.message || "Error aprobando proveedor", error.status || 500)
  }
}
