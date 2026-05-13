import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const PENDIENTES_WHERE = {
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
    const registros = await prisma.ingreso.findMany({
      where: PENDIENTES_WHERE,
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
        logs: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      ok: true,
      registros,
    })
  } catch (error) {
    console.error("Error obteniendo pendientes de validacion:", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Error obteniendo pendientes de validacion",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
