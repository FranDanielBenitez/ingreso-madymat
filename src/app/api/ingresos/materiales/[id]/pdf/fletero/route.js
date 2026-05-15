import {
  getIngresoMaterialesParaPdf,
  jsonPdfError,
  nombreArchivoMaterialesPdf,
  renderPdfMateriales,
} from "@/lib/pdf/materiales"

export async function GET(_request, context) {
  try {
    const { id } = await context.params
    const ingreso = await getIngresoMaterialesParaPdf(id)
    const pdf = await renderPdfMateriales({ ingreso, tipoPdf: "fletero" })

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nombreArchivoMaterialesPdf(ingreso.id, "fletero")}"`,
      },
    })
  } catch (error) {
    console.error("Error generando PDF fletero materiales:", error)
    return jsonPdfError(error)
  }
}
