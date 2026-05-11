import { readFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request, context) {
  try {
    const params = await context.params
    const id = Number(params.id)

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { ok: false, message: "ID de foto no valido" },
        { status: 400 }
      )
    }

    const foto = await prisma.ingresoFoto.findUnique({
      where: { id },
    })

    if (!foto) {
      return NextResponse.json(
        { ok: false, message: "Foto no encontrada" },
        { status: 404 }
      )
    }

    const uploadsDir =
      process.env.UPLOADS_DIR ||
      path.join(/* turbopackIgnore: true */ process.cwd(), "uploads")
    const rutaAbsoluta = path.join(
      /* turbopackIgnore: true */ uploadsDir,
      foto.rutaRelativa
    )

    let buffer

    try {
      buffer = await readFile(/* turbopackIgnore: true */ rutaAbsoluta)
    } catch {
      return NextResponse.json(
        { ok: false, message: "El archivo fisico de la foto no existe" },
        { status: 404 }
      )
    }

    return new Response(buffer, {
      headers: {
        "Content-Type": foto.mimeType || "image/jpeg",
        "Cache-Control": "private, max-age=300",
      },
    })
  } catch (error) {
    console.error("Error obteniendo foto de ingreso:", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Error obteniendo foto",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
