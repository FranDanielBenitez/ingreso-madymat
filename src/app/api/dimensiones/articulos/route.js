import { NextResponse } from "next/server"
import {
  getArticulosRollizos,
  getArticulosPallets,
  getArticulosTablasAserradas,
  getArticulosTablasCepilladas,
  getArticulosTacos,
  getArticulosTerciado,
  getArticulosEsquineros,
  getArticulosFondos,
  getArticulosInterior,
  getArticulosTodos,
} from "@/services/bejerman/articulos"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)

    const categoria = searchParams.get("categoria")
    const modo = searchParams.get("modo")

    let data = []

    if (modo === "TODOS") {
      data = await getArticulosTodos()
    } else if (categoria === "ROLLIZOS") {
      data = await getArticulosRollizos()
    } else if (categoria === "PALLETS") {
      data = await getArticulosPallets()
    } else if (categoria === "TABLAS_ASERRADAS") {
      data = await getArticulosTablasAserradas()
    } else if (categoria === "TABLAS_CEPILLADAS") {
      data = await getArticulosTablasCepilladas()
    } else if (categoria === "TACOS") {
      data = await getArticulosTacos()
    } else if (categoria === "TERCIADO") {
      data = await getArticulosTerciado()
    } else if (categoria === "ESQUINEROS") {
      data = await getArticulosEsquineros()
    } else if (categoria === "FONDOS") {
      data = await getArticulosFondos()
    } else if (categoria === "INTERIOR") {
      data = await getArticulosInterior()
    } else {
      return NextResponse.json(
        {
          ok: false,
          message: "Categoría de artículos no válida",
          categoria,
        },
        { status: 400 }
      )
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
        message: "Error obteniendo artículos desde Bejerman",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
