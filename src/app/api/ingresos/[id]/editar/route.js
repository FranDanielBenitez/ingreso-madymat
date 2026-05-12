import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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

function fechaDesdeInput(value) {
  const texto = limpiarTexto(value)
  if (!texto) return null

  const fecha = new Date(texto)

  return Number.isNaN(fecha.getTime()) ? null : fecha
}

function fechaSolo(value) {
  if (!value) return ""

  return new Date(value).toISOString().slice(0, 10)
}

function textoComparacion(value) {
  const texto = limpiarTexto(value)

  return texto || ""
}

function numeroComparacion(value) {
  const numero = Number(value)

  return Number.isNaN(numero) ? null : numero
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
    const params = await context.params
    const id = Number(params.id)

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { ok: false, message: "ID de ingreso no valido" },
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

    const motivo = limpiarTexto(body?.motivo)

    if (!motivo) {
      return NextResponse.json(
        { ok: false, message: "El motivo de edicion es obligatorio" },
        { status: 400 }
      )
    }

    const fechaIngreso = fechaDesdeInput(body?.fechaIngreso)

    if (!fechaIngreso) {
      return NextResponse.json(
        { ok: false, message: "La fecha de ingreso es obligatoria" },
        { status: 400 }
      )
    }

    const ingresoExistente = await prisma.ingreso.findUnique({
      where: { id },
      include: {
        articulos: {
          orderBy: {
            id: "asc",
          },
        },
        logs: true,
        tipoIngreso: true,
        categoriaFormulario: true,
      },
    })

    if (!ingresoExistente) {
      return NextResponse.json(
        { ok: false, message: "Ingreso no encontrado" },
        { status: 404 }
      )
    }

    if (ingresoExistente.estado === "ANULADO") {
      return NextResponse.json(
        { ok: false, message: "No se puede editar un ingreso anulado" },
        { status: 400 }
      )
    }

    const articulo = ingresoExistente.articulos?.[0]
    const esMaterialMultiItem =
      ingresoExistente.tipoIngreso?.codigo === "MATERIALES" &&
      ingresoExistente.articulos.length > 1

    if (!articulo) {
      return NextResponse.json(
        { ok: false, message: "No se encontro articulo asociado al ingreso" },
        { status: 400 }
      )
    }

    const cantidad = esMaterialMultiItem
      ? null
      : normalizarDecimal(body?.cantidad)

    if (!esMaterialMultiItem && (!cantidad || cantidad <= 0)) {
      return NextResponse.json(
        { ok: false, message: "La cantidad debe ser mayor a 0" },
        { status: 400 }
      )
    }

    const unidad = esMaterialMultiItem ? null : limpiarTexto(body?.unidad)

    if (!esMaterialMultiItem && !unidad) {
      return NextResponse.json(
        { ok: false, message: "La unidad es obligatoria" },
        { status: 400 }
      )
    }

    const remitoProveedor = limpiarTexto(body?.remitoProveedor)
    const patenteCamion = limpiarTexto(body?.patenteCamion)?.toUpperCase() || null
    const patenteAcoplado =
      limpiarTexto(body?.patenteAcoplado)?.toUpperCase() || null
    const observaciones = limpiarTexto(body?.observaciones)
    const ingresoData = {}
    const articuloData = {}
    const cambios = []

    if (fechaSolo(ingresoExistente.fechaIngreso) !== fechaSolo(fechaIngreso)) {
      ingresoData.fechaIngreso = fechaIngreso
      agregarCambio(
        cambios,
        "Fecha ingreso",
        fechaSolo(ingresoExistente.fechaIngreso),
        fechaSolo(fechaIngreso)
      )
    }

    if (textoComparacion(ingresoExistente.remitoProveedor) !== textoComparacion(remitoProveedor)) {
      ingresoData.remitoProveedor = remitoProveedor
      agregarCambio(
        cambios,
        "Remito proveedor",
        ingresoExistente.remitoProveedor,
        remitoProveedor
      )
    }

    if (textoComparacion(ingresoExistente.patenteCamion) !== textoComparacion(patenteCamion)) {
      ingresoData.patenteCamion = patenteCamion
      agregarCambio(
        cambios,
        "Patente camion",
        ingresoExistente.patenteCamion,
        patenteCamion
      )
    }

    if (textoComparacion(ingresoExistente.patenteAcoplado) !== textoComparacion(patenteAcoplado)) {
      ingresoData.patenteAcoplado = patenteAcoplado
      agregarCambio(
        cambios,
        "Patente acoplado",
        ingresoExistente.patenteAcoplado,
        patenteAcoplado
      )
    }

    if (textoComparacion(ingresoExistente.observaciones) !== textoComparacion(observaciones)) {
      ingresoData.observaciones = observaciones
      agregarCambio(
        cambios,
        "Observaciones",
        ingresoExistente.observaciones,
        observaciones
      )
    }

    if (
      !esMaterialMultiItem &&
      numeroComparacion(articulo.cantidad) !== numeroComparacion(cantidad)
    ) {
      articuloData.cantidad = cantidad
      agregarCambio(cambios, "Cantidad", articulo.cantidad, cantidad)
    }

    if (
      !esMaterialMultiItem &&
      textoComparacion(articulo.unidad) !== textoComparacion(unidad)
    ) {
      articuloData.unidad = unidad
      agregarCambio(cambios, "Unidad", articulo.unidad, unidad)
    }

    if (ingresoExistente.choferOrigenDato === "MANUAL") {
      const choferNombreCargado = limpiarTexto(body?.choferNombreCargado)
      const choferDocumentoCargado = limpiarTexto(body?.choferDocumentoCargado)

      if (
        textoComparacion(ingresoExistente.choferNombreCargado) !==
        textoComparacion(choferNombreCargado)
      ) {
        ingresoData.choferNombreCargado = choferNombreCargado
        agregarCambio(
          cambios,
          "Nombre chofer externo",
          ingresoExistente.choferNombreCargado,
          choferNombreCargado
        )
      }

      if (
        textoComparacion(ingresoExistente.choferDocumentoCargado) !==
        textoComparacion(choferDocumentoCargado)
      ) {
        ingresoData.choferDocumentoCargado = choferDocumentoCargado
        agregarCambio(
          cambios,
          "Documento chofer externo",
          ingresoExistente.choferDocumentoCargado,
          choferDocumentoCargado
        )
      }
    }

    if (cambios.length === 0) {
      return NextResponse.json(
        { ok: false, message: "No se detectaron cambios para guardar" },
        { status: 400 }
      )
    }

    const detalleLog = `Campos modificados: ${cambios.join(
      "; "
    )}. Motivo: ${motivo}.`

    const ingreso = await prisma.$transaction(async (tx) => {
      if (Object.keys(ingresoData).length > 0) {
        await tx.ingreso.update({
          where: { id },
          data: ingresoData,
        })
      }

      if (Object.keys(articuloData).length > 0) {
        await tx.ingresoArticulo.update({
          where: { id: articulo.id },
          data: articuloData,
        })
      }

      await tx.ingresoLog.create({
        data: {
          ingresoId: id,
          usuarioId: null,
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
      message: "Ingreso actualizado correctamente",
      ingreso,
    })
  } catch (error) {
    console.error("Error editando ingreso:", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Error editando ingreso",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
