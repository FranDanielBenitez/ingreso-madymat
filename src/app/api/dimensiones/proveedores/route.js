import { NextResponse } from "next/server"
import {
  getProveedoresTodos,
  getProveedoresRollizos,
  getProveedoresEsquineros,
  getProveedoresMateriaPrima,
} from "@/services/bejerman/proveedores"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)

    const categoria = searchParams.get("categoria")
    const modo = searchParams.get("modo")

    let data = []

    if (modo === "TODOS") {
      data = await getProveedoresTodos()
    } else if (categoria === "ROLLIZOS") {
      data = await getProveedoresRollizos()
    } else if (categoria === "ESQUINEROS") {
      data = await getProveedoresEsquineros()
    } else if (categoria === "MATERIA_PRIMA") {
      data = await getProveedoresMateriaPrima()
    } else {
      data = await getProveedoresTodos()
    }

    return NextResponse.json({
      ok: true,
      categoria,
      modo,
      total: data.length,
      data,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Error obteniendo proveedores desde Bejerman",
        error: error.message,
      },
      { status: 500 }
    )
  }
}