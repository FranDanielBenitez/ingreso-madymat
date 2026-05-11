import { NextResponse } from "next/server"
import { getHachadoresRollizos } from "@/services/bejerman/hachadores"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)

    const categoria = searchParams.get("categoria")

    if (categoria !== "ROLLIZOS") {
      return NextResponse.json(
        {
          ok: false,
          message: "Los hachadores solo aplican para la categoría ROLLIZOS",
          categoria,
        },
        { status: 400 }
      )
    }

    const data = await getHachadoresRollizos()

    return NextResponse.json({
      ok: true,
      categoria,
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
