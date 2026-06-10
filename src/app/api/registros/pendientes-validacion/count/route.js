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
    {
      AND: [
        { hachadorAplica: true },
        {
          OR: [
            { hachadorCargaManual: true },
            { hachadorFueraSugerido: true },
            { hachadorOrigenDato: "MANUAL" },
          ],
        },
        { hachadorValidado: false },
      ],
    },
    {
      articulos: {
        some: {
          origenDato: "MANUAL",
          articuloValidado: false,
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
        articulos: {
          orderBy: {
            id: "asc",
          },
        },
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

    const count = registrosCandidatos.filter(
      (registro) => obtenerPendientesDetalle(registro).length > 0
    ).length

    return NextResponse.json({
      ok: true,
      count,
    })
  } catch (error) {
    console.error("Error contando pendientes de validacion:", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Error contando pendientes de validacion",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
