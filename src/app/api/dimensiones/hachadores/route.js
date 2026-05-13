import { NextResponse } from "next/server"
import {
  getHachadoresRollizos,
  getHachadoresTodos,
} from "@/services/bejerman/hachadores"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)

    const categoria = searchParams.get("categoria")
    const modo = searchParams.get("modo")

    if (modo !== "TODOS" && categoria !== "ROLLIZOS") {
      return NextResponse.json(
        {
          ok: false,
          message: "Los hachadores solo aplican para la categoría ROLLIZOS",
          categoria,
        },
        { status: 400 }
      )
    }

    const data =
      modo === "TODOS" ? await getHachadoresTodos() : await getHachadoresRollizos()

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
        message: "Error obteniendo hachadores desde Bejerman",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
