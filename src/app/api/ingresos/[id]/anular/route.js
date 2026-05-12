import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const INCLUDE_INGRESO = {
  articulos: true,
  fotos: true,
  logs: true,
  registradoPor: true,
  tipoIngreso: true,
  categoriaFormulario: true,
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
        { ok: false, message: "Debe enviarse el motivo de anulacion" },
        { status: 400 }
      )
    }

    const motivo = String(body?.motivo || "").trim()

    if (!motivo) {
      return NextResponse.json(
        { ok: false, message: "El motivo de anulacion es obligatorio" },
        { status: 400 }
      )
    }

    const ingresoExistente = await prisma.ingreso.findUnique({
      where: { id },
      select: {
        id: true,
        estado: true,
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
        { ok: false, message: "El ingreso ya se encuentra anulado" },
        { status: 400 }
      )
    }

    const ingreso = await prisma.$transaction(async (tx) => {
      await tx.ingreso.update({
        where: { id },
        data: {
          estado: "ANULADO",
        },
      })

      await tx.ingresoLog.create({
        data: {
          ingresoId: id,
          usuarioId: null,
          estado: "ANULADO",
          detalle: `Ingreso anulado. Motivo: ${motivo}`,
        },
      })

      return tx.ingreso.findUnique({
        where: { id },
        include: INCLUDE_INGRESO,
      })
    })

    return NextResponse.json({
      ok: true,
      message: "Ingreso anulado correctamente",
      ingreso,
    })
  } catch (error) {
    console.error("Error anulando ingreso:", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Error anulando ingreso",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
