import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request, context) {
  try {
    const params = await context.params
    const id = Number(params.id)

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { ok: false, message: "ID de ingreso no valido" },
        { status: 400 }
      )
    }

    const ingreso = await prisma.ingreso.findUnique({
      where: { id },
      include: {
        articulos: true,
        fotos: true,
        logs: true,
        registradoPor: true,
        tipoIngreso: true,
        categoriaFormulario: true,
      },
    })

    if (!ingreso) {
      return NextResponse.json(
        { ok: false, message: "Ingreso no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      ingreso,
    })
  } catch (error) {
    console.error("Error obteniendo detalle de ingreso de rollizos:", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Error obteniendo detalle de ingreso",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
