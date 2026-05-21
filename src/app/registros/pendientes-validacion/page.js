"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { obtenerPendientesDetalle } from "@/lib/ingresos/pendientes"

const SECTION_CLASS = "panel-surface"
const LABEL_CLASS = "mb-1 block text-sm font-semibold text-[#0F172A] dark:text-slate-100"
const FIELD_CLASS =
  "w-full rounded-2xl border border-[#CBD5E1] bg-white p-3 text-[#0F172A] placeholder:text-slate-400 outline-none focus:border-[#F3171B] focus:ring-2 focus:ring-red-100 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:ring-red-950/40"
const BUTTON_SECONDARY_CLASS = "btn-secondary"
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 15, "TODOS"]

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

function mostrarViaje(registro) {
  if (registro?.numeroViaje === null || registro?.numeroViaje === undefined) {
    return "-"
  }

  return `Viaje N° ${registro.numeroViaje}`
}

function articuloPrincipal(registro) {
  return registro.articulos?.[0] || null
}

function descripcionArticulos(registro) {
  const total = registro.articulos?.length || 0
  if (total > 1) return `${total} items`

  const articulo = articuloPrincipal(registro)
  return articulo?.articuloDescripcionValidada || articulo?.articuloDescripcion
}

function proveedorPrincipal(registro) {
  return registro.proveedorNombreValidado || registro.proveedorNombreCargado
}

function incluyeTexto(valor, termino) {
  if (!termino) return true
  return String(valor || "").toLowerCase().includes(termino.toLowerCase())
}

function matchesMotivo(registro, motivo) {
  if (!motivo || motivo === "Todos") return true

  const pendientes = registro.pendientes || obtenerPendientesDetalle(registro)

  if (motivo === "Proveedor manual") {
    return pendientes.some((pendiente) => pendiente.tipo === "proveedor")
  }

  if (motivo === "Servicio manual") {
    return pendientes.some((pendiente) => pendiente.tipo === "servicio")
  }

  if (motivo === "Hachador manual") {
    return pendientes.some((pendiente) => pendiente.tipo === "hachador")
  }

  if (motivo === "Artículo manual") {
    return pendientes.some((pendiente) => pendiente.tipo === "articulo")
  }

  if (motivo === "Fuera de sugeridos") {
    return pendientes.some((pendiente) => pendiente.tipo === "fueraSugerido")
  }

  if (motivo === "Pendiente validar") {
    return pendientes.length > 0
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
  const pendientes = registro.pendientes || obtenerPendientesDetalle(registro)
  return [...new Set(pendientes.map((pendiente) => pendiente.label))]
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
  const [itemsPorPagina, setItemsPorPagina] = useState(10)
  const [paginaActual, setPaginaActual] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const filteredRegistros = useMemo(() => {
    return registros.filter((registro) => {
      if (
        filterValues.tipo !== "Todos" &&
        registro.tipoIngreso?.codigo !== filterValues.tipo
      ) {
        return false
      }

      if (
        filterValues.estado !== "Todos" &&
        registro.estado !== filterValues.estado
      ) {
        return false
      }

      if (
        !incluyeTexto(
          proveedorPrincipal(registro),
          filterValues.proveedor
        )
      ) {
        return false
      }

      if (!incluyeTexto(registro.remitoProveedor, filterValues.remito)) {
        return false
      }

      if (filterValues.fechaDesde) {
        const desde = new Date(filterValues.fechaDesde)
        const ingreso = new Date(registro.fechaIngreso)
        if (ingreso < desde) return false
      }

      if (filterValues.fechaHasta) {
        const hasta = new Date(filterValues.fechaHasta)
        const ingreso = new Date(registro.fechaIngreso)
        if (ingreso > hasta) return false
      }

      if (!matchesMotivo(registro, filterValues.motivo)) {
        return false
      }

      return true
    })
  }, [registros, filterValues])

  const totalRegistros = filteredRegistros.length
  const totalFotos = useMemo(
    () => filteredRegistros.reduce((acc, item) => acc + (item.fotos?.length || 0), 0),
    [filteredRegistros]
  )

  const totalPaginas =
    itemsPorPagina === "TODOS"
      ? 1
      : Math.max(1, Math.ceil(totalRegistros / itemsPorPagina))

  const paginaActualValida = Math.min(paginaActual, totalPaginas)

  const registrosVisibles = useMemo(() => {
    if (itemsPorPagina === "TODOS") return filteredRegistros

    const inicio = (paginaActualValida - 1) * itemsPorPagina
    return filteredRegistros.slice(inicio, inicio + itemsPorPagina)
  }, [filteredRegistros, paginaActualValida, itemsPorPagina])

  function actualizarFiltro(event) {
    const { name, value } = event.target
    setFilterValues((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function limpiarFiltros() {
    setFilterValues(DEFAULT_FILTROS)
    setPaginaActual(1)
  }

  function actualizarItemsPorPagina(event) {
    const value = event.target.value
    setItemsPorPagina(value === "TODOS" ? "TODOS" : Number(value))
    setPaginaActual(1)
  }

  function irPaginaAnterior() {
    setPaginaActual((prev) => Math.max(1, prev - 1))
  }

  function irPaginaSiguiente() {
    setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))
  }

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

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <span className={LABEL_CLASS}>Tipo de ingreso</span>
                <select
                  name="tipo"
                  value={filterValues.tipo}
                  onChange={actualizarFiltro}
                  className={FIELD_CLASS}
                >
                  <option>Todos</option>
                  <option>ROLLIZOS</option>
                  <option>MATERIALES</option>
                </select>
              </label>

              <label className="block">
                <span className={LABEL_CLASS}>Estado</span>
                <select
                  name="estado"
                  value={filterValues.estado}
                  onChange={actualizarFiltro}
                  className={FIELD_CLASS}
                >
                  <option>Todos</option>
                  <option>REGISTRADO</option>
                  <option>ANULADO</option>
                </select>
              </label>

              <label className="block">
                <span className={LABEL_CLASS}>Motivo pendiente</span>
                <select
                  name="motivo"
                  value={filterValues.motivo}
                  onChange={actualizarFiltro}
                  className={FIELD_CLASS}
                >
                  <option>Todos</option>
                  <option>Proveedor manual</option>
                  <option>Hachador manual</option>
                  <option>Servicio manual</option>
                  <option>Artículo manual</option>
                  <option>Fuera de sugeridos</option>
                  <option>Pendiente validar</option>
                </select>
              </label>

              <label className="block">
                <span className={LABEL_CLASS}>Proveedor</span>
                <input
                  name="proveedor"
                  value={filterValues.proveedor}
                  onChange={actualizarFiltro}
                  placeholder="Buscar proveedor"
                  className={FIELD_CLASS}
                />
              </label>

              <label className="block">
                <span className={LABEL_CLASS}>Remito</span>
                <input
                  name="remito"
                  value={filterValues.remito}
                  onChange={actualizarFiltro}
                  placeholder="Buscar remito"
                  className={FIELD_CLASS}
                />
              </label>

              <label className="block">
                <span className={LABEL_CLASS}>Fecha desde</span>
                <input
                  type="date"
                  name="fechaDesde"
                  value={filterValues.fechaDesde}
                  onChange={actualizarFiltro}
                  className={FIELD_CLASS}
                />
              </label>

              <label className="block">
                <span className={LABEL_CLASS}>Fecha hasta</span>
                <input
                  type="date"
                  name="fechaHasta"
                  value={filterValues.fechaHasta}
                  onChange={actualizarFiltro}
                  className={FIELD_CLASS}
                />
              </label>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className={BUTTON_SECONDARY_CLASS}
                >
                  Limpiar filtros
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                {itemsPorPagina === "TODOS"
                  ? "Mostrando todos los pendientes"
                  : `Mostrando ${
                      totalRegistros === 0
                        ? 0
                        : (paginaActualValida - 1) * itemsPorPagina + 1
                    }-${Math.min(totalRegistros, paginaActualValida * itemsPorPagina)} de ${totalRegistros}`}
              </p>
              <label className="w-full sm:w-auto">
                <span className={LABEL_CLASS}>Mostrar</span>
                <select
                  value={itemsPorPagina}
                  onChange={actualizarItemsPorPagina}
                  className={FIELD_CLASS}
                >
                  {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option === "TODOS" ? "Todos" : option}
                    </option>
                  ))}
                </select>
              </label>
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
                      <th className="py-3 pr-4 font-semibold">N° viaje</th>
                      <th className="py-3 pr-4 font-semibold">Estado</th>
                      <th className="py-3 pr-4 font-semibold">Proveedor</th>
                      <th className="py-3 pr-4 font-semibold">Remito</th>
                      <th className="py-3 pr-4 font-semibold">Articulo / items</th>
                      <th className="py-3 pr-4 font-semibold">Motivos</th>
                      <th className="py-3 pr-4 font-semibold">Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrosVisibles.map((registro) => {
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
                            {mostrarViaje(registro)}
                          </td>
                          <td className="py-3 pr-4">
                            <EstadoBadge estado={registro.estado} />
                          </td>
                          <td className="py-3 pr-4">
                            {mostrar(proveedorPrincipal(registro))}
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
                {registrosVisibles.map((registro) => {
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
                          <span className="font-semibold">N° viaje:</span>{" "}
                          {mostrarViaje(registro)}
                        </p>
                        <p>
                          <span className="font-semibold">Proveedor:</span>{" "}
                          {mostrar(proveedorPrincipal(registro))}
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

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  {itemsPorPagina === "TODOS"
                    ? "Mostrando todos los pendientes"
                    : `Mostrando ${
                        totalRegistros === 0
                          ? 0
                          : (paginaActualValida - 1) * itemsPorPagina + 1
                      }-${Math.min(totalRegistros, paginaActualValida * itemsPorPagina)} de ${totalRegistros}`}
                </p>
                {itemsPorPagina !== "TODOS" && totalRegistros > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={irPaginaAnterior}
                      disabled={paginaActualValida === 1}
                      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                        paginaActualValida === 1
                          ? "border-slate-200 bg-slate-100 text-slate-500"
                          : "border-[#CBD5E1] bg-white text-[#0F172A] hover:border-[#F3171B] hover:text-[#D90F14]"
                      }`}
                    >
                      Anterior
                    </button>
                    <span className="text-sm text-slate-600">
                      Página {paginaActualValida} de {totalPaginas}
                    </span>
                    <button
                      type="button"
                      onClick={irPaginaSiguiente}
                      disabled={paginaActualValida === totalPaginas}
                      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                        paginaActualValida === totalPaginas
                          ? "border-slate-200 bg-slate-100 text-slate-500"
                          : "border-[#CBD5E1] bg-white text-[#0F172A] hover:border-[#F3171B] hover:text-[#D90F14]"
                      }`}
                    >
                      Siguiente
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
