import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { canApprovePendientes } from "@/lib/auth/permissions"
import { flagsPendientesReales } from "@/lib/ingresos/pendientes"

export const INCLUDE_INGRESO_APROBACION = {
  articulos: {
    orderBy: {
      id: "asc",
    },
  },
  fotos: true,
  logs: {
    orderBy: {
      id: "asc",
    },
  },
  registradoPor: true,
  tipoIngreso: true,
  categoriaFormulario: true,
  procedencia: true,
}

export function jsonError(message, status = 400) {
  return NextResponse.json({ ok: false, message }, { status })
}

export function limpiarObservacion(value) {
  const texto = String(value || "").trim()
  return texto || null
}

export async function validarUsuarioAprobador() {
  const usuario = await getCurrentUser()

  if (!usuario) {
    return {
      error: jsonError("Usuario logueado obligatorio", 401),
    }
  }

  if (!canApprovePendientes(usuario)) {
    return {
      error: jsonError("No tiene permiso para aprobar pendientes", 403),
    }
  }

  return { usuario }
}

export function nombreUsuario(usuario) {
  return usuario?.nombre || usuario?.usuario || usuario?.email || "usuario"
}

export async function obtenerIngresoParaAprobacion(tx, id) {
  return tx.ingreso.findUnique({
    where: { id },
    include: INCLUDE_INGRESO_APROBACION,
  })
}

export async function actualizarFlagsPendientes(tx, id) {
  const ingreso = await obtenerIngresoParaAprobacion(tx, id)
  const flags = flagsPendientesReales(ingreso)

  await tx.ingreso.update({
    where: { id },
    data: flags,
  })

  return obtenerIngresoParaAprobacion(tx, id)
}

export function validarIdIngreso(value) {
  const id = Number(value)

  return Number.isInteger(id) && id > 0 ? id : null
}

export function observacionLog(observacion) {
  return observacion ? ` Observacion: ${observacion}.` : ""
}
