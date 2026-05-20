export function calcularPeriodoViaje(fechaIngreso) {
  if (!fechaIngreso) return null

  const fecha =
    typeof fechaIngreso === "string"
      ? new Date(fechaIngreso)
      : fechaIngreso instanceof Date
      ? fechaIngreso
      : null

  if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) {
    return null
  }

  const year = fecha.getFullYear()
  const month = String(fecha.getMonth() + 1).padStart(2, "0")

  return `${year}-${month}`
}

export async function obtenerSiguienteNumeroViaje(
  tx,
  fechaIngreso,
  tipoIngresoId
) {
  const periodoViaje = calcularPeriodoViaje(fechaIngreso)

  if (!periodoViaje) {
    throw new Error("Fecha de ingreso invalida para calcular numero de viaje")
  }

  const resultado = await tx.ingreso.aggregate({
    _max: {
      numeroViaje: true,
    },
    where: {
      tipoIngresoId,
      periodoViaje,
    },
  })

  const maxNumero = resultado._max.numeroViaje || 0
  const numeroViaje = maxNumero + 1

  return { numeroViaje, periodoViaje }
}
