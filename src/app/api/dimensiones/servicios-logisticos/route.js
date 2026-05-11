import { NextResponse } from "next/server"
import {
  getFleterosRollizos,
  getFleterosEsquineros,
  getFleterosMateriales,
  getFleterosVarios,
  getTransportesVarios,
} from "@/services/bejerman/servicios-logisticos"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)

    const categoria = searchParams.get("categoria")
    const tipo = searchParams.get("tipo")

    let data = []

    if (tipo === "TRANSPORTE") {
      data = await getTransportesVarios()
    } else if (categoria === "ROLLIZOS") {
      data = await getFleterosRollizos()
    } else if (categoria === "ESQUINEROS") {
      data = await getFleterosEsquineros()
    } else if (
      categoria === "PALLETS" ||
      categoria === "TABLAS_ASERRADAS" ||
      categoria === "TABLAS_CEPILLADAS" ||
      categoria === "TACOS" ||
      categoria === "TERCIADO" ||
      categoria === "FONDOS" ||
      categoria === "INTERIOR" ||
      categoria === "MATERIA_PRIMA"
    ) {
      data = await getFleterosMateriales()
    } else if (categoria === "VARIOS") {
      data = await getFleterosVarios()
    } else {
      return NextResponse.json(
        {
          ok: false,
          message: "Categoría o tipo de servicio logístico no válido",
          categoria,
          tipo,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      ok: true,
      categoria,
      tipo,
      total: data.length,
      data,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Error obteniendo servicios logísticos desde Bejerman",
        error: error.message,
      },
      { status: 500 }
    )
  }
}