import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  actualizarFlagsPendientes,
  jsonError,
  limpiarDatoValidado,
  limpiarObservacion,
  obtenerIngresoParaAprobacion,
  validarDatoEntidad,
  validarIdIngreso,
  validarUsuarioAprobador,
} from "@/lib/ingresos/aprobaciones"
import { crearDetalleLog } from "@/lib/ingresos/logs"

export async function PATCH(request, context) {
  try {
    const { usuario, error } = await validarUsuarioAprobador()
    if (error) return error

    const params = await context.params
    const id = validarIdIngreso(params.id)

    if (!id) return jsonError("ID de ingreso no valido", 400)

    const body = await request.json().catch(() => ({}))
    const observacion = limpiarObservacion(body?.observacion)
    const datoValidado = limpiarDatoValidado(body?.datoValidado)
    const errorDato = validarDatoEntidad(datoValidado, "hachador validado")

    if (errorDato) return jsonError(errorDato, 400)

    await prisma.$transaction(
      async (tx) => {
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
          ingresoExistente.hachadorAplica === true &&
          (ingresoExistente.hachadorCargaManual ||
            ingresoExistente.hachadorFueraSugerido ||
            ingresoExistente.hachadorOrigenDato === "MANUAL") &&
          ingresoExistente.hachadorValidado !== true

        if (!tienePendiente) {
          throw Object.assign(
            new Error("El hachador no tiene pendientes de aprobacion"),
            { status: 400 }
          )
        }

        await tx.ingreso.update({
          where: { id },
          data: {
            hachadorValidado: true,
            hachadorCodigoValidado: datoValidado.codigo,
            hachadorNombreValidado: datoValidado.nombre,
            hachadorCuitValidado: datoValidado.cuit,
          },
        })

        await tx.ingresoLog.create({
          data: {
            ingresoId: id,
            usuarioId: usuario.id,
            estado: "HACHADOR_APROBADO",
            detalle: crearDetalleLog(
              usuario,
              "aprobo hachador",
              `Original: ${
                ingresoExistente.hachadorNombreCargado || "Sin nombre"
              }. Validado: ${datoValidado.nombre}${
                datoValidado.codigo ? ` (${datoValidado.codigo})` : ""
              }. Observacion: ${
                observacion || "Aprobado desde detalle de ingreso."
              }.`
            ),
          },
        })
      },
      {
        maxWait: 10000,
        timeout: 20000,
      }
    )

    const ingreso = await actualizarFlagsPendientes(prisma, id)

    return NextResponse.json({
      ok: true,
      message: "Hachador aprobado correctamente",
      ingreso,
    })
  } catch (error) {
    console.error("Error aprobando hachador:", error)
    return jsonError(error.message || "Error aprobando hachador", error.status || 500)
  }
}
