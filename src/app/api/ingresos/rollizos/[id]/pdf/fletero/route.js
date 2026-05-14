import {
  getIngresoRollizoParaPdf,
  jsonPdfError,
  nombreArchivoRollizoPdf,
  renderPdfRollizo,
} from "@/lib/pdf/rollizos"

export async function GET(_request, context) {
  try {
    const { id } = await context.params
    const ingreso = await getIngresoRollizoParaPdf(id)
    const pdf = await renderPdfRollizo({ ingreso, tipoPdf: "fletero" })

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nombreArchivoRollizoPdf(ingreso.id, "fletero")}"`,
      },
    })
  } catch (error) {
    console.error("Error generando PDF fletero rollizos:", error)
    return jsonPdfError(error)
  }
}
