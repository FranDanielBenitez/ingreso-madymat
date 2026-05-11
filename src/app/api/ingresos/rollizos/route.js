import { NextResponse } from "next/server"
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
    const body = await request.json()

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

    const proveedor = body.proveedorSeleccionado
    const articulo = body.articuloSeleccionado
    const servicio = body.servicioSeleccionado
    const hachador = body.hachadorSeleccionado
    const chofer = body.choferSeleccionado
    const portero = body.porteroSeleccionado

    if (!proveedor) {
      return NextResponse.json(
        { ok: false, message: "Debe seleccionar un proveedor" },
        { status: 400 }
      )
    }

    if (!articulo) {
      return NextResponse.json(
        { ok: false, message: "Debe seleccionar un artículo" },
        { status: 400 }
      )
    }

    const usuarioPortero = await obtenerUsuarioPortero(portero)

    const ingreso = await prisma.ingreso.create({
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

        tieneCargaManual: body.tipoChofer === "EXTERNO",
        tieneFueraSugerido: false,

        pdfGenerado: false,

        registradoPorId: usuarioPortero?.id || null,

        articulos: {
          create: {
            origenDato: "BEJERMAN",

            articuloGen: articulo.ArticuloGen
              ? String(articulo.ArticuloGen)
              : null,
            articuloCodigo: limpiarTexto(articulo.Codigo),
            articuloClase: limpiarTexto(articulo.Clase),
            articuloDescripcion: limpiarTexto(articulo.Descripcion),
            articuloProceso: limpiarTexto(articulo.Proceso),
            articuloGrupo: limpiarTexto(articulo.Grupo),
            articuloSubgrupo: limpiarTexto(articulo.SubGrupo),

            categoriaFormulario: "ROLLIZOS",

            cantidad: normalizarDecimal(body.cantidad),
            unidad: limpiarTexto(body.unidad) || "TN",
          },
        },

        logs: {
          create: {
            usuarioId: usuarioPortero?.id || null,
            estado: "REGISTRADO",
            detalle: `Ingreso de rollizos registrado desde formulario web. Portero: ${
              portero?.NombreCompleto || "Sin portero informado"
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

    return NextResponse.json({
      ok: true,
      message: "Ingreso de rollizos guardado correctamente",
      ingreso,
    })
  } catch (error) {
    console.error("Error guardando ingreso de rollizos:", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Error guardando ingreso de rollizos",
        error: error.message,
      },
      { status: 500 }
    )
  }
}