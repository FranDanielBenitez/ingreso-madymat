import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

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
    "rollizos",
    anio,
    mes,
    `ingreso-${ingreso.id}`,
    nombreArchivo
  )
  const carpetaDestino = path.join(
    uploadRoot,
    "ingresos",
    "rollizos",
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
      where: { codigo: "ROLLIZOS" },
    })

    if (!tipoIngreso) {
      return NextResponse.json(
        {
          ok: false,
          message: "No existe el tipo de ingreso ROLLIZOS en PostgreSQL",
        },
        { status: 400 }
      )
    }

    const categoriaFormulario = await prisma.categoriaFormulario.findUnique({
      where: { codigo: "ROLLIZOS" },
    })

    if (!categoriaFormulario) {
      return NextResponse.json(
        {
          ok: false,
          message: "No existe la categoría ROLLIZOS en PostgreSQL",
        },
        { status: 400 }
      )
    }

    const procedenciaId = Number(body.procedenciaId)

    if (!Number.isInteger(procedenciaId) || procedenciaId <= 0) {
      return NextResponse.json(
        { ok: false, message: "La procedencia es obligatoria para Rollizos" },
        { status: 400 }
      )
    }

    const procedencia = await prisma.procedenciaDim.findFirst({
      where: {
        id: procedenciaId,
        activa: true,
      },
    })

    if (!procedencia) {
      return NextResponse.json(
        {
          ok: false,
          message: "La procedencia seleccionada no existe o no esta activa",
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
    const articuloCargaManual = Boolean(body.articuloCargaManual)
    const articulo = body.articuloSeleccionado
    const articuloManual = body.articuloManual || {}
    const articuloManualDescripcion = limpiarTexto(articuloManual.descripcion)
    const articuloManualCodigo = limpiarTexto(articuloManual.codigo)
    const articuloManualObservacion = limpiarTexto(articuloManual.observacion)
    const servicioCargaManual = Boolean(body.servicioCargaManual)
    const servicio = body.servicioSeleccionado
    const servicioManual = body.servicioManual || {}
    const servicioManualNombre = limpiarTexto(servicioManual.nombre)
    const servicioManualCuit = limpiarTexto(servicioManual.cuit)
    const servicioManualObservacion = limpiarTexto(servicioManual.observacion)
    const hachador = body.hachadorSeleccionado
    const chofer = body.choferSeleccionado
    const portero = body.porteroSeleccionado

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

    if (articuloCargaManual && !articuloManualDescripcion) {
      return NextResponse.json(
        { ok: false, message: "Debe indicar la descripcion del articulo manual" },
        { status: 400 }
      )
    }

    if (!articuloCargaManual && !articulo) {
      return NextResponse.json(
        { ok: false, message: "Debe seleccionar un artículo" },
        { status: 400 }
      )
    }

    const cantidadIngreso = normalizarDecimal(body.cantidad)
    const unidadIngreso = limpiarTexto(body.unidad)
    const fechaIngreso = body.fechaIngreso
      ? combinarFechaHora(body.fechaIngreso, body.horaIngreso)
      : null

    if (body.fechaIngreso && !fechaIngreso) {
      return NextResponse.json(
        {
          ok: false,
          message: "La fecha y hora de ingreso deben tener formato valido",
        },
        { status: 400 }
      )
    }

    if (!cantidadIngreso || cantidadIngreso <= 0) {
      return NextResponse.json(
        { ok: false, message: "La cantidad debe ser mayor a cero" },
        { status: 400 }
      )
    }

    if (!unidadIngreso) {
      return NextResponse.json(
        { ok: false, message: "La unidad es obligatoria" },
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

    const usuarioPortero = await obtenerUsuarioPortero(portero)
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

    if (!articuloCargaManual && body.articuloModoBusqueda === "TODOS") {
      detallesModoBusqueda.push("Articulo seleccionado desde modo Todos.")
    }

    if (articuloCargaManual) {
      detallesModoBusqueda.push(
        "Articulo cargado manualmente, pendiente de validar."
      )
      if (articuloManualObservacion) {
        detallesModoBusqueda.push(
          `Observacion articulo manual: ${articuloManualObservacion}.`
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

    if (body.hachadorModoBusqueda === "TODOS") {
      detallesModoBusqueda.push("Hachador seleccionado desde modo Todos.")
    }

    const ingreso = await prisma.ingreso.create({
      data: {
        fechaIngreso: fechaIngreso || new Date(),

        estado: "REGISTRADO",

        tipoIngresoId: tipoIngreso.id,
        categoriaFormularioId: categoriaFormulario.id,
        procedenciaId: procedencia.id,

        remitoProveedor: limpiarTexto(body.remitoProveedor),
        observaciones: limpiarTexto(body.observaciones),

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

        tipoChofer: body.tipoChofer || null,
        choferOrigenDato: body.tipoChofer === "INTERNO" ? "SJALA" : "MANUAL",
        choferLegajoSjala:
          body.tipoChofer === "INTERNO" && chofer?.Legajo
            ? Number(chofer.Legajo)
            : null,
        choferNombreCargado:
          body.tipoChofer === "INTERNO"
            ? limpiarTexto(chofer?.NombreCompleto)
            : limpiarTexto(body.choferNombreExterno),
        choferDocumentoCargado:
          body.tipoChofer === "EXTERNO"
            ? limpiarTexto(body.choferDocumentoExterno)
            : null,
        choferCargaManual: body.tipoChofer === "EXTERNO",
        choferLegajoValidado:
          body.tipoChofer === "INTERNO" && chofer?.Legajo
            ? Number(chofer.Legajo)
            : null,
        choferNombreValidado:
          body.tipoChofer === "INTERNO"
            ? limpiarTexto(chofer?.NombreCompleto)
            : null,
        choferValidado: body.tipoChofer === "INTERNO",

        patenteCamion: limpiarTexto(body.patenteCamion)?.toUpperCase(),
        patenteAcoplado: limpiarTexto(body.patenteAcoplado)?.toUpperCase(),

        hachadorAplica: true,
        hachadorOrigenDato: hachador ? "BEJERMAN" : null,
        hachadorCodigoBejerman: limpiarTexto(hachador?.Codigo),
        hachadorNombreCargado: limpiarTexto(hachador?.RazonSocial),
        hachadorCuitCargado: limpiarTexto(hachador?.CUIT),
        hachadorGrupoBejerman: limpiarTexto(hachador?.Grupo),
        hachadorSubgrupoBejerman: limpiarTexto(hachador?.SubGrupo),
        hachadorFueraSugerido: false,
        hachadorCargaManual: false,
        hachadorCodigoValidado: limpiarTexto(hachador?.Codigo),
        hachadorNombreValidado: limpiarTexto(hachador?.RazonSocial),
        hachadorCuitValidado: limpiarTexto(hachador?.CUIT),
        hachadorValidado: hachador ? true : false,

        tieneCargaManual:
          body.tipoChofer === "EXTERNO" ||
          proveedorCargaManual ||
          articuloCargaManual ||
          servicioCargaManual,
        tieneFueraSugerido:
          proveedorCargaManual || articuloCargaManual || servicioCargaManual,

        pdfGenerado: false,

        registradoPorId: usuarioPortero?.id || null,

        articulos: {
          create: {
            origenDato: articuloCargaManual ? "MANUAL" : "BEJERMAN",

            articuloGen: articuloCargaManual
              ? null
              : articulo.ArticuloGen
              ? String(articulo.ArticuloGen)
              : null,
            articuloCodigo: articuloCargaManual
              ? articuloManualCodigo
              : limpiarTexto(articulo.Codigo),
            articuloClase: articuloCargaManual
              ? null
              : limpiarTexto(articulo.Clase),
            articuloDescripcion: articuloCargaManual
              ? articuloManualDescripcion
              : limpiarTexto(articulo.Descripcion),
            articuloProceso: articuloCargaManual
              ? null
              : limpiarTexto(articulo.Proceso),
            articuloGrupo: articuloCargaManual
              ? null
              : limpiarTexto(articulo.Grupo),
            articuloSubgrupo: articuloCargaManual
              ? null
              : limpiarTexto(articulo.SubGrupo),

            categoriaFormulario: "ROLLIZOS",

            cantidad: cantidadIngreso,
            unidad: unidadIngreso,
          },
        },

        logs: {
          create: {
            usuarioId: usuarioPortero?.id || null,
            estado: "REGISTRADO",
            detalle: `Ingreso de rollizos registrado desde formulario web. Portero: ${
              portero?.NombreCompleto || "Sin portero informado"
            }${
              detallesModoBusqueda.length
                ? `. ${detallesModoBusqueda.join(" ")}`
                : ""
            }`,
          },
        },
      },
      include: {
        articulos: true,
        logs: true,
        registradoPor: true,
      },
    })

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
          ingreso,
          uploadRoot,
        })

        fotosParaGuardar.push(foto)
      }

      if (fotosParaGuardar.length > 0) {
        await prisma.ingresoFoto.createMany({
          data: fotosParaGuardar,
        })

        fotos = await prisma.ingresoFoto.findMany({
          where: { ingresoId: ingreso.id },
          orderBy: { id: "asc" },
        })
      }
    } catch (errorFotos) {
      console.error("Error guardando fotos de ingreso de rollizos:", errorFotos)

      return NextResponse.json(
        {
          ok: false,
          message:
            "El ingreso fue creado, pero ocurrio un error guardando las fotos",
          error: errorFotos.message,
          ingreso,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: "Ingreso de rollizos guardado correctamente",
      ingreso,
      fotos,
    })
  } catch (error) {
    console.error("Error guardando ingreso de rollizos:", error)

    return NextResponse.json(
      {
        ok: false,
        message: error.message || "Error guardando ingreso de rollizos",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
