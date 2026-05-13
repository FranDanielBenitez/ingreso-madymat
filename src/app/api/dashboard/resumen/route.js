import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function rangoHoy() {
  const desde = new Date()
  desde.setHours(0, 0, 0, 0)

  const hasta = new Date(desde)
  hasta.setDate(hasta.getDate() + 1)

  return { desde, hasta }
}

const PENDIENTES_VALIDACION_WHERE = {
  OR: [
    { tieneCargaManual: true },
    { tieneFueraSugerido: true },
    { proveedorCargaManual: true },
    { proveedorValidado: false },
    { servicioCargaManual: true },
    { servicioValidado: false },
    {
      articulos: {
        some: {
          origenDato: "MANUAL",
        },
      },
    },
  ],
}

export async function GET() {
  try {
    const { desde, hasta } = rangoHoy()

    const [
      totalIngresos,
      ingresosHoy,
      rollizos,
      materiales,
      anulados,
      registrados,
      conFotos,
      pendientesValidacion,
      ultimosIngresos,
    ] = await Promise.all([
      prisma.ingreso.count(),
      prisma.ingreso.count({
        where: {
          fechaIngreso: {
            gte: desde,
            lt: hasta,
          },
        },
      }),
      prisma.ingreso.count({
        where: {
          tipoIngreso: {
            codigo: "ROLLIZOS",
          },
        },
      }),
      prisma.ingreso.count({
        where: {
          tipoIngreso: {
            codigo: "MATERIALES",
          },
        },
      }),
      prisma.ingreso.count({
        where: {
          estado: "ANULADO",
        },
      }),
      prisma.ingreso.count({
        where: {
          estado: "REGISTRADO",
        },
      }),
      prisma.ingreso.count({
        where: {
          fotos: {
            some: {},
          },
        },
      }),
      prisma.ingreso.count({
        where: PENDIENTES_VALIDACION_WHERE,
      }),
      prisma.ingreso.findMany({
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
        take: 8,
      }),
    ])

    return NextResponse.json({
      ok: true,
      metricas: {
        totalIngresos,
        ingresosHoy,
        rollizos,
        materiales,
        anulados,
        registrados,
        conFotos,
        pendientesValidacion,
      },
      ultimosIngresos,
    })
  } catch (error) {
    console.error("Error obteniendo resumen del dashboard:", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Error obteniendo resumen del dashboard",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
