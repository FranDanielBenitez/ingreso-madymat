import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function limpiarTexto(value) {
  if (value === null || value === undefined) return null

  const texto = String(value).trim()

  return texto === "" ? null : texto
}

export async function GET() {
  try {
    const procedencias = await prisma.procedenciaDim.findMany({
      where: {
        activa: true,
      },
      orderBy: {
        nombre: "asc",
      },
    })

    return NextResponse.json({
      ok: true,
      procedencias,
      data: procedencias,
    })
  } catch (error) {
    console.error("Error obteniendo procedencias:", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Error obteniendo procedencias",
        error: error.message,
      },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null)
    const nombre = limpiarTexto(body?.nombre)

    if (!nombre) {
      return NextResponse.json(
        { ok: false, message: "El nombre de la procedencia es obligatorio" },
        { status: 400 }
      )
    }

    const existente = await prisma.procedenciaDim.findFirst({
      where: {
        nombre,
      },
    })

    if (existente) {
      return NextResponse.json(
        { ok: false, message: "Ya existe una procedencia con ese nombre" },
        { status: 400 }
      )
    }

    const procedencia = await prisma.procedenciaDim.create({
      data: {
        nombre,
        activa: true,
      },
    })

    return NextResponse.json({
      ok: true,
      procedencia,
    })
  } catch (error) {
    console.error("Error creando procedencia:", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Error creando procedencia",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
