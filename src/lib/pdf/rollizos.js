import path from "node:path"
import { prisma } from "@/lib/prisma"
import { generatePdfFromTemplate } from "@/lib/pdf/docx-template"
import {
  obtenerMotivosPendientes,
  tienePendientesSinAprobar,
} from "@/lib/ingresos/pendientes"

const PDF_CONFIG = {
  proveedor: {
    descripcion: "Provedor-Rollizo",
    template: "template_proveedor_rollizo.docx",
    filename: (id) => `rollizo-${id}-proveedor.pdf`,
  },
  hachador: {
    descripcion: "Hachador",
    template: "teplate_hachador_rollizo.docx",
    filename: (id) => `rollizo-${id}-hachador.pdf`,
  },
  fletero: {
    descripcion: "Flete/Transporte-Rollizo",
    template: "teplate_fletero_transporte_rollizo.docx",
    filename: (id) => `rollizo-${id}-fletero.pdf`,
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

function validarMinimos(ingreso) {
  const articulo = ingreso.articulos?.[0]

  if (!ingreso.remitoProveedor || !ingreso.fechaIngreso || !ingreso.procedencia?.nombre) {
    throw pdfError(400, "Faltan datos m\u00ednimos para generar el PDF")
  }

  if (!articulo?.articuloDescripcion || !articulo?.cantidad || !articulo?.unidad) {
    throw pdfError(400, "Faltan datos m\u00ednimos para generar el PDF")
  }
}

function emisorPorTipo(ingreso, tipoPdf) {
  if (tipoPdf === "proveedor") {
    if (!ingreso.proveedorNombreCargado && !ingreso.proveedorNombreValidado) {
      throw pdfError(400, "No hay proveedor asociado al ingreso")
    }

    return {
      razonSocialEmisor: elegir(ingreso.proveedorNombreCargado, ingreso.proveedorNombreValidado),
      codigoProveedor: elegir(ingreso.proveedorCodigoBejerman, ingreso.proveedorCodigoValidado),
      cuitEmisor: elegir(ingreso.proveedorCuitCargado, ingreso.proveedorCuitValidado),
    }
  }

  if (tipoPdf === "fletero") {
    if (!ingreso.servicioNombreCargado && !ingreso.servicioNombreValidado) {
      throw pdfError(400, "No hay fletero o transporte asociado al ingreso")
    }

    return {
      razonSocialEmisor: elegir(ingreso.servicioNombreCargado, ingreso.servicioNombreValidado),
      codigoProveedor: elegir(ingreso.servicioCodigoBejerman, ingreso.servicioCodigoValidado),
      dominio: mostrar(ingreso.patenteCamion),
      nombreChofer: mostrar(ingreso.choferNombreCargado),
      cuitEmisor: elegir(ingreso.servicioCuitCargado, ingreso.servicioCuitValidado),
    }
  }

  if (!ingreso.hachadorNombreCargado && !ingreso.hachadorNombreValidado) {
    throw pdfError(400, "No hay hachador asociado al ingreso")
  }

  return {
    razonSocialEmisor: elegir(ingreso.hachadorNombreCargado, ingreso.hachadorNombreValidado),
    codigoProveedor: elegir(ingreso.hachadorCodigoBejerman, ingreso.hachadorCodigoValidado),
    cuitEmisor: elegir(ingreso.hachadorCuitCargado, ingreso.hachadorCuitValidado),
  }
}

function dataPorTipo(ingreso, tipoPdf) {
  const config = PDF_CONFIG[tipoPdf]
  const articulo = ingreso.articulos?.[0]

  return {
    ...emisorPorTipo(ingreso, tipoPdf),
    descripcionComprobante: config.descripcion,
    numeroComprobante: mostrar(ingreso.remitoProveedor),
    fechaEmision: formatFecha(ingreso.fechaIngreso),
    codigoArticulo: mostrar(articulo?.articuloCodigo),
    descripcionArticulo: mostrar(articulo?.articuloDescripcion),
    cantidad: formatCantidad(articulo?.cantidad),
    unidad: mostrar(articulo?.unidad),
    procedencia: mostrar(ingreso.procedencia?.nombre),
  }
}

export async function getIngresoRollizoParaPdf(id) {
  const ingresoId = Number(id)

  if (!Number.isInteger(ingresoId) || ingresoId <= 0) {
    throw pdfError(400, "ID de ingreso no v\u00e1lido")
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

  if (ingreso.tipoIngreso?.codigo !== "ROLLIZOS") {
    throw pdfError(400, "El ingreso no corresponde a Rollizos")
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

  validarMinimos(ingreso)

  return ingreso
}

export async function renderPdfRollizo({ ingreso, tipoPdf }) {
  const config = PDF_CONFIG[tipoPdf]

  if (!config) {
    throw pdfError(400, "Tipo de PDF no v\u00e1lido")
  }

  try {
    return await generatePdfFromTemplate({
      templatePath: path.join(process.cwd(), "docs", config.template),
      data: dataPorTipo(ingreso, tipoPdf),
      outputBaseName: `rollizo-${ingreso.id}-${tipoPdf}`,
    })
  } catch (error) {
    if (error.message?.includes("No se encontr\u00f3 LibreOffice")) {
      throw pdfError(500, error.message)
    }

    throw pdfError(500, `Error generando PDF desde template DOCX: ${error.message}`)
  }
}

export function nombreArchivoRollizoPdf(id, tipoPdf) {
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
