import path from "node:path"
import { prisma } from "@/lib/prisma"
import { generatePdfFromTemplate } from "@/lib/pdf/docx-template"
import {
  obtenerMotivosPendientes,
  tienePendientesSinAprobar,
} from "@/lib/ingresos/pendientes"
import { mostrarTipoUnidadLogistica } from "@/lib/ingresos/unidad-logistica"

const PDF_CONFIG = {
  proveedor: {
    descripcion: "Proveedor-Materiales",
    template: "template_proveedor_materiales.docx",
    filename: (id) => `materiales-${id}-proveedor.pdf`,
  },
  fletero: {
    descripcion: "Servicio Externo-Materiales",
    template: "teplate_fletero_transporte_materiales.docx",
    filename: (id) => `materiales-${id}-fletero.pdf`,
  },
}

function pdfError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

function mostrar(value) {
  if (value === null || value === undefined || value === "") return "-"

  return String(value)
}

function elegir(...values) {
  return values.find((value) => value !== null && value !== undefined && value !== "") || "-"
}

function formatearCuit(value) {
  const original = value || "-"
  const soloNumeros = String(value || "").replace(/\D/g, "")

  if (soloNumeros.length !== 11) {
    return original
  }

  return `${soloNumeros.slice(0, 2)}-${soloNumeros.slice(2, 10)}-${soloNumeros.slice(10)}`
}

function articuloCodigoPdf(articulo) {
  return elegir(articulo?.articuloCodigoValidado, articulo?.articuloCodigo)
}

function articuloDescripcionPdf(articulo) {
  return elegir(
    articulo?.articuloDescripcionValidada,
    articulo?.articuloDescripcion
  )
}

function tieneDato(value) {
  return value !== null && value !== undefined && value !== ""
}

function formatFecha(value) {
  if (!value) return "-"

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

function formatCantidad(value) {
  if (value === null || value === undefined || value === "") return "-"

  const numero = Number(value)

  if (Number.isNaN(numero)) return String(value)

  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(numero)
}

function validarDatosComunes(ingreso) {
  if (!ingreso.remitoProveedor || !ingreso.fechaIngreso || !ingreso.procedencia?.nombre) {
    throw pdfError(400, "Faltan datos minimos para generar el PDF")
  }
}

function validarProveedor(ingreso) {
  if (!tieneDato(ingreso.proveedorNombreCargado) && !tieneDato(ingreso.proveedorNombreValidado)) {
    throw pdfError(400, "No hay proveedor asociado al ingreso")
  }
}

function validarServicio(ingreso) {
  if (!tieneDato(ingreso.servicioNombreCargado) && !tieneDato(ingreso.servicioNombreValidado)) {
    throw pdfError(400, "No hay fletero o transporte asociado al ingreso")
  }
}

function dataProveedor(ingreso) {
  validarProveedor(ingreso)

  if (!ingreso.articulos?.length) {
    throw pdfError(400, "No hay articulos asociados al ingreso")
  }

  const items = ingreso.articulos.map((articulo) => {
    if (articuloDescripcionPdf(articulo) === "-" || !articulo.cantidad || !articulo.unidad) {
      throw pdfError(400, "Faltan datos minimos para generar el PDF")
    }

    return {
      codigoArticulo: mostrar(articuloCodigoPdf(articulo)),
      descripcionArticulo: mostrar(articuloDescripcionPdf(articulo)),
      cantidad: formatCantidad(articulo.cantidad),
      unidad: mostrar(articulo.unidad),
    }
  })

  return {
    razonSocialEmisor: elegir(ingreso.proveedorNombreValidado, ingreso.proveedorNombreCargado),
    codigoProveedor: elegir(ingreso.proveedorCodigoValidado, ingreso.proveedorCodigoBejerman),
    cuitEmisor: formatearCuit(elegir(ingreso.proveedorCuitValidado, ingreso.proveedorCuitCargado)),
    descripcionComprobante: PDF_CONFIG.proveedor.descripcion,
    numeroComprobante: mostrar(ingreso.remitoProveedor),
    fechaEmision: formatFecha(ingreso.fechaIngreso),
    procedencia: mostrar(ingreso.procedencia?.nombre),
    observaciones: mostrar(ingreso.observaciones),
    tipoUnidadLogistica: mostrarTipoUnidadLogistica(
      ingreso.tipoUnidadLogistica
    ),
    items,
  }
}

function dataFletero(ingreso) {
  validarProveedor(ingreso)
  validarServicio(ingreso)

  const proveedorNombre = elegir(
    ingreso.proveedorNombreValidado,
    ingreso.proveedorNombreCargado
  )

  return {
    razonSocialEmisor: elegir(ingreso.servicioNombreValidado, ingreso.servicioNombreCargado),
    codigoProveedor: elegir(ingreso.servicioCodigoValidado, ingreso.servicioCodigoBejerman),
    dominio: mostrar(ingreso.patenteCamion),
    nombreChofer: mostrar(ingreso.choferNombreCargado),
    cuitEmisor: formatearCuit(elegir(ingreso.servicioCuitValidado, ingreso.servicioCuitCargado)),
    descripcionComprobante: PDF_CONFIG.fletero.descripcion,
    numeroComprobante: mostrar(ingreso.remitoProveedor),
    fechaEmision: formatFecha(ingreso.fechaIngreso),
    procedencia: mostrar(ingreso.procedencia?.nombre),
    observaciones: mostrar(ingreso.observaciones),
    tipoUnidadLogistica: mostrarTipoUnidadLogistica(
      ingreso.tipoUnidadLogistica
    ),
    codigoArticulo: "FLETEMAT",
    proveedorMaterialProcedencia: `${proveedorNombre} - ${ingreso.procedencia.nombre}`,
    cantidad: "1",
    unidad: "UN",
  }
}

function dataPorTipo(ingreso, tipoPdf) {
  validarDatosComunes(ingreso)

  if (tipoPdf === "proveedor") {
    return dataProveedor(ingreso)
  }

  if (tipoPdf === "fletero") {
    return dataFletero(ingreso)
  }

  throw pdfError(400, "Tipo de PDF no valido")
}

export async function getIngresoMaterialesParaPdf(id) {
  const ingresoId = Number(id)

  if (!Number.isInteger(ingresoId) || ingresoId <= 0) {
    throw pdfError(400, "ID de ingreso no valido")
  }

  const ingreso = await prisma.ingreso.findUnique({
    where: { id: ingresoId },
    include: {
      articulos: {
        orderBy: {
          id: "asc",
        },
      },
      fotos: true,
      logs: true,
      registradoPor: true,
      tipoIngreso: true,
      categoriaFormulario: true,
      procedencia: true,
    },
  })

  if (!ingreso) {
    throw pdfError(404, "Ingreso no encontrado")
  }

  if (ingreso.tipoIngreso?.codigo !== "MATERIALES") {
    throw pdfError(400, "El ingreso no corresponde a Materiales")
  }

  if (ingreso.estado === "ANULADO") {
    throw pdfError(400, "No se pueden generar PDFs de ingresos anulados")
  }

  if (tienePendientesSinAprobar(ingreso)) {
    const error = pdfError(
      409,
      "No se puede descargar el PDF porque el ingreso tiene datos pendientes de aprobacion."
    )
    error.motivos = obtenerMotivosPendientes(ingreso)
    throw error
  }

  if (!ingreso.procedencia?.nombre) {
    throw pdfError(400, "No hay procedencia asociada al ingreso")
  }

  return ingreso
}

export async function renderPdfMateriales({ ingreso, tipoPdf }) {
  const config = PDF_CONFIG[tipoPdf]

  if (!config) {
    throw pdfError(400, "Tipo de PDF no valido")
  }

  try {
    return await generatePdfFromTemplate({
      templatePath: path.join(process.cwd(), "docs", config.template),
      data: dataPorTipo(ingreso, tipoPdf),
      outputBaseName: `materiales-${ingreso.id}-${tipoPdf}`,
    })
  } catch (error) {
    if (error.message?.includes("No se encontr")) {
      throw pdfError(500, error.message)
    }

    throw pdfError(500, `Error generando PDF desde template DOCX: ${error.message}`)
  }
}

export function nombreArchivoMaterialesPdf(id, tipoPdf) {
  return PDF_CONFIG[tipoPdf].filename(id)
}

export function jsonPdfError(error) {
  return Response.json(
    {
      ok: false,
      message: error.message || "No se pudo generar el PDF",
      motivos: error.motivos || undefined,
    },
    {
      status: error.status || 500,
    }
  )
}
