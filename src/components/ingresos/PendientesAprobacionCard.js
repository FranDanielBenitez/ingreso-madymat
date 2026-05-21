"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import SearchableSelect from "@/components/forms/SearchableSelect"
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

function tituloPendiente(pendiente) {
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

function mostrar(value) {
  if (value === null || value === undefined || value === "") return "-"
  return String(value)
}

function itemPendiente(ingreso, pendiente) {
  if (pendiente.tipo !== TIPOS_PENDIENTE.ARTICULO) return null
  return (ingreso?.articulos || []).find((item) => item.id === pendiente.itemId) || null
}

function datosOriginales(ingreso, pendiente) {
  if (pendiente.tipo === TIPOS_PENDIENTE.PROVEEDOR) {
    return [
      ["Nombre", ingreso.proveedorNombreCargado],
      ["Codigo", ingreso.proveedorCodigoBejerman],
      ["CUIT", ingreso.proveedorCuitCargado],
    ]
  }

  if (pendiente.tipo === TIPOS_PENDIENTE.SERVICIO) {
    return [
      ["Nombre", ingreso.servicioNombreCargado],
      ["Codigo", ingreso.servicioCodigoBejerman],
      ["CUIT", ingreso.servicioCuitCargado],
    ]
  }

  if (pendiente.tipo === TIPOS_PENDIENTE.HACHADOR) {
    return [
      ["Nombre", ingreso.hachadorNombreCargado],
      ["Codigo", ingreso.hachadorCodigoBejerman],
      ["CUIT", ingreso.hachadorCuitCargado],
    ]
  }

  const item = itemPendiente(ingreso, pendiente)
  if (pendiente.tipo === TIPOS_PENDIENTE.ARTICULO && item) {
    return [
      ["Codigo", item.articuloCodigo],
      ["Descripcion", item.articuloDescripcion],
      ["Cantidad", `${mostrar(item.cantidad)} ${mostrar(item.unidad)}`],
    ]
  }

  return []
}

function esArticulo(pendiente) {
  return pendiente.tipo === TIPOS_PENDIENTE.ARTICULO
}

function dimensionKey(pendiente) {
  if (pendiente.tipo === TIPOS_PENDIENTE.ARTICULO) return "articulos"
  if (pendiente.tipo === TIPOS_PENDIENTE.SERVICIO) return "servicios"
  return "proveedores"
}

function selectedToDatoValidado(pendiente, selected) {
  if (!selected) return null

  if (esArticulo(pendiente)) {
    return {
      codigo: selected.Codigo || "",
      descripcion: selected.Descripcion || "",
    }
  }

  return {
    codigo: selected.Codigo || "",
    nombre: selected.RazonSocial || "",
    cuit: selected.CUIT || "",
  }
}

function manualToDatoValidado(pendiente, manual = {}) {
  if (esArticulo(pendiente)) {
    return {
      codigo: String(manual.codigo || "").trim(),
      descripcion: String(manual.descripcion || "").trim(),
    }
  }

  return {
    codigo: String(manual.codigo || "").trim(),
    nombre: String(manual.nombre || "").trim(),
    cuit: String(manual.cuit || "").trim(),
  }
}

function validarDatoValidado(pendiente, dato) {
  if (esArticulo(pendiente)) {
    return Boolean(dato?.descripcion)
  }

  return Boolean(dato?.nombre)
}

export default function PendientesAprobacionCard({ ingreso, onIngresoActualizado }) {
  const [usuario, setUsuario] = useState(null)
  const [observaciones, setObservaciones] = useState({})
  const [aprobandoKey, setAprobandoKey] = useState(null)
  const [manualMode, setManualMode] = useState({})
  const [manualValues, setManualValues] = useState({})
  const [selectedValues, setSelectedValues] = useState({})
  const [dimensiones, setDimensiones] = useState({
    proveedores: [],
    servicios: [],
    articulos: [],
  })
  const [loadingDimensiones, setLoadingDimensiones] = useState(false)

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

  useEffect(() => {
    if (!puedeAprobar || pendientes.length === 0) return

    async function cargarDimensiones() {
      setLoadingDimensiones(true)
      try {
        const [proveedores, servicios, articulos] = await Promise.all([
          fetch("/api/dimensiones/proveedores?modo=TODOS").then((res) =>
            res.json()
          ),
          fetch("/api/dimensiones/servicios-logisticos?modo=TODOS").then((res) =>
            res.json()
          ),
          fetch("/api/dimensiones/articulos?modo=TODOS").then((res) =>
            res.json()
          ),
        ])

        setDimensiones({
          proveedores: proveedores?.ok ? proveedores.data || [] : [],
          servicios: servicios?.ok ? servicios.data || [] : [],
          articulos: articulos?.ok ? articulos.data || [] : [],
        })
      } catch {
        toast.error("No se pudieron cargar datos de Bejerman para aprobacion")
      } finally {
        setLoadingDimensiones(false)
      }
    }

    cargarDimensiones()
  }, [pendientes.length, puedeAprobar])

  function actualizarObservacion(key, value) {
    setObservaciones((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  function actualizarManualValue(key, field, value) {
    setManualValues((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: value,
      },
    }))
  }

  function datoValidadoPara(key, pendiente) {
    if (manualMode[key]) {
      return manualToDatoValidado(pendiente, manualValues[key])
    }

    return selectedToDatoValidado(pendiente, selectedValues[key])
  }

  async function aprobarPendiente(pendiente) {
    const key = campoKey(pendiente)
    const endpoint = endpointAprobacion(ingreso.id, pendiente)
    const datoValidado = datoValidadoPara(key, pendiente)

    if (!endpoint) return

    if (!validarDatoValidado(pendiente, datoValidado)) {
      toast.error("Debe indicar el dato validado antes de aprobar")
      return
    }

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
          datoValidado,
        }),
      })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "No se pudo aprobar el pendiente")
      }

      onIngresoActualizado(result.ingreso)
      actualizarObservacion(key, "")
      setSelectedValues((prev) => ({ ...prev, [key]: null }))
      setManualValues((prev) => ({ ...prev, [key]: {} }))
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
        <p className="mt-4 rounded-xl border border-amber-200/70 bg-white/80 p-4 text-sm font-semibold text-amber-900 dark:border-amber-400/20 dark:bg-slate-800/60 dark:text-slate-200">
          Pendiente de revision por Pago a Proveedores.
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        {pendientes.map((pendiente) => {
          const key = campoKey(pendiente)
          const aprobando = aprobandoKey === key
          const endpoint = endpointAprobacion(ingreso?.id, pendiente)
          const opciones = dimensiones[dimensionKey(pendiente)] || []
          const datoValidado = datoValidadoPara(key, pendiente)

          return (
            <div
              key={key}
              className="rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-800/60"
            >
              <div className="flex flex-col gap-4">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{pendiente.label}</Badge>
                    <Badge variant="neutral">Pendiente</Badge>
                  </div>
                  <p className="font-bold text-[#0F172A] dark:text-slate-100">
                    {tituloPendiente(pendiente)}
                  </p>
                  {pendiente.tipo === TIPOS_PENDIENTE.FUERA_SUGERIDO ? (
                    <p className="text-sm text-[#475569] dark:text-slate-300">
                      Se regulariza al aprobar el dato manual o fuera de lista
                      asociado.
                    </p>
                  ) : null}
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
                  <p className="text-xs font-bold uppercase text-[#475569] dark:text-slate-300">
                    Cargado por Porteria
                  </p>
                  <div className="mt-2 grid gap-2 text-sm text-[#0F172A] sm:grid-cols-3 dark:text-slate-100">
                    {datosOriginales(ingreso, pendiente).map(([label, value]) => (
                      <p key={label}>
                        <span className="font-semibold">{label}:</span>{" "}
                        {mostrar(value)}
                      </p>
                    ))}
                  </div>
                </div>

                {puedeAprobar && endpoint ? (
                  <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/60">
                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-bold text-[#0F172A] dark:text-slate-100">
                        Dato validado
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setManualMode((prev) => ({
                            ...prev,
                            [key]: !prev[key],
                          }))
                        }
                        className="w-fit text-sm font-semibold text-amber-800 hover:text-amber-900 dark:text-amber-200 dark:hover:text-amber-100"
                      >
                        {manualMode[key]
                          ? "Buscar en Bejerman"
                          : "Cargar dato validado manualmente"}
                      </button>
                    </div>

                    {manualMode[key] ? (
                      <div className="grid gap-3 md:grid-cols-3">
                        <label>
                          <span className="mb-1 block text-sm font-semibold text-[#0F172A] dark:text-slate-100">
                            Codigo validado
                          </span>
                          <input
                            value={manualValues[key]?.codigo || ""}
                            onChange={(event) =>
                              actualizarManualValue(
                                key,
                                "codigo",
                                event.target.value
                              )
                            }
                            className="w-full rounded-lg border border-[#CBD5E1] bg-white p-3 text-sm text-[#0F172A] outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-slate-600 dark:bg-slate-950/70 dark:text-slate-100"
                          />
                        </label>
                        <label className="md:col-span-2">
                          <span className="mb-1 block text-sm font-semibold text-[#0F172A] dark:text-slate-100">
                            {esArticulo(pendiente)
                              ? "Descripcion validada *"
                              : "Razon social validada *"}
                          </span>
                          <input
                            value={
                              esArticulo(pendiente)
                                ? manualValues[key]?.descripcion || ""
                                : manualValues[key]?.nombre || ""
                            }
                            onChange={(event) =>
                              actualizarManualValue(
                                key,
                                esArticulo(pendiente) ? "descripcion" : "nombre",
                                event.target.value
                              )
                            }
                            className="w-full rounded-lg border border-[#CBD5E1] bg-white p-3 text-sm text-[#0F172A] outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-slate-600 dark:bg-slate-950/70 dark:text-slate-100"
                          />
                        </label>
                        {!esArticulo(pendiente) ? (
                          <label>
                            <span className="mb-1 block text-sm font-semibold text-[#0F172A] dark:text-slate-100">
                              CUIT validado
                            </span>
                            <input
                              value={manualValues[key]?.cuit || ""}
                              onChange={(event) =>
                                actualizarManualValue(
                                  key,
                                  "cuit",
                                  event.target.value
                                )
                              }
                              className="w-full rounded-lg border border-[#CBD5E1] bg-white p-3 text-sm text-[#0F172A] outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-slate-600 dark:bg-slate-950/70 dark:text-slate-100"
                            />
                          </label>
                        ) : null}
                      </div>
                    ) : (
                      <>
                        <SearchableSelect
                          label=""
                          value={
                            selectedValues[key]
                              ? esArticulo(pendiente)
                                ? selectedValues[key].Codigo
                                : selectedValues[key].Codigo
                              : ""
                          }
                          options={opciones}
                          onChange={(item) =>
                            setSelectedValues((prev) => ({
                              ...prev,
                              [key]: item,
                            }))
                          }
                          getOptionValue={(item) => item.Codigo}
                          getOptionLabel={(item) =>
                            esArticulo(pendiente)
                              ? `${item.Codigo || "-"} - ${item.Descripcion || "-"}`
                              : `${item.Codigo || "-"} - ${item.RazonSocial || "-"}`
                          }
                          getSearchText={(item) =>
                            esArticulo(pendiente)
                              ? `${item.Codigo || ""} ${item.Descripcion || ""}`
                              : `${item.Codigo || ""} ${item.RazonSocial || ""} ${
                                  item.CUIT || ""
                                }`
                          }
                          placeholder={
                            esArticulo(pendiente)
                              ? "Buscar articulo validado en Bejerman"
                              : "Buscar dato validado en Bejerman"
                          }
                          loading={loadingDimensiones}
                        />
                        {datoValidado ? (
                          <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-100">
                            Seleccionado:{" "}
                            {esArticulo(pendiente)
                              ? `${mostrar(datoValidado.codigo)} - ${mostrar(
                                  datoValidado.descripcion
                                )}`
                              : `${mostrar(datoValidado.codigo)} - ${mostrar(
                                  datoValidado.nombre
                                )} - CUIT ${mostrar(datoValidado.cuit)}`}
                          </p>
                        ) : null}
                      </>
                    )}

                    <label className="mt-3 block">
                      <span className="mb-1 block text-sm font-semibold text-[#0F172A] dark:text-slate-100">
                        Observacion
                      </span>
                      <textarea
                        value={observaciones[key] || ""}
                        onChange={(event) =>
                          actualizarObservacion(key, event.target.value)
                        }
                        className="min-h-16 w-full rounded-lg border border-[#CBD5E1] bg-white p-3 text-sm text-[#0F172A] outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-slate-600 dark:bg-slate-950/70 dark:text-slate-100"
                        placeholder="Observacion de aprobacion"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => aprobarPendiente(pendiente)}
                      disabled={aprobando}
                      className="mt-2 inline-flex w-full justify-center rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 transition hover:border-emerald-500 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100 dark:hover:bg-emerald-400/15 sm:w-auto"
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
