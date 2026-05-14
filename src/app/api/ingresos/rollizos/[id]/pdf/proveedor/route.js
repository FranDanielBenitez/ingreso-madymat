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
    const pdf = await renderPdfRollizo({ ingreso, tipoPdf: "proveedor" })

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nombreArchivoRollizoPdf(ingreso.id, "proveedor")}"`,
      },
    })
  } catch (error) {
    console.error("Error generando PDF proveedor rollizos:", error)
    return jsonPdfError(error)
  }
}
