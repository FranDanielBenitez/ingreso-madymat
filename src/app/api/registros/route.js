import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function limpiar(value) {
  if (value === null || value === undefined) return null

  const text = String(value).trim()

  return text === "" ? null : text
}

function fechaDesdeParam(value) {
  const text = limpiar(value)
  if (!text) return null

  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? null : date
}

function fechaHastaParam(value) {
  const text = limpiar(value)
  if (!text) return null

  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    date.setHours(23, 59, 59, 999)
  }

  return date
}

function filtroTexto(value) {
  const text = limpiar(value)

  return text
    ? {
        contains: text,
        mode: "insensitive",
      }
    : null
}

function agregarGrupoOr(where, condiciones) {
  where.AND = [...(where.AND || []), { OR: condiciones }]
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipoIngreso = limpiar(searchParams.get("tipoIngreso"))
    const estado = limpiar(searchParams.get("estado"))
    const fechaDesde = fechaDesdeParam(searchParams.get("fechaDesde"))
    const fechaHasta = fechaHastaParam(searchParams.get("fechaHasta"))
    const proveedor = filtroTexto(searchParams.get("proveedor"))
    const remito = filtroTexto(searchParams.get("remito"))
    const patente = filtroTexto(searchParams.get("patente"))

    const where = {}

    if (tipoIngreso) {
      where.tipoIngreso = {
        codigo: tipoIngreso,
      }
    }

    if (estado) {
      where.estado = estado
    }

    if (fechaDesde || fechaHasta) {
      where.fechaIngreso = {}

      if (fechaDesde) where.fechaIngreso.gte = fechaDesde
      if (fechaHasta) where.fechaIngreso.lte = fechaHasta
    }

    if (proveedor) {
      agregarGrupoOr(where, [
        { proveedorNombreCargado: proveedor },
        { proveedorNombreValidado: proveedor },
      ])
    }

    if (remito) {
      where.remitoProveedor = remito
    }

    if (patente) {
      agregarGrupoOr(where, [
        { patenteCamion: patente },
        { patenteAcoplado: patente },
      ])
    }

    const data = await prisma.ingreso.findMany({
      where,
      include: {
        tipoIngreso: true,
        categoriaFormulario: true,
        articulos: {
          orderBy: {
            id: "asc",
          },
        },
        fotos: true,
        registradoPor: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    })

    return NextResponse.json({
      ok: true,
      total: data.length,
      data,
    })
  } catch (error) {
    console.error("Error obteniendo registros de ingresos:", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Error obteniendo registros de ingresos",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
