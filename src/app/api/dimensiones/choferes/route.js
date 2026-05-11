import { NextResponse } from "next/server"
import { getChoferesPropios } from "@/services/bejerman/choferes"

export async function GET() {
  try {
    const data = await getChoferesPropios()

    return NextResponse.json({
      ok: true,
      total: data.length,
      data,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Error obteniendo choferes propios desde SJALA",
        error: error.message,
      },
      { status: 500 }
    )
  }
}