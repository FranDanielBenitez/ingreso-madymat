export const TIPOS_UNIDAD_LOGISTICA = ["CHASIS", "EQUIPO"]

export function normalizarTipoUnidadLogistica(value) {
  const texto = String(value || "").trim().toUpperCase()

  return TIPOS_UNIDAD_LOGISTICA.includes(texto) ? texto : null
}

export function mostrarTipoUnidadLogistica(value) {
  const tipo = normalizarTipoUnidadLogistica(value)

  if (tipo === "CHASIS") return "Chasis"
  if (tipo === "EQUIPO") return "Equipo"

  return "-"
}
