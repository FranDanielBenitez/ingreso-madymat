import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const CAMPOS_BOOLEANOS = ["activa", "aplicaRollizos", "aplicaMateriales"]

export async function PATCH(request, context) {
  try {
    const params = await context.params
    const id = Number(params.id)

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { ok: false, message: "ID de procedencia no valido" },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => null)

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, message: "Debe enviarse el cuerpo de actualizacion" },
        { status: 400 }
      )
    }

    const data = {}

    for (const campo of CAMPOS_BOOLEANOS) {
      if (Object.prototype.hasOwnProperty.call(body, campo)) {
        if (typeof body[campo] !== "boolean") {
          return NextResponse.json(
            { ok: false, message: `El campo ${campo} debe ser booleano` },
            { status: 400 }
          )
        }

        data[campo] = body[campo]
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { ok: false, message: "Debe enviar al menos un campo para actualizar" },
        { status: 400 }
      )
    }

    const existente = await prisma.procedenciaDim.findUnique({
      where: {
        id,
      },
    })

    if (!existente) {
      return NextResponse.json(
        { ok: false, message: "Procedencia no encontrada" },
        { status: 404 }
      )
    }

    const procedencia = await prisma.procedenciaDim.update({
      where: {
        id,
      },
      data,
    })

    return NextResponse.json({
      ok: true,
      procedencia,
    })
  } catch (error) {
    console.error("Error actualizando procedencia:", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Error actualizando procedencia",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
