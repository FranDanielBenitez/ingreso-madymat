import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  actualizarFlagsPendientes,
  jsonError,
  limpiarDatoValidado,
  limpiarObservacion,
  nombreUsuario,
  obtenerIngresoParaAprobacion,
  validarDatoArticulo,
  validarIdIngreso,
  validarUsuarioAprobador,
} from "@/lib/ingresos/aprobaciones"
import { articuloManualAprobado } from "@/lib/ingresos/pendientes"

export async function PATCH(request, context) {
  try {
    const { usuario, error } = await validarUsuarioAprobador()
    if (error) return error

    const params = await context.params
    const id = validarIdIngreso(params.id)
    const itemId = validarIdIngreso(params.itemId)

    if (!id || !itemId) {
      return jsonError("ID de ingreso o item no valido", 400)
    }

    const body = await request.json().catch(() => ({}))
    const observacion = limpiarObservacion(body?.observacion)
    const datoValidado = limpiarDatoValidado(body?.datoValidado)
    const errorDato = validarDatoArticulo(datoValidado)

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

        const articulo = ingresoExistente.articulos.find((item) => item.id === itemId)

        if (!articulo) {
          throw Object.assign(new Error("Articulo no encontrado en el ingreso"), {
            status: 404,
          })
        }

        if (
          articulo.origenDato !== "MANUAL" ||
          articuloManualAprobado(ingresoExistente, articulo)
        ) {
          throw Object.assign(
            new Error("El articulo no tiene pendientes de aprobacion"),
            { status: 400 }
          )
        }

        await tx.ingresoArticulo.update({
          where: { id: articulo.id },
          data: {
            articuloValidado: true,
            articuloCodigoValidado: datoValidado.codigo,
            articuloDescripcionValidada: datoValidado.descripcion,
          },
        })

        await tx.ingresoLog.create({
          data: {
            ingresoId: id,
            usuarioId: usuario.id,
            estado: "ARTICULO_APROBADO",
            detalle: `Articulo aprobado por ${nombreUsuario(usuario)}: Item #${
              articulo.id
            }. Original: ${
              articulo.articuloDescripcion || "Sin descripcion"
            }. Validado: ${datoValidado.descripcion}${
              datoValidado.codigo ? ` (${datoValidado.codigo})` : ""
            }. Observacion: ${observacion || "Aprobado desde detalle de ingreso."}`,
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
      message: "Articulo aprobado correctamente",
      ingreso,
    })
  } catch (error) {
    console.error("Error aprobando articulo:", error)
    return jsonError(error.message || "Error aprobando articulo", error.status || 500)
  }
}