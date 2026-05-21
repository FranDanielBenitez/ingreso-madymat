import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { crearDetalleLog } from "@/lib/ingresos/logs"

const INCLUDE_INGRESO = {
  articulos: {
    orderBy: {
      id: "asc",
    },
  },
  fotos: true,
  logs: {
    orderBy: {
      id: "asc",
    },
  },
  registradoPor: true,
  tipoIngreso: true,
  categoriaFormulario: true,
  procedencia: true,
}

function limpiarTexto(value) {
  if (value === null || value === undefined) return null

  const texto = String(value).trim()

  return texto === "" ? null : texto
}

function normalizarDecimal(value) {
  if (value === null || value === undefined || value === "") return null

  const texto = String(value).replace(",", ".")
  const numero = Number(texto)

  return Number.isNaN(numero) ? null : numero
}

function numeroComparacion(value) {
  const numero = Number(value)

  return Number.isNaN(numero) ? null : numero
}

function textoComparacion(value) {
  const texto = limpiarTexto(value)

  return texto || ""
}

function valorLog(value) {
  if (value === null || value === undefined || value === "") return "-"

  return String(value)
}

function agregarCambio(cambios, label, anterior, nuevo) {
  cambios.push(`${label}: ${valorLog(anterior)} -> ${valorLog(nuevo)}`)
}

export async function PATCH(request, context) {
  try {
    const usuario = await getCurrentUser()
    const params = await context.params
    const id = Number(params.id)
    const itemId = Number(params.itemId)

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { ok: false, message: "ID de ingreso no valido" },
        { status: 400 }
      )
    }

    if (!Number.isInteger(itemId) || itemId <= 0) {
      return NextResponse.json(
        { ok: false, message: "ID de item no valido" },
        { status: 400 }
      )
    }

    let body

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { ok: false, message: "Debe enviarse el cuerpo de edicion" },
        { status: 400 }
      )
    }

    const cantidad = normalizarDecimal(body?.cantidad)
    const unidad = limpiarTexto(body?.unidad)
    const motivo = limpiarTexto(body?.motivo)

    if (!cantidad || cantidad <= 0) {
      return NextResponse.json(
        { ok: false, message: "La cantidad debe ser mayor a 0" },
        { status: 400 }
      )
    }

    if (!unidad) {
      return NextResponse.json(
        { ok: false, message: "La unidad es obligatoria" },
        { status: 400 }
      )
    }

    if (!motivo) {
      return NextResponse.json(
        { ok: false, message: "El motivo de edicion es obligatorio" },
        { status: 400 }
      )
    }

    const ingresoExistente = await prisma.ingreso.findUnique({
      where: { id },
      include: {
        tipoIngreso: true,
      },
    })

    if (!ingresoExistente) {
      return NextResponse.json(
        { ok: false, message: "Ingreso no encontrado" },
        { status: 404 }
      )
    }

    if (ingresoExistente.tipoIngreso?.codigo !== "MATERIALES") {
      return NextResponse.json(
        { ok: false, message: "El ingreso no corresponde a Materiales" },
        { status: 400 }
      )
    }

    if (ingresoExistente.estado === "ANULADO") {
      return NextResponse.json(
        { ok: false, message: "No se puede editar un item de un ingreso anulado" },
        { status: 400 }
      )
    }

    const item = await prisma.ingresoArticulo.findFirst({
      where: {
        id: itemId,
        ingresoId: id,
      },
    })

    if (!item) {
      return NextResponse.json(
        { ok: false, message: "Item no encontrado para este ingreso" },
        { status: 404 }
      )
    }

    const cambios = []
    const itemData = {}

    if (numeroComparacion(item.cantidad) !== numeroComparacion(cantidad)) {
      itemData.cantidad = cantidad
      agregarCambio(cambios, "Cantidad", item.cantidad, cantidad)
    }

    if (textoComparacion(item.unidad) !== textoComparacion(unidad)) {
      itemData.unidad = unidad
      agregarCambio(cambios, "Unidad", item.unidad, unidad)
    }

    if (cambios.length === 0) {
      return NextResponse.json(
        { ok: false, message: "No se detectaron cambios para guardar" },
        { status: 400 }
      )
    }

    const detalleLog = crearDetalleLog(
      usuario,
      `edito item de ingreso #${id}`,
      `Item actualizado: ${valorLog(
        item.articuloDescripcion
      )} (Codigo: ${valorLog(item.articuloCodigo)}, Categoria: ${valorLog(
        item.categoriaFormulario
      )}). Cambios: ${cambios.join("; ")}. Motivo: ${motivo}.`
    )

    const ingreso = await prisma.$transaction(async (tx) => {
      await tx.ingresoArticulo.update({
        where: { id: item.id },
        data: itemData,
      })

      await tx.ingresoLog.create({
        data: {
          ingresoId: id,
          usuarioId: usuario?.id || null,
          estado: ingresoExistente.estado,
          detalle: detalleLog,
        },
      })

      return tx.ingreso.findUnique({
        where: { id },
        include: INCLUDE_INGRESO,
      })
    })

    return NextResponse.json({
      ok: true,
      message: "Item actualizado correctamente",
      ingreso,
    })
  } catch (error) {
    console.error("Error editando item de materiales:", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Error editando item de materiales",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
