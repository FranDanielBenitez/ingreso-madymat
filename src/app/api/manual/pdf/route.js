import { generarManualPdf } from "@/lib/manual/pdf"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const usuario = await getCurrentUser()

    if (!usuario) {
      return Response.json(
        {
          ok: false,
          message: "Usuario logueado obligatorio",
        },
        { status: 401 }
      )
    }

    const pdf = generarManualPdf()

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="manual-madymat.pdf"',
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Error generando manual PDF:", error)

    return Response.json(
      {
        ok: false,
        message: "No se pudo generar el manual en PDF",
      },
      { status: 500 }
    )
  }
}
