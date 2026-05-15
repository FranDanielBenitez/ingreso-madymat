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
    const pdf = await renderPdfMateriales({ ingreso, tipoPdf: "proveedor" })

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nombreArchivoMaterialesPdf(ingreso.id, "proveedor")}"`,
      },
    })
  } catch (error) {
    console.error("Error generando PDF proveedor materiales:", error)
    return jsonPdfError(error)
  }
}
