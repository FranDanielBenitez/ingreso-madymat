export const TIPOS_SERVICIO_LOGISTICO = ["FLETERO", "TRANSPORTE", "PROPIO"]

export function normalizarTipoServicioLogistico(value) {
  const texto = String(value || "").trim().toUpperCase()

  return TIPOS_SERVICIO_LOGISTICO.includes(texto) ? texto : null
}

export function esServicioPropio(value) {
  return normalizarTipoServicioLogistico(value) === "PROPIO"
}

export function mostrarTipoServicioLogistico(value) {
  const tipo = normalizarTipoServicioLogistico(value)

  if (tipo === "FLETERO") return "Fletero"
  if (tipo === "TRANSPORTE") return "Transporte"
  if (tipo === "PROPIO") return "Propio"

  return "-"
}
