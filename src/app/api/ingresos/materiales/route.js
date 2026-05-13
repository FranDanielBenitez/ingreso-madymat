import { NextResponse } from "next/server"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { prisma } from "@/lib/prisma"

function normalizarDecimal(value) {
  if (value === null || value === undefined || value === "") return 0

  const texto = String(value).replace(",", ".")
  const numero = Number(texto)

  if (Number.isNaN(numero)) return 0

  return numero
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
    articulo: item.articuloSeleccionado,
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

    const proveedor = body.proveedorSeleccionado
    const items = prepararItemsValidos(body)
    const servicio = body.servicioSeleccionado
    const chofer = body.choferSeleccionado
    const portero = body.porteroSeleccionado

    if (!proveedor) {
      return NextResponse.json(
        { ok: false, message: "Debe seleccionar un proveedor" },
        { status: 400 }
      )
    }

    const itemsInvalidos =
      items.length === 0 ||
      items.some(
        (item) =>
          !item.categoriaMaterial ||
          !item.articulo ||
          !item.cantidad ||
          item.cantidad <= 0 ||
          !item.unidad
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

    if (body.proveedorModoBusqueda === "TODOS") {
      detallesModoBusqueda.push("Proveedor seleccionado desde modo Todos.")
    }

    if (body.servicioModoBusqueda === "TODOS") {
      detallesModoBusqueda.push(
        "Servicio logistico seleccionado desde modo Todos."
      )
    }

    const itemsModoTodos = items.filter(
      (item) => item.modoBusquedaArticulo === "TODOS"
    ).length

    if (itemsModoTodos > 0) {
      detallesModoBusqueda.push(`Items fuera de sugeridos: ${itemsModoTodos}.`)
    }

    const ingresoCreado = await prisma.ingreso.create({
      data: {
        fechaIngreso: body.fechaIngreso
          ? new Date(body.fechaIngreso)
          : new Date(),

        estado: "REGISTRADO",

        tipoIngresoId: tipoIngreso.id,
        categoriaFormularioId: categoriaFormulario.id,

        remitoProveedor: limpiarTexto(body.remitoProveedor),
        observaciones: limpiarTexto(body.observaciones),

        proveedorOrigenDato: "BEJERMAN",
        proveedorCodigoBejerman: limpiarTexto(proveedor.Codigo),
        proveedorNombreCargado: proveedor.RazonSocial,
        proveedorCuitCargado: limpiarTexto(proveedor.CUIT),
        proveedorGrupoBejerman: limpiarTexto(proveedor.Grupo),
        proveedorSubgrupoBejerman: limpiarTexto(proveedor.SubGrupo),
        proveedorFueraSugerido: false,
        proveedorCargaManual: false,
        proveedorCodigoValidado: limpiarTexto(proveedor.Codigo),
        proveedorNombreValidado: proveedor.RazonSocial,
        proveedorCuitValidado: limpiarTexto(proveedor.CUIT),
        proveedorValidado: true,

        tipoServicioLogistico: body.tipoServicio || null,

        servicioOrigenDato: servicio ? "BEJERMAN" : null,
        servicioCodigoBejerman: limpiarTexto(servicio?.Codigo),
        servicioNombreCargado: limpiarTexto(servicio?.RazonSocial),
        servicioCuitCargado: limpiarTexto(servicio?.CUIT),
        servicioGrupoBejerman: limpiarTexto(servicio?.Grupo),
        servicioSubgrupoBejerman: limpiarTexto(servicio?.SubGrupo),
        servicioFueraSugerido: false,
        servicioCargaManual: false,
        servicioCodigoValidado: limpiarTexto(servicio?.Codigo),
        servicioNombreValidado: limpiarTexto(servicio?.RazonSocial),
        servicioCuitValidado: limpiarTexto(servicio?.CUIT),
        servicioValidado: servicio ? true : false,

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

        tieneCargaManual: choferExterno,
        tieneFueraSugerido: false,

        pdfGenerado: false,

        registradoPorId: usuarioPortero?.id || null,

        articulos: {
          create: items.map((item) => ({
            origenDato: "BEJERMAN",

            articuloGen: item.articulo.ArticuloGen
              ? String(item.articulo.ArticuloGen)
              : null,
            articuloCodigo: limpiarTexto(item.articulo.Codigo),
            articuloClase: limpiarTexto(item.articulo.Clase),
            articuloDescripcion: limpiarTexto(item.articulo.Descripcion),
            articuloProceso: limpiarTexto(item.articulo.Proceso),
            articuloGrupo: limpiarTexto(item.articulo.Grupo),
            articuloSubgrupo: limpiarTexto(item.articulo.SubGrupo),

            categoriaFormulario: item.categoriaMaterial,

            cantidad: item.cantidad,
            unidad: item.unidad || "UN",
          })),
        },

        logs: {
          create: {
            usuarioId: usuarioPortero?.id || null,
            estado: "REGISTRADO",
            detalle: `Ingreso de materiales registrado desde formulario web. Portero: ${
              portero?.NombreCompleto || "Sin portero informado"
            }. Items cargados: ${items.length}${
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
        tipoIngreso: true,
        categoriaFormulario: true,
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
