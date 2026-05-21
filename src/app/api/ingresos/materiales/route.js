import { NextResponse } from "next/server"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { canCreateIngreso } from "@/lib/auth/permissions"
import { obtenerSiguienteNumeroViaje } from "@/lib/ingresos/numero-viaje"
import { crearDetalleLog } from "@/lib/ingresos/logs"
import {
  mostrarTipoUnidadLogistica,
  normalizarTipoUnidadLogistica,
} from "@/lib/ingresos/unidad-logistica"

function normalizarDecimal(value) {
  if (value === null || value === undefined || value === "") return 0

  const texto = String(value).trim().replace(/\./g, "").replace(",", ".")
  const numero = Number(texto)

  if (Number.isNaN(numero)) return 0

  return numero
}

function combinarFechaHora(fecha, hora) {
  if (!fecha) return null

  const fechaParts = String(fecha).split("-").map(Number)
  if (fechaParts.length !== 3) return null

  const [year, month, day] = fechaParts
  const [hours = 0, minutes = 0] = String(hora || "00:00")
    .split(":")
    .map(Number)

  if (
    !year || !month || !day ||
    Number.isNaN(hours) || Number.isNaN(minutes) ||
    hours < 0 || hours > 23 ||
    minutes < 0 || minutes > 59
  ) {
    return null
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

function limpiarTexto(value) {
  if (value === null || value === undefined) return null

  const texto = String(value).trim()

  return texto === "" ? null : texto
}

function esArchivoValido(file) {
  return file && typeof file.arrayBuffer === "function" && file.size > 0
}

function normalizarItems(body) {
  const items = Array.isArray(body.items) ? body.items : []

  if (items.length > 0) return items

  if (body.articuloSeleccionado) {
    return [
      {
        articuloSeleccionado: body.articuloSeleccionado,
        articuloCargaManual: body.articuloCargaManual,
        articuloManual: body.articuloManual,
        categoriaMaterial: body.categoriaMaterial,
        modoBusquedaArticulo: body.articuloModoBusqueda,
        cantidad: body.cantidad,
        unidad: body.unidad,
      },
    ]
  }

  return []
}

function prepararItemsValidos(body) {
  return normalizarItems(body).map((item) => ({
    categoriaMaterial: limpiarTexto(item.categoriaMaterial),
    modoBusquedaArticulo: limpiarTexto(item.modoBusquedaArticulo),
    articuloCargaManual: Boolean(item.articuloCargaManual),
    articulo: item.articuloSeleccionado,
    articuloManualDescripcion: limpiarTexto(item.articuloManual?.descripcion),
    articuloManualCodigo: limpiarTexto(item.articuloManual?.codigo),
    articuloManualObservacion: limpiarTexto(item.articuloManual?.observacion),
    cantidad: normalizarDecimal(item.cantidad),
    unidad: limpiarTexto(item.unidad),
  }))
}

function obtenerExtension(nombreOriginal) {
  const extension = path.extname(nombreOriginal || "").toLowerCase()

  if (!extension || !/^\.[a-z0-9]+$/.test(extension)) {
    return ".jpg"
  }

  return extension
}

async function guardarFotoIngreso({
  file,
  ingreso,
  tipoFoto,
  nombreBase,
  uploadRoot,
}) {
  const fecha = ingreso.fechaIngreso || new Date()
  const anio = String(fecha.getFullYear())
  const mes = String(fecha.getMonth() + 1).padStart(2, "0")
  const nombreArchivo = `${nombreBase}${obtenerExtension(file.name)}`
  const rutaRelativa = path.posix.join(
    "ingresos",
    "materiales",
    anio,
    mes,
    `ingreso-${ingreso.id}`,
    nombreArchivo
  )
  const carpetaDestino = path.join(
    uploadRoot,
    "ingresos",
    "materiales",
    anio,
    mes,
    `ingreso-${ingreso.id}`
  )
  const rutaDestino = path.join(carpetaDestino, nombreArchivo)
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  await mkdir(carpetaDestino, { recursive: true })
  await writeFile(rutaDestino, buffer)

  return {
    ingresoId: ingreso.id,
    tipoFoto,
    nombreOriginal: limpiarTexto(file.name),
    nombreArchivo,
    rutaRelativa,
    mimeType: limpiarTexto(file.type),
    sizeBytes: file.size || null,
  }
}

async function obtenerUsuarioPortero(porteroSeleccionado) {
  if (!porteroSeleccionado?.Legajo) return null

  const legajo = Number(porteroSeleccionado.Legajo)

  const usuario = await prisma.usuarioApp.upsert({
    where: {
      email: `portero-${legajo}@ingreso-madymat.local`,
    },
    update: {
      nombre: porteroSeleccionado.NombreCompleto,
      legajoSjala: legajo,
      nombreSjala: porteroSeleccionado.NombreCompleto,
      seccionSjala: porteroSeleccionado.Seccion,
      activo: true,
    },
    create: {
      nombre: porteroSeleccionado.NombreCompleto,
      email: `portero-${legajo}@ingreso-madymat.local`,
      rol: "PORTERIA",
      activo: true,
      legajoSjala: legajo,
      nombreSjala: porteroSeleccionado.NombreCompleto,
      seccionSjala: porteroSeleccionado.Seccion,
    },
  })

  return usuario
}

export async function POST(request) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !canCreateIngreso(currentUser)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "No puede guardar el ingreso porque su usuario no tiene rol Data Entry. Solicite habilitación a IT si corresponde.",
        },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const payloadRaw = formData.get("payload")

    if (!payloadRaw) {
      return NextResponse.json(
        { ok: false, message: "Debe enviarse el payload del ingreso" },
        { status: 400 }
      )
    }

    let body

    try {
      body = JSON.parse(String(payloadRaw))
    } catch {
      return NextResponse.json(
        { ok: false, message: "El payload del ingreso no es un JSON valido" },
        { status: 400 }
      )
    }

    const archivos = {
      fotoCamionPatente: formData.get("fotoCamionPatente"),
      fotoMaterialCargado: formData.get("fotoMaterialCargado"),
      fotoRemitoFisico: formData.get("fotoRemitoFisico"),
      fotoAdicional: formData.get("fotoAdicional"),
    }

    if (!esArchivoValido(archivos.fotoCamionPatente)) {
      return NextResponse.json(
        { ok: false, message: "La foto del camion / patente es obligatoria" },
        { status: 400 }
      )
    }

    if (!esArchivoValido(archivos.fotoMaterialCargado)) {
      return NextResponse.json(
        { ok: false, message: "La foto del material cargado es obligatoria" },
        { status: 400 }
      )
    }

    const tipoIngreso = await prisma.tipoIngreso.findUnique({
      where: { codigo: "MATERIALES" },
    })

    if (!tipoIngreso) {
      return NextResponse.json(
        {
          ok: false,
          message: "No existe el tipo de ingreso MATERIALES en PostgreSQL",
        },
        { status: 400 }
      )
    }

    const proveedorCargaManual = Boolean(body.proveedorCargaManual)
    const proveedor = body.proveedorSeleccionado
    const proveedorManual = body.proveedorManual || {}
    const proveedorManualNombre = limpiarTexto(proveedorManual.nombre)
    const proveedorManualCuit = limpiarTexto(proveedorManual.cuit)
    const proveedorManualObservacion = limpiarTexto(proveedorManual.observacion)
    const items = prepararItemsValidos(body)
    const servicioCargaManual = Boolean(body.servicioCargaManual)
    const procedenciaId = Number(body.procedenciaId)
    const fechaIngreso = body.fechaIngreso
      ? combinarFechaHora(body.fechaIngreso, body.horaIngreso)
      : null
    const fechaIngresoValue = fechaIngreso || new Date()

    if (body.fechaIngreso && !fechaIngreso) {
      return NextResponse.json(
        {
          ok: false,
          message: "La fecha y hora de ingreso deben tener formato valido",
        },
        { status: 400 }
      )
    }
    const servicio = body.servicioSeleccionado
    const servicioManual = body.servicioManual || {}
    const servicioManualNombre = limpiarTexto(servicioManual.nombre)
    const servicioManualCuit = limpiarTexto(servicioManual.cuit)
    const servicioManualObservacion = limpiarTexto(servicioManual.observacion)
    const chofer = body.choferSeleccionado
    const portero = body.porteroSeleccionado
    const remitoProveedor = limpiarTexto(body.remitoProveedor)

    if (!remitoProveedor) {
      return NextResponse.json(
        { ok: false, message: "Debe ingresar el remito del proveedor." },
        { status: 400 }
      )
    }

    const tipoUnidadLogistica = normalizarTipoUnidadLogistica(
      body.tipoUnidadLogistica
    )

    if (!tipoUnidadLogistica) {
      return NextResponse.json(
        {
          ok: false,
          message: "Debe seleccionar si el viaje corresponde a Chasis o Equipo.",
        },
        { status: 400 }
      )
    }

    if (!Number.isInteger(procedenciaId) || procedenciaId <= 0) {
      return NextResponse.json(
        { ok: false, message: "La procedencia es obligatoria" },
        { status: 400 }
      )
    }

    const procedencia = await prisma.procedenciaDim.findFirst({
      where: {
        id: procedenciaId,
        activa: true,
        aplicaMateriales: true,
      },
    })

    if (!procedencia) {
      return NextResponse.json(
        {
          ok: false,
          message: "La procedencia seleccionada no esta habilitada para Materiales",
        },
        { status: 400 }
      )
    }

    if (proveedorCargaManual && !proveedorManualNombre) {
      return NextResponse.json(
        { ok: false, message: "Debe indicar el nombre del proveedor manual" },
        { status: 400 }
      )
    }

    if (!proveedorCargaManual && !proveedor) {
      return NextResponse.json(
        { ok: false, message: "Debe seleccionar un proveedor" },
        { status: 400 }
      )
    }

    if (servicioCargaManual && !servicioManualNombre) {
      return NextResponse.json(
        { ok: false, message: "Debe indicar el nombre del servicio manual" },
        { status: 400 }
      )
    }

    if (!servicioCargaManual && !servicio) {
      return NextResponse.json(
        { ok: false, message: "Debe seleccionar un servicio logistico" },
        { status: 400 }
      )
    }

    const itemsInvalidos =
      items.length === 0 ||
      items.some(
        (item) =>
          !item.categoriaMaterial ||
          !item.cantidad ||
          item.cantidad <= 0 ||
          !item.unidad ||
          (item.articuloCargaManual
            ? !item.articuloManualDescripcion
            : !item.articulo)
      )

    if (itemsInvalidos) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Debe cargar categoria, articulo, cantidad y unidad en todos los items del remito",
        },
        { status: 400 }
      )
    }

    const categoriaPrincipalCodigo = items[0].categoriaMaterial
    const categoriaFormulario = await prisma.categoriaFormulario.findUnique({
      where: { codigo: categoriaPrincipalCodigo },
    })

    if (!categoriaFormulario) {
      return NextResponse.json(
        {
          ok: false,
          message: "No existe la categoria principal seleccionada en PostgreSQL",
        },
        { status: 400 }
      )
    }

    const usuarioPortero = await obtenerUsuarioPortero(portero)
    const tipoChofer = body.tipoChofer || null
    const choferInterno = tipoChofer === "INTERNO"
    const choferExterno = tipoChofer === "EXTERNO"
    const detallesModoBusqueda = []

    if (!proveedorCargaManual && body.proveedorModoBusqueda === "TODOS") {
      detallesModoBusqueda.push("Proveedor seleccionado desde modo Todos.")
    }

    if (proveedorCargaManual) {
      detallesModoBusqueda.push(
        "Proveedor cargado manualmente, pendiente de validar."
      )
      if (proveedorManualObservacion) {
        detallesModoBusqueda.push(
          `Observacion proveedor manual: ${proveedorManualObservacion}.`
        )
      }
    }

    if (!servicioCargaManual && body.servicioModoBusqueda === "TODOS") {
      detallesModoBusqueda.push(
        "Servicio logistico seleccionado desde modo Todos."
      )
    }

    if (servicioCargaManual) {
      detallesModoBusqueda.push(
        "Servicio logistico cargado manualmente, pendiente de validar."
      )
      if (servicioManualObservacion) {
        detallesModoBusqueda.push(
          `Observacion servicio manual: ${servicioManualObservacion}.`
        )
      }
    }

    const itemsModoTodos = items.filter(
      (item) => !item.articuloCargaManual && item.modoBusquedaArticulo === "TODOS"
    ).length
    const itemsManuales = items.filter((item) => item.articuloCargaManual).length

    if (itemsModoTodos > 0) {
      detallesModoBusqueda.push(`Items fuera de sugeridos: ${itemsModoTodos}.`)
    }

    if (itemsManuales > 0) {
      detallesModoBusqueda.push(
        `Articulos cargados manualmente: ${itemsManuales}. Pendientes de validar.`
      )
    }

    const ingresoCreado = await prisma.$transaction(async (tx) => {
      const viaje = await obtenerSiguienteNumeroViaje(
        tx,
        fechaIngresoValue,
        tipoIngreso.id
      )

      return tx.ingreso.create({
        data: {
          fechaIngreso: fechaIngresoValue,
          periodoViaje: viaje.periodoViaje,
          numeroViaje: viaje.numeroViaje,

          estado: "REGISTRADO",

          tipoIngresoId: tipoIngreso.id,
          categoriaFormularioId: categoriaFormulario.id,
          procedenciaId: procedencia.id,

        remitoProveedor,
        observaciones: limpiarTexto(body.observaciones),
        tipoUnidadLogistica,

        proveedorOrigenDato: proveedorCargaManual ? "MANUAL" : "BEJERMAN",
        proveedorCodigoBejerman: proveedorCargaManual
          ? null
          : limpiarTexto(proveedor.Codigo),
        proveedorNombreCargado: proveedorCargaManual
          ? proveedorManualNombre
          : proveedor.RazonSocial,
        proveedorCuitCargado: proveedorCargaManual
          ? proveedorManualCuit
          : limpiarTexto(proveedor.CUIT),
        proveedorGrupoBejerman: proveedorCargaManual
          ? null
          : limpiarTexto(proveedor.Grupo),
        proveedorSubgrupoBejerman: proveedorCargaManual
          ? null
          : limpiarTexto(proveedor.SubGrupo),
        proveedorFueraSugerido: proveedorCargaManual,
        proveedorCargaManual,
        proveedorCodigoValidado: proveedorCargaManual
          ? null
          : limpiarTexto(proveedor.Codigo),
        proveedorNombreValidado: proveedorCargaManual
          ? null
          : proveedor.RazonSocial,
        proveedorCuitValidado: proveedorCargaManual
          ? null
          : limpiarTexto(proveedor.CUIT),
        proveedorValidado: !proveedorCargaManual,

        tipoServicioLogistico: body.tipoServicio || null,

        servicioOrigenDato: servicioCargaManual ? "MANUAL" : "BEJERMAN",
        servicioCodigoBejerman: servicioCargaManual
          ? null
          : limpiarTexto(servicio.Codigo),
        servicioNombreCargado: servicioCargaManual
          ? servicioManualNombre
          : limpiarTexto(servicio.RazonSocial),
        servicioCuitCargado: servicioCargaManual
          ? servicioManualCuit
          : limpiarTexto(servicio.CUIT),
        servicioGrupoBejerman: servicioCargaManual
          ? null
          : limpiarTexto(servicio.Grupo),
        servicioSubgrupoBejerman: servicioCargaManual
          ? null
          : limpiarTexto(servicio.SubGrupo),
        servicioFueraSugerido: servicioCargaManual,
        servicioCargaManual,
        servicioCodigoValidado: servicioCargaManual
          ? null
          : limpiarTexto(servicio.Codigo),
        servicioNombreValidado: servicioCargaManual
          ? null
          : limpiarTexto(servicio.RazonSocial),
        servicioCuitValidado: servicioCargaManual
          ? null
          : limpiarTexto(servicio.CUIT),
        servicioValidado: !servicioCargaManual,

        tipoChofer,
        choferOrigenDato: choferInterno ? "SJALA" : "MANUAL",
        choferLegajoSjala:
          choferInterno && chofer?.Legajo ? Number(chofer.Legajo) : null,
        choferNombreCargado: choferInterno
          ? limpiarTexto(chofer?.NombreCompleto)
          : limpiarTexto(body.choferNombreExterno),
        choferDocumentoCargado: choferExterno
          ? limpiarTexto(body.choferDocumentoExterno)
          : null,
        choferCargaManual: choferExterno,
        choferLegajoValidado:
          choferInterno && chofer?.Legajo ? Number(chofer.Legajo) : null,
        choferNombreValidado: choferInterno
          ? limpiarTexto(chofer?.NombreCompleto)
          : null,
        choferValidado: choferInterno,

        patenteCamion: limpiarTexto(body.patenteCamion)?.toUpperCase(),
        patenteAcoplado: limpiarTexto(body.patenteAcoplado)?.toUpperCase(),

        hachadorAplica: false,
        hachadorOrigenDato: null,
        hachadorCodigoBejerman: null,
        hachadorNombreCargado: null,
        hachadorCuitCargado: null,
        hachadorGrupoBejerman: null,
        hachadorSubgrupoBejerman: null,
        hachadorFueraSugerido: false,
        hachadorCargaManual: false,
        hachadorCodigoValidado: null,
        hachadorNombreValidado: null,
        hachadorCuitValidado: null,
        hachadorValidado: false,

        tieneCargaManual:
          choferExterno ||
          proveedorCargaManual ||
          servicioCargaManual ||
          itemsManuales > 0,
        tieneFueraSugerido:
          proveedorCargaManual || servicioCargaManual || itemsManuales > 0,

        pdfGenerado: false,

        registradoPorId: usuarioPortero?.id || null,

        articulos: {
          create: items.map((item) => ({
            origenDato: item.articuloCargaManual ? "MANUAL" : "BEJERMAN",

            articuloGen: item.articuloCargaManual
              ? null
              : item.articulo.ArticuloGen
              ? String(item.articulo.ArticuloGen)
              : null,
            articuloCodigo: item.articuloCargaManual
              ? item.articuloManualCodigo
              : limpiarTexto(item.articulo.Codigo),
            articuloClase: item.articuloCargaManual
              ? null
              : limpiarTexto(item.articulo.Clase),
            articuloDescripcion: item.articuloCargaManual
              ? item.articuloManualDescripcion
              : limpiarTexto(item.articulo.Descripcion),
            articuloProceso: item.articuloCargaManual
              ? null
              : limpiarTexto(item.articulo.Proceso),
            articuloGrupo: item.articuloCargaManual
              ? null
              : limpiarTexto(item.articulo.Grupo),
            articuloSubgrupo: item.articuloCargaManual
              ? null
              : limpiarTexto(item.articulo.SubGrupo),

            categoriaFormulario: item.categoriaMaterial,

            cantidad: item.cantidad,
            unidad: item.unidad || "UN",
          })),
        },


        logs: {
          create: {
            usuarioId: currentUser.id || null,
            estado: "REGISTRADO",
            detalle: crearDetalleLog(
              currentUser,
              "registro ingreso de Materiales",
              `Remito: ${remitoProveedor || "-"}. Viaje: #${
                viaje.numeroViaje || "-"
              }. Tipo de unidad: ${mostrarTipoUnidadLogistica(
                tipoUnidadLogistica
              )}. Portero: ${
                portero?.NombreCompleto || "Sin portero informado"
              }. Items cargados: ${items.length}.${
                proveedorCargaManual || servicioCargaManual || itemsManuales > 0
                  ? " El ingreso contiene datos pendientes de aprobacion."
                  : ""
              }${
                detallesModoBusqueda.length
                  ? ` ${detallesModoBusqueda.join(" ")}`
                  : ""
              }`
            ),
          },
        },
      },
      include: {
        articulos: true,
        logs: true,
        registradoPor: true,
        tipoIngreso: true,
        categoriaFormulario: true,
        procedencia: true,
      },
    })
  },
  {
    maxWait: 10000,
    timeout: 20000,
  }
)

    let fotos = []

    try {
      const uploadRoot =
        process.env.UPLOADS_DIR ||
        path.join(/* turbopackIgnore: true */ process.cwd(), "uploads")
      const fotosParaGuardar = []
      const definicionesFotos = [
        {
          file: archivos.fotoCamionPatente,
          tipoFoto: "CAMION_PATENTE",
          nombreBase: "camion-patente",
        },
        {
          file: archivos.fotoMaterialCargado,
          tipoFoto: "MATERIAL_CARGADO",
          nombreBase: "material-cargado",
        },
        {
          file: archivos.fotoRemitoFisico,
          tipoFoto: "REMITO_FISICO",
          nombreBase: "remito-fisico",
        },
        {
          file: archivos.fotoAdicional,
          tipoFoto: "ADICIONAL",
          nombreBase: "adicional",
        },
      ]

      for (const definicion of definicionesFotos) {
        if (!esArchivoValido(definicion.file)) continue

        const foto = await guardarFotoIngreso({
          ...definicion,
          ingreso: ingresoCreado,
          uploadRoot,
        })

        fotosParaGuardar.push(foto)
      }

      if (fotosParaGuardar.length > 0) {
        await prisma.ingresoFoto.createMany({
          data: fotosParaGuardar,
        })

        fotos = await prisma.ingresoFoto.findMany({
          where: { ingresoId: ingresoCreado.id },
          orderBy: { id: "asc" },
        })
      }
    } catch (errorFotos) {
      console.error(
        "Error guardando fotos de ingreso de materiales:",
        errorFotos
      )

      return NextResponse.json(
        {
          ok: false,
          message:
            "El ingreso fue creado, pero ocurrio un error guardando las fotos",
          error: errorFotos.message,
          ingreso: ingresoCreado,
        },
        { status: 500 }
      )
    }

    const ingreso = await prisma.ingreso.findUnique({
      where: { id: ingresoCreado.id },
      include: {
        articulos: true,
        fotos: true,
        logs: true,
        registradoPor: true,
        tipoIngreso: true,
        categoriaFormulario: true,
        procedencia: true,
      },
    })

    return NextResponse.json({
      ok: true,
      message: "Ingreso de materiales guardado correctamente",
      ingreso,
      fotos,
    })
  } catch (error) {
    console.error("Error guardando ingreso de materiales:", error)

    return NextResponse.json(
      {
        ok: false,
        message: error.message || "Error guardando ingreso de materiales",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
