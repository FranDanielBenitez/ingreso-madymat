import { NextResponse } from "next/server"
import { getPorterosSjala } from "@/services/bejerman/porteros"

export async function GET() {
  try {
    const data = await getPorterosSjala()

    return NextResponse.json({
      ok: true,
      total: data.length,
      data,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Error obteniendo porteros desde SJALA",
        error: error.message,
      },
      { status: 500 }
    )
  }
}