"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

const SECTION_CLASS =
  "rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm shadow-slate-200/70"

function formatearFecha(value) {
  if (!value) return "-"

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
  }).format(new Date(value))
}

function mostrar(value) {
  if (value === null || value === undefined || value === "") return "-"

  return String(value)
}

function articuloPrincipal(registro) {
  return registro.articulos?.[0] || null
}

function descripcionArticulos(registro) {
  const total = registro.articulos?.length || 0
  if (total > 1) return `${total} items`

  return articuloPrincipal(registro)?.articuloDescripcion
}

function incluyeTexto(valor, termino) {
  if (!termino) return true
  return String(valor || "").toLowerCase().includes(termino.toLowerCase())
}

function matchesMotivo(registro, motivo) {
  if (!motivo || motivo === "Todos") return true

  const articulosManuales = (registro.articulos || []).some(
    (articulo) => articulo.origenDato === "MANUAL"
  )

  if (motivo === "Proveedor manual") return registro.proveedorCargaManual === true
  if (motivo === "Servicio manual") return registro.servicioCargaManual === true
  if (motivo === "Artículo manual") return articulosManuales
  if (motivo === "Fuera de sugeridos") return registro.tieneFueraSugerido === true

  if (motivo === "Pendiente validar") {
    return (
      registro.proveedorValidado === false ||
      registro.servicioValidado === false ||
      registro.tieneCargaManual === true
    )
  }

  return true
}

function detalleHref(registro) {
  if (registro.tipoIngreso?.codigo === "ROLLIZOS") {
    return `/ingresos/rollizos/${registro.id}`
  }

  if (registro.tipoIngreso?.codigo === "MATERIALES") {
    return `/ingresos/materiales/${registro.id}`
  }

  return null
}

function EstadoBadge({ estado }) {
  const anulado = estado === "ANULADO"

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${
        anulado
          ? "border-red-200 bg-red-50 text-[#DC2626]"
          : estado === "REGISTRADO"
            ? "border-green-200 bg-green-50 text-[#16A34A]"
            : "border-slate-300 bg-slate-50 text-[#475569]"
      }`}
    >
      {estado}
    </span>
  )
}

function MotivoBadge({ children, variant = "amber" }) {
  const className =
    variant === "neutral"
      ? "border-slate-300 bg-white/70 text-[#475569] dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200"
      : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200"

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  )
}

function motivosPendientes(registro) {
  const motivos = []
  const articulosManuales = (registro.articulos || []).some(
    (articulo) => articulo.origenDato === "MANUAL"
  )

  if (registro.proveedorCargaManual) motivos.push("Proveedor manual")
  if (registro.servicioCargaManual) motivos.push("Servicio manual")
  if (articulosManuales) motivos.push("Artículo manual")
  if (registro.tieneFueraSugerido) motivos.push("Fuera de sugeridos")

  if (!registro.proveedorValidado || !registro.servicioValidado) {
    motivos.push("Pendiente validar")
  }

  if (motivos.length === 0 && registro.tieneCargaManual) {
    motivos.push("Carga manual")
  }

  return [...new Set(motivos)]
}

const DEFAULT_FILTROS = {
  tipo: "Todos",
  estado: "Todos",
  motivo: "Todos",
  proveedor: "",
  remito: "",
  fechaDesde: "",
  fechaHasta: "",
}

export default function PendientesValidacionPage() {
  const [registros, setRegistros] = useState([])
  const [filterValues, setFilterValues] = useState(DEFAULT_FILTROS)
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTROS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const filteredRegistros = useMemo(() => {
    return registros.filter((registro) => {
      if (
        appliedFilters.tipo !== "Todos" &&
        registro.tipoIngreso?.codigo !== appliedFilters.tipo
      ) {
        return false
      }

      if (
        appliedFilters.estado !== "Todos" &&
        registro.estado !== appliedFilters.estado
      ) {
        return false
      }

      if (
        !incluyeTexto(
          registro.proveedorNombreCargado,
          appliedFilters.proveedor
        )
      ) {
        return false
      }

      if (!incluyeTexto(registro.remitoProveedor, appliedFilters.remito)) {
        return false
      }

      if (appliedFilters.fechaDesde) {
        const desde = new Date(appliedFilters.fechaDesde)
        const ingreso = new Date(registro.fechaIngreso)
        if (ingreso < desde) return false
      }

      if (appliedFilters.fechaHasta) {
        const hasta = new Date(appliedFilters.fechaHasta)
        const ingreso = new Date(registro.fechaIngreso)
        if (ingreso > hasta) return false
      }

      if (!matchesMotivo(registro, appliedFilters.motivo)) {
        return false
      }

      return true
    })
  }, [registros, appliedFilters])

  const totalFotos = useMemo(
    () => filteredRegistros.reduce((acc, item) => acc + (item.fotos?.length || 0), 0),
    [filteredRegistros]
  )

  useEffect(() => {
    async function cargarPendientes() {
      setLoading(true)
      setError("")

      try {
        const response = await fetch("/api/registros/pendientes-validacion")
        const result = await response.json()

        if (!response.ok || !result.ok) {
          throw new Error(
            result.message || "No se pudieron cargar los pendientes"
          )
        }

        setRegistros(result.registros || [])
      } catch (err) {
        setError(err.message || "No se pudieron cargar los pendientes")
      } finally {
        setLoading(false)
      }
    }

    cargarPendientes()
  }, [])

  return (
    <main className="min-h-screen bg-[#F5F7FA] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className={SECTION_CLASS}>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-amber-700">
                Validacion
              </p>
              <h1 className="mt-1 text-3xl font-black text-[#0F172A]">
                Pendientes de validacion
              </h1>
              <p className="mt-2 max-w-3xl text-[#475569]">
                Ingresos con datos cargados manualmente o fuera de sugeridos.
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
              {filteredRegistros.length} pendientes · {totalFotos} fotos
            </div>
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Filtros
              </p>
              <h2 className="mt-2 text-xl font-bold text-[#0F172A]">
                Refina los pendientes
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <label className="block text-sm font-semibold text-slate-700">
                Tipo de ingreso
                <select
                  value={filterValues.tipo}
                  onChange={(event) =>
                    setFilterValues({ ...filterValues, tipo: event.target.value })
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200/70"
                >
                  <option>Todos</option>
                  <option>ROLLIZOS</option>
                  <option>MATERIALES</option>
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Estado
                <select
                  value={filterValues.estado}
                  onChange={(event) =>
                    setFilterValues({ ...filterValues, estado: event.target.value })
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200/70"
                >
                  <option>Todos</option>
                  <option>REGISTRADO</option>
                  <option>ANULADO</option>
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Motivo pendiente
                <select
                  value={filterValues.motivo}
                  onChange={(event) =>
                    setFilterValues({ ...filterValues, motivo: event.target.value })
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200/70"
                >
                  <option>Todos</option>
                  <option>Proveedor manual</option>
                  <option>Servicio manual</option>
                  <option>Artículo manual</option>
                  <option>Fuera de sugeridos</option>
                  <option>Pendiente validar</option>
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Proveedor
                <input
                  value={filterValues.proveedor}
                  onChange={(event) =>
                    setFilterValues({ ...filterValues, proveedor: event.target.value })
                  }
                  placeholder="Buscar proveedor"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200/70"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Remito
                <input
                  value={filterValues.remito}
                  onChange={(event) =>
                    setFilterValues({ ...filterValues, remito: event.target.value })
                  }
                  placeholder="Buscar remito"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200/70"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Fecha desde
                <input
                  type="date"
                  value={filterValues.fechaDesde}
                  onChange={(event) =>
                    setFilterValues({ ...filterValues, fechaDesde: event.target.value })
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200/70"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Fecha hasta
                <input
                  type="date"
                  value={filterValues.fechaHasta}
                  onChange={(event) =>
                    setFilterValues({ ...filterValues, fechaHasta: event.target.value })
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200/70"
                />
              </label>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                {filteredRegistros.length} pendientes filtrados
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setAppliedFilters(filterValues)}
                  className="inline-flex items-center justify-center rounded-2xl bg-[#F3171B] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#D90F14]"
                >
                  Buscar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterValues(DEFAULT_FILTROS)
                    setAppliedFilters(DEFAULT_FILTROS)
                  }}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          </div>
          {loading ? (
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">
                Cargando pendientes...
              </h2>
              <p className="mt-2 text-[#475569]">
                Estamos consultando ingresos con validacion pendiente.
              </p>
            </div>
          ) : error ? (
            <div>
              <h2 className="text-xl font-semibold text-red-700">
                No se pudieron cargar los pendientes
              </h2>
              <p className="mt-2 text-[#475569]">{error}</p>
            </div>
          ) : filteredRegistros.length === 0 ? (
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">
                Sin resultados
              </h2>
              <p className="mt-2 text-[#475569]">
                No hay ingresos que coincidan con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#CBD5E1] text-[#475569]">
                      <th className="py-3 pr-4 font-semibold">ID</th>
                      <th className="py-3 pr-4 font-semibold">Fecha</th>
                      <th className="py-3 pr-4 font-semibold">Tipo</th>
                      <th className="py-3 pr-4 font-semibold">Estado</th>
                      <th className="py-3 pr-4 font-semibold">Proveedor</th>
                      <th className="py-3 pr-4 font-semibold">Remito</th>
                      <th className="py-3 pr-4 font-semibold">Articulo / items</th>
                      <th className="py-3 pr-4 font-semibold">Motivos</th>
                      <th className="py-3 pr-4 font-semibold">Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistros.map((registro) => {
                      const href = detalleHref(registro)
                      const motivos = motivosPendientes(registro)

                      return (
                        <tr
                          key={registro.id}
                          className="border-b border-slate-100 text-[#0F172A] hover:bg-amber-50/40 dark:hover:bg-amber-400/10"
                        >
                          <td className="py-3 pr-4 font-semibold">
                            #{registro.id}
                          </td>
                          <td className="py-3 pr-4">
                            {formatearFecha(registro.fechaIngreso)}
                          </td>
                          <td className="py-3 pr-4">
                            {mostrar(registro.tipoIngreso?.codigo)}
                          </td>
                          <td className="py-3 pr-4">
                            <EstadoBadge estado={registro.estado} />
                          </td>
                          <td className="py-3 pr-4">
                            {mostrar(registro.proveedorNombreCargado)}
                          </td>
                          <td className="py-3 pr-4">
                            {mostrar(registro.remitoProveedor)}
                          </td>
                          <td className="py-3 pr-4">
                            {mostrar(descripcionArticulos(registro))}
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex flex-wrap gap-2">
                              {motivos.map((motivo) => (
                                <MotivoBadge
                                  key={motivo}
                                  variant={
                                    motivo === "Fuera de sugeridos"
                                      ? "neutral"
                                      : "amber"
                                  }
                                >
                                  {motivo}
                                </MotivoBadge>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            {href ? (
                              <Link
                                href={href}
                                className="inline-flex min-w-[140px] items-center justify-center whitespace-nowrap rounded-lg bg-[#F3171B] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#D90F14]"
                              >
                                Ver detalle
                              </Link>
                            ) : (
                              <span className="text-sm text-slate-500">
                                Detalle pendiente
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4 md:hidden">
                {filteredRegistros.map((registro) => {
                  const href = detalleHref(registro)
                  const motivos = motivosPendientes(registro)

                  return (
                    <article
                      key={registro.id}
                      className="rounded-2xl border border-[#CBD5E1] bg-[#F5F7FA] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-[#0F172A]">
                            #{registro.id} · {mostrar(registro.tipoIngreso?.codigo)}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="text-sm text-[#475569]">
                              {formatearFecha(registro.fechaIngreso)}
                            </span>
                            <EstadoBadge estado={registro.estado} />
                          </div>
                        </div>
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
                          Pendiente
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-[#475569]">
                        <p>
                          <span className="font-semibold">Proveedor:</span>{" "}
                          {mostrar(registro.proveedorNombreCargado)}
                        </p>
                        <p>
                          <span className="font-semibold">Remito:</span>{" "}
                          {mostrar(registro.remitoProveedor)}
                        </p>
                        <p>
                          <span className="font-semibold">Articulo/items:</span>{" "}
                          {mostrar(descripcionArticulos(registro))}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {motivos.map((motivo) => (
                            <MotivoBadge
                              key={motivo}
                              variant={
                                motivo === "Fuera de sugeridos"
                                  ? "neutral"
                                  : "amber"
                              }
                            >
                              {motivo}
                            </MotivoBadge>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4">
                        {href ? (
                          <Link
                            href={href}
                            className="inline-flex w-full justify-center whitespace-nowrap rounded-lg bg-[#F3171B] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#D90F14] sm:w-auto"
                          >
                            Ver detalle
                          </Link>
                        ) : (
                          <span className="text-sm text-slate-500">
                            Detalle pendiente
                          </span>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
