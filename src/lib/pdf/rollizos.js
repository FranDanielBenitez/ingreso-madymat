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
    descripcion: "Servicio Externo-Rollizo",
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

function porcentajePdf(articulo, totalArticulos) {
  const value = articulo?.porcentajeParticipacion

  if ((value === null || value === undefined || value === "") && totalArticulos === 1) {
    return "100%"
  }

  if (value === null || value === undefined || value === "") {
    return "-"
  }

  const numero = Number(value)

  if (Number.isNaN(numero)) return `${value}%`

  return `${new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numero)}%`
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

function unidadTotalViaje(articulos) {
  const unidades = [
    ...new Set(
      articulos
        .map((articulo) => articulo.unidad)
        .filter((unidad) => unidad !== null && unidad !== undefined && unidad !== "")
    ),
  ]

  return unidades.length === 1 ? unidades[0] : "-"
}

function totalCantidadArticulos(articulos) {
  return articulos.reduce((total, articulo) => {
    const cantidad = Number(articulo.cantidad)
    return Number.isNaN(cantidad) ? total : total + cantidad
  }, 0)
}

function itemsPdf(ingreso) {
  const articulos = ingreso.articulos || []

  return articulos.map((articulo) => {
    if (articuloDescripcionPdf(articulo) === "-" || !articulo?.cantidad || !articulo?.unidad) {
      throw pdfError(400, "Faltan datos m\u00ednimos para generar el PDF")
    }

    return {
      codigoArticulo: mostrar(articuloCodigoPdf(articulo)),
      descripcionArticulo: mostrar(articuloDescripcionPdf(articulo)),
      porcentaje: porcentajePdf(articulo, articulos.length),
      cantidad: formatCantidad(articulo.cantidad),
      unidad: mostrar(articulo.unidad),
    }
  })
}

function validarMinimos(ingreso) {
  if (!ingreso.remitoProveedor || !ingreso.fechaIngreso || !ingreso.procedencia?.nombre) {
    throw pdfError(400, "Faltan datos m\u00ednimos para generar el PDF")
  }

  if (!ingreso.articulos?.length) {
    throw pdfError(400, "No hay articulos asociados al ingreso")
  }

  itemsPdf(ingreso)
}

function emisorPorTipo(ingreso, tipoPdf) {
  if (tipoPdf === "proveedor") {
    if (!ingreso.proveedorNombreCargado && !ingreso.proveedorNombreValidado) {
      throw pdfError(400, "No hay proveedor asociado al ingreso")
    }

    return {
      razonSocialEmisor: elegir(ingreso.proveedorNombreValidado, ingreso.proveedorNombreCargado),
      codigoProveedor: elegir(ingreso.proveedorCodigoValidado, ingreso.proveedorCodigoBejerman),
      cuitEmisor: formatearCuit(elegir(ingreso.proveedorCuitValidado, ingreso.proveedorCuitCargado)),
    }
  }

  if (tipoPdf === "fletero") {
    if (!ingreso.servicioNombreCargado && !ingreso.servicioNombreValidado) {
      throw pdfError(400, "No hay fletero o transporte asociado al ingreso")
    }

    return {
      razonSocialEmisor: elegir(ingreso.servicioNombreValidado, ingreso.servicioNombreCargado),
      codigoProveedor: elegir(ingreso.servicioCodigoValidado, ingreso.servicioCodigoBejerman),
      dominio: mostrar(ingreso.patenteCamion),
      nombreChofer: mostrar(ingreso.choferNombreCargado),
      cuitEmisor: formatearCuit(elegir(ingreso.servicioCuitValidado, ingreso.servicioCuitCargado)),
    }
  }

  if (!ingreso.hachadorNombreCargado && !ingreso.hachadorNombreValidado) {
    throw pdfError(400, "No hay hachador asociado al ingreso")
  }

  return {
    razonSocialEmisor: elegir(ingreso.hachadorNombreValidado, ingreso.hachadorNombreCargado),
    codigoProveedor: elegir(ingreso.hachadorCodigoValidado, ingreso.hachadorCodigoBejerman),
    cuitEmisor: formatearCuit(elegir(ingreso.hachadorCuitValidado, ingreso.hachadorCuitCargado)),
  }
}

function dataPorTipo(ingreso, tipoPdf) {
  const config = PDF_CONFIG[tipoPdf]
  const articulos = ingreso.articulos || []
  const items = itemsPdf(ingreso)

  return {
    ...emisorPorTipo(ingreso, tipoPdf),
    descripcionComprobante: config.descripcion,
    numeroComprobante: mostrar(ingreso.remitoProveedor),
    fechaEmision: formatFecha(ingreso.fechaIngreso),
    cantidadTotalViaje: formatCantidad(totalCantidadArticulos(articulos)),
    unidadTotalViaje: mostrar(unidadTotalViaje(articulos)),
    procedencia: mostrar(ingreso.procedencia?.nombre),
    observaciones: mostrar(ingreso.observaciones),
    tipoUnidadLogistica: mostrarTipoUnidadLogistica(
      ingreso.tipoUnidadLogistica
    ),
    items,
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
