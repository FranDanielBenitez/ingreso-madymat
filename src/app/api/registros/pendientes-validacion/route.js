import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { obtenerPendientesDetalle } from "@/lib/ingresos/pendientes"

const PENDIENTES_WHERE = {
  OR: [
    { tieneCargaManual: true },
    { tieneFueraSugerido: true },
    { proveedorCargaManual: true },
    { proveedorValidado: false },
    { servicioCargaManual: true },
    { servicioValidado: false },
    { hachadorCargaManual: true },
    { hachadorFueraSugerido: true },
    { hachadorValidado: false },
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
    const registrosCandidatos = await prisma.ingreso.findMany({
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
        logs: {
          orderBy: {
            id: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    const registros = registrosCandidatos
      .map((registro) => ({
        ...registro,
        pendientes: obtenerPendientesDetalle(registro),
      }))
      .filter((registro) => registro.pendientes.length > 0)

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
