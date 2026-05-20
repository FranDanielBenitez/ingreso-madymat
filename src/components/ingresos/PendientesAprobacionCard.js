"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  TIPOS_PENDIENTE,
  obtenerPendientesDetalle,
} from "@/lib/ingresos/pendientes"
import { canApprovePendientes } from "@/lib/auth/permissions"

function Badge({ children, variant = "warning" }) {
  const className =
    variant === "neutral"
      ? "border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
      : "border-amber-300/70 bg-amber-50/70 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100"

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  )
}

function campoKey(pendiente) {
  return pendiente.itemId
    ? `${pendiente.tipo}-${pendiente.itemId}`
    : pendiente.tipo
}

function endpointAprobacion(ingresoId, pendiente) {
  if (pendiente.tipo === TIPOS_PENDIENTE.PROVEEDOR) {
    return `/api/ingresos/${ingresoId}/aprobar-proveedor`
  }

  if (pendiente.tipo === TIPOS_PENDIENTE.SERVICIO) {
    return `/api/ingresos/${ingresoId}/aprobar-servicio`
  }

  if (pendiente.tipo === TIPOS_PENDIENTE.HACHADOR) {
    return `/api/ingresos/${ingresoId}/aprobar-hachador`
  }

  if (pendiente.tipo === TIPOS_PENDIENTE.ARTICULO) {
    return `/api/ingresos/${ingresoId}/items/${pendiente.itemId}/aprobar-articulo`
  }

  return null
}

function textoBoton(pendiente) {
  if (pendiente.tipo === TIPOS_PENDIENTE.PROVEEDOR) return "Aprobar proveedor"
  if (pendiente.tipo === TIPOS_PENDIENTE.SERVICIO) return "Aprobar servicio"
  if (pendiente.tipo === TIPOS_PENDIENTE.HACHADOR) return "Aprobar hachador"
  if (pendiente.tipo === TIPOS_PENDIENTE.ARTICULO) return "Aprobar articulo"

  return "Aprobar"
}

function descripcionPendiente(pendiente) {
  if (pendiente.tipo === TIPOS_PENDIENTE.ARTICULO) {
    return pendiente.descripcion
      ? `Articulo pendiente de aprobacion: ${pendiente.descripcion}`
      : "Articulo pendiente de aprobacion"
  }

  if (pendiente.tipo === TIPOS_PENDIENTE.FUERA_SUGERIDO) {
    return "Fuera de sugeridos pendiente de revision"
  }

  return pendiente.motivo
}

export default function PendientesAprobacionCard({ ingreso, onIngresoActualizado }) {
  const [usuario, setUsuario] = useState(null)
  const [observaciones, setObservaciones] = useState({})
  const [aprobandoKey, setAprobandoKey] = useState(null)

  const pendientes = useMemo(() => obtenerPendientesDetalle(ingreso), [ingreso])
  const puedeAprobar = canApprovePendientes(usuario)

  useEffect(() => {
    async function cargarUsuario() {
      try {
        const response = await fetch("/api/auth/me")
        const result = await response.json()

        if (response.ok && result.ok) {
          setUsuario(result.user)
        }
      } catch {
        setUsuario(null)
      }
    }

    cargarUsuario()
  }, [])

  function actualizarObservacion(key, value) {
    setObservaciones((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  async function aprobarPendiente(pendiente) {
    const key = campoKey(pendiente)
    const endpoint = endpointAprobacion(ingreso.id, pendiente)

    if (!endpoint) return

    try {
      setAprobandoKey(key)
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          observacion:
            observaciones[key]?.trim() || "Aprobado desde detalle de ingreso.",
        }),
      })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "No se pudo aprobar el pendiente")
      }

      onIngresoActualizado(result.ingreso)
      actualizarObservacion(key, "")
      toast.success(result.message || "Pendiente aprobado")
    } catch (error) {
      toast.error(error.message || "No se pudo aprobar el pendiente")
    } finally {
      setAprobandoKey(null)
    }
  }

  if (pendientes.length === 0) return null

  return (
    <section className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-6 shadow-sm dark:border-amber-400/25 dark:bg-slate-900/40">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A] dark:text-slate-100">
            Pendientes de aprobacion
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-medium text-[#475569] dark:text-slate-300">
            Este ingreso contiene datos cargados manualmente o fuera de sugeridos.
            Deben ser revisados por Pago a Proveedores antes de descargar
            documentacion FEX.
          </p>
        </div>
        <Badge>{pendientes.length} pendientes</Badge>
      </div>

      {!puedeAprobar ? (
        <p className="mt-4 rounded-xl border border-amber-200/70 bg-white/70 p-4 text-sm font-semibold text-amber-900 dark:border-amber-400/20 dark:bg-slate-800/60 dark:text-slate-200">
          Pendiente de revision por Pago a Proveedores.
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        {pendientes.map((pendiente) => {
          const key = campoKey(pendiente)
          const aprobando = aprobandoKey === key
          const endpoint = endpointAprobacion(ingreso?.id, pendiente)

          return (
            <div
              key={key}
              className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-800/60"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{pendiente.label}</Badge>
                    <Badge variant="neutral">Pendiente</Badge>
                  </div>
                  <p className="font-bold text-[#0F172A] dark:text-slate-100">
                    {descripcionPendiente(pendiente)}
                  </p>
                  {pendiente.tipo === TIPOS_PENDIENTE.FUERA_SUGERIDO ? (
                    <p className="text-sm text-[#475569] dark:text-slate-300">
                      Se regulariza al aprobar el dato manual o fuera de lista
                      asociado.
                    </p>
                  ) : null}
                </div>

                {puedeAprobar && endpoint ? (
                  <div className="w-full shrink-0 lg:w-80">
                    <textarea
                      value={observaciones[key] || ""}
                      onChange={(event) =>
                        actualizarObservacion(key, event.target.value)
                      }
                      className="min-h-16 w-full rounded-lg border border-[#CBD5E1] bg-white p-3 text-sm text-[#0F172A] outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-slate-600 dark:bg-slate-950/70 dark:text-slate-100"
                      placeholder="Observacion de aprobacion"
                    />
                    <button
                      type="button"
                      onClick={() => aprobarPendiente(pendiente)}
                      disabled={aprobando}
                      className="mt-2 inline-flex w-full justify-center rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition hover:border-emerald-500 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100 dark:hover:bg-emerald-400/15"
                    >
                      {aprobando ? "Aprobando..." : textoBoton(pendiente)}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
