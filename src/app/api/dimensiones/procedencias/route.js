import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function limpiarTexto(value) {
  if (value === null || value === undefined) return null

  const texto = String(value).trim()

  return texto === "" ? null : texto
}

function esBooleano(value) {
  return typeof value === "boolean"
}

function valorBooleano(value, fallback) {
  return esBooleano(value) ? value : fallback
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = limpiarTexto(searchParams.get("tipo"))?.toUpperCase()
    const incluirInactivas = searchParams.get("incluirInactivas") === "true"
    const where = {}

    if (!incluirInactivas) {
      where.activa = true
    }

    if (tipo === "ROLLIZOS") {
      where.aplicaRollizos = true
    }

    if (tipo === "MATERIALES") {
      where.aplicaMateriales = true
    }

    const procedencias = await prisma.procedenciaDim.findMany({
      where,
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
    const aplicaRollizos = valorBooleano(body?.aplicaRollizos, true)
    const aplicaMateriales = valorBooleano(body?.aplicaMateriales, true)

    if (!nombre) {
      return NextResponse.json(
        { ok: false, message: "El nombre de la procedencia es obligatorio" },
        { status: 400 }
      )
    }

    const existente = await prisma.procedenciaDim.findUnique({
      where: {
        nombre,
      },
    })

    if (existente) {
      if (!existente.activa) {
        return NextResponse.json(
          {
            ok: false,
            message: "La procedencia ya existe. Puede activarla desde el listado.",
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { ok: false, message: "Ya existe una procedencia con ese nombre" },
        { status: 400 }
      )
    }

    const procedencia = await prisma.procedenciaDim.create({
      data: {
        nombre,
        aplicaRollizos,
        aplicaMateriales,
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
