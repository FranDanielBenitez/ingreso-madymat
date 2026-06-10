export const TIPOS_SERVICIO_LOGISTICO = ["PROPIO", "EXTERNO"]
export const TIPOS_SERVICIO_LOGISTICO_HISTORICOS = ["FLETERO", "TRANSPORTE"]

export function normalizarTipoServicioLogistico(value) {
  const texto = String(value || "").trim().toUpperCase()

  if (TIPOS_SERVICIO_LOGISTICO_HISTORICOS.includes(texto)) return "EXTERNO"

  return TIPOS_SERVICIO_LOGISTICO.includes(texto) ? texto : null
}

export function esServicioPropio(value) {
  return normalizarTipoServicioLogistico(value) === "PROPIO"
}

export function mostrarTipoServicioLogistico(value) {
  const tipo = normalizarTipoServicioLogistico(value)

  if (tipo === "PROPIO") return "Propio"
  if (tipo === "EXTERNO") return "Externo"

  return "-"
}
