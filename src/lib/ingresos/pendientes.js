export const TIPOS_PENDIENTE = {
  PROVEEDOR: "proveedor",
  SERVICIO: "servicio",
  ARTICULO: "articulo",
  HACHADOR: "hachador",
  FUERA_SUGERIDO: "fueraSugerido",
}

function esServicioPropio(ingreso) {
  return String(ingreso?.tipoServicioLogistico || "").toUpperCase() === "PROPIO"
}

const MOTIVOS = {
  [TIPOS_PENDIENTE.PROVEEDOR]: "Proveedor pendiente de aprobacion",
  [TIPOS_PENDIENTE.SERVICIO]: "Servicio logistico pendiente de aprobacion",
  [TIPOS_PENDIENTE.ARTICULO]: "Articulo pendiente de aprobacion",
  [TIPOS_PENDIENTE.HACHADOR]: "Hachador pendiente de aprobacion",
  [TIPOS_PENDIENTE.FUERA_SUGERIDO]:
    "Dato fuera de sugeridos pendiente de aprobacion",
}

function estaAprobado(value) {
  return value === true
}

function tieneDatoManualORevision({ cargaManual, fueraSugerido, origenDato }) {
  return (
    cargaManual === true ||
    fueraSugerido === true ||
    String(origenDato || "").toUpperCase() === "MANUAL"
  )
}

function detalleLog(log) {
  return String(log?.detalle || "")
}

export function articuloManualAprobado(ingreso, articulo) {
  if (!articulo) return false

  if (articulo.articuloValidado === true) {
    return true
  }

  if (String(articulo.origenDato || "").toUpperCase() === "MANUAL_VALIDADO") {
    return true
  }

  const marcador = `Item #${articulo.id}`

  return (ingreso?.logs || []).some(
    (log) =>
      log?.estado === "ARTICULO_APROBADO" &&
      detalleLog(log).includes(marcador)
  )
}

export function obtenerPendientesDetalle(ingreso) {
  if (!ingreso) return []

  const pendientes = []

  if (
    tieneDatoManualORevision({
      cargaManual: ingreso.proveedorCargaManual,
      fueraSugerido: ingreso.proveedorFueraSugerido,
      origenDato: ingreso.proveedorOrigenDato,
    }) &&
    !estaAprobado(ingreso.proveedorValidado)
  ) {
    pendientes.push({
      tipo: TIPOS_PENDIENTE.PROVEEDOR,
      motivo: MOTIVOS[TIPOS_PENDIENTE.PROVEEDOR],
      label: "Proveedor pendiente",
    })
  }

  if (
    !esServicioPropio(ingreso) &&
    tieneDatoManualORevision({
      cargaManual: ingreso.servicioCargaManual,
      fueraSugerido: ingreso.servicioFueraSugerido,
      origenDato: ingreso.servicioOrigenDato,
    }) &&
    !estaAprobado(ingreso.servicioValidado)
  ) {
    pendientes.push({
      tipo: TIPOS_PENDIENTE.SERVICIO,
      motivo: MOTIVOS[TIPOS_PENDIENTE.SERVICIO],
      label: "Servicio pendiente",
    })
  }

  for (const articulo of ingreso.articulos || []) {
    if (
      String(articulo.origenDato || "").toUpperCase() === "MANUAL" &&
      !articuloManualAprobado(ingreso, articulo)
    ) {
      pendientes.push({
        tipo: TIPOS_PENDIENTE.ARTICULO,
        motivo: MOTIVOS[TIPOS_PENDIENTE.ARTICULO],
        label: "Articulo pendiente",
        itemId: articulo.id,
        descripcion: articulo.articuloDescripcion,
      })
    }
  }

  if (
    ingreso.hachadorAplica === true &&
    tieneDatoManualORevision({
      cargaManual: ingreso.hachadorCargaManual,
      fueraSugerido: ingreso.hachadorFueraSugerido,
      origenDato: ingreso.hachadorOrigenDato,
    }) &&
    !estaAprobado(ingreso.hachadorValidado)
  ) {
    pendientes.push({
      tipo: TIPOS_PENDIENTE.HACHADOR,
      motivo: MOTIVOS[TIPOS_PENDIENTE.HACHADOR],
      label: "Hachador pendiente",
    })
  }

  const hayFueraSugeridoPendiente = pendientes.some((pendiente) =>
    [TIPOS_PENDIENTE.PROVEEDOR, TIPOS_PENDIENTE.SERVICIO, TIPOS_PENDIENTE.HACHADOR].includes(
      pendiente.tipo
    )
  )

  if (ingreso.tieneFueraSugerido === true && hayFueraSugeridoPendiente) {
    pendientes.push({
      tipo: TIPOS_PENDIENTE.FUERA_SUGERIDO,
      motivo: MOTIVOS[TIPOS_PENDIENTE.FUERA_SUGERIDO],
      label: "Fuera de sugeridos",
    })
  }

  return pendientes
}

export function obtenerMotivosPendientes(ingreso) {
  return [
    ...new Set(obtenerPendientesDetalle(ingreso).map((pendiente) => pendiente.motivo)),
  ]
}

export function tienePendientesSinAprobar(ingreso) {
  return obtenerPendientesDetalle(ingreso).length > 0
}

export function flagsPendientesReales(ingreso) {
  const pendientes = obtenerPendientesDetalle(ingreso)

  return {
    tieneCargaManual: pendientes.some((pendiente) =>
      [
        TIPOS_PENDIENTE.PROVEEDOR,
        TIPOS_PENDIENTE.SERVICIO,
        TIPOS_PENDIENTE.ARTICULO,
        TIPOS_PENDIENTE.HACHADOR,
      ].includes(pendiente.tipo)
    ),
    tieneFueraSugerido: pendientes.some(
      (pendiente) => pendiente.tipo === TIPOS_PENDIENTE.FUERA_SUGERIDO
    ),
  }
}
