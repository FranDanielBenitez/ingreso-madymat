"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

const SECTION_CLASS = "panel-surface"
const LABEL_CLASS = "mb-1 block text-sm font-semibold text-[#0F172A]"
const FIELD_CLASS =
  "w-full rounded-2xl border border-[#CBD5E1] bg-white p-3 text-[#0F172A] placeholder:text-slate-400 outline-none focus:border-[#F3171B] focus:ring-2 focus:ring-red-100"
const BUTTON_SECONDARY_CLASS = "btn-secondary"
const BUTTON_PRIMARY_CLASS = "btn-primary"
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 15, "TODOS"]

const ESTADOS = [
  "BORRADOR",
  "REGISTRADO",
  "PENDIENTE_VALIDACION_PROVEEDOR",
  "VALIDADO_PROVEEDORES",
  "PDF_GENERADO",
  "ENVIADO_FEX",
  "FINALIZADO",
  "ANULADO",
]

const FILTROS_INICIALES = {
  tipoIngreso: "",
  estado: "",
  fechaDesde: "",
  fechaHasta: "",
  proveedor: "",
  remito: "",
  patente: "",
}

function filtrosDesdeUrl() {
  if (typeof window === "undefined") return FILTROS_INICIALES

  const params = new URLSearchParams(window.location.search)

  return {
    tipoIngreso: params.get("tipoIngreso") || "",
    estado: params.get("estado") || "",
    fechaDesde: params.get("fechaDesde") || "",
    fechaHasta: params.get("fechaHasta") || "",
    proveedor: params.get("proveedor") || "",
    remito: params.get("remito") || "",
    patente: params.get("patente") || "",
  }
}

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
  if (total > 1) return `${total} ítems`

  return articuloPrincipal(registro)?.articuloDescripcion
}

function cantidadArticulos(registro) {
  const total = registro.articulos?.length || 0
  if (total > 1) return "Ver detalle"

  const articulo = articuloPrincipal(registro)
  return `${mostrar(articulo?.cantidad)} ${mostrar(articulo?.unidad)}`
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

function ProveedorManualBadge({ registro }) {
  if (!registro?.proveedorCargaManual) return null

  return (
    <span className="mt-1 inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
      Manual - Pendiente validar
    </span>
  )
}

function ArticuloManualBadge({ registro }) {
  const articulos = registro?.articulos || []

  if (articulos.length !== 1 || articulos[0]?.origenDato !== "MANUAL") {
    return null
  }

  return (
    <span className="mt-1 inline-flex w-fit rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
      Manual
    </span>
  )
}

export default function RegistrosPage() {
  const [filtros, setFiltros] = useState(() => filtrosDesdeUrl())
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [paginaActual, setPaginaActual] = useState(1)
  const [itemsPorPagina, setItemsPorPagina] = useState(10)

  const totalFotos = useMemo(
    () => registros.reduce((acc, item) => acc + (item.fotos?.length || 0), 0),
    [registros]
  )

  const totalRegistros = registros.length
  const totalPaginas =
    itemsPorPagina === "TODOS"
      ? 1
      : Math.max(1, Math.ceil(totalRegistros / itemsPorPagina))

  const paginaActualValida = Math.min(paginaActual, totalPaginas)

  const registrosVisibles = useMemo(() => {
    if (itemsPorPagina === "TODOS") return registros

    const inicio = (paginaActualValida - 1) * itemsPorPagina
    return registros.slice(inicio, inicio + itemsPorPagina)
  }, [registros, paginaActualValida, itemsPorPagina])

  function actualizarFiltro(event) {
    const { name, value } = event.target

    setFiltros((prev) => ({
      ...prev,
      [name]: value,
    }))

    setPaginaActual(1)
  }

  async function cargarRegistros(filtrosActuales = filtros) {
    setLoading(true)
    setError("")

    try {
      const params = new URLSearchParams()

      Object.entries(filtrosActuales).forEach(([key, value]) => {
        if (value) params.set(key, value)
      })

      const query = params.toString()
      const response = await fetch(
        `/api/registros${query ? `?${query}` : ""}`
      )
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "No se pudieron cargar los registros")
      }

      setRegistros(result.data || [])
    } catch (err) {
      setError(err.message || "No se pudieron cargar los registros")
    } finally {
      setLoading(false)
    }
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES)
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
    const timeout = setTimeout(() => {
      cargarRegistros(filtros)
    }, 250)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros])

  return (
    <main className="min-h-screen bg-[#F5F7FA] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className={SECTION_CLASS}>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[#F3171B]">
                Consulta de ingresos
              </p>
              <h1 className="mt-1 text-3xl font-black text-[#0F172A]">
                Registros de ingresos
              </h1>
            </div>
            <div className="rounded-lg border border-[#CBD5E1] bg-[#F5F7FA] px-4 py-3 text-sm font-semibold text-[#475569]">
              {registros.length} registros · {totalFotos} fotos
            </div>
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <label>
                <span className={LABEL_CLASS}>Tipo de ingreso</span>
                <select
                  name="tipoIngreso"
                  value={filtros.tipoIngreso}
                  onChange={actualizarFiltro}
                  className={FIELD_CLASS}
                >
                  <option value="">Todos</option>
                  <option value="ROLLIZOS">ROLLIZOS</option>
                  <option value="MATERIALES">MATERIALES</option>
                </select>
              </label>

              <label>
                <span className={LABEL_CLASS}>Estado</span>
                <select
                  name="estado"
                  value={filtros.estado}
                  onChange={actualizarFiltro}
                  className={FIELD_CLASS}
                >
                  <option value="">Todos</option>
                  {ESTADOS.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className={LABEL_CLASS}>Fecha desde</span>
                <input
                  type="date"
                  name="fechaDesde"
                  value={filtros.fechaDesde}
                  onChange={actualizarFiltro}
                  className={FIELD_CLASS}
                />
              </label>

              <label>
                <span className={LABEL_CLASS}>Fecha hasta</span>
                <input
                  type="date"
                  name="fechaHasta"
                  value={filtros.fechaHasta}
                  onChange={actualizarFiltro}
                  className={FIELD_CLASS}
                />
              </label>

              <label>
                <span className={LABEL_CLASS}>Proveedor</span>
                <input
                  type="text"
                  name="proveedor"
                  value={filtros.proveedor}
                  onChange={actualizarFiltro}
                  className={FIELD_CLASS}
                  placeholder="Buscar proveedor"
                />
              </label>

              <label>
                <span className={LABEL_CLASS}>Remito</span>
                <input
                  type="text"
                  name="remito"
                  value={filtros.remito}
                  onChange={actualizarFiltro}
                  className={FIELD_CLASS}
                  placeholder="Número de remito"
                />
              </label>

              <label>
                <span className={LABEL_CLASS}>Patente</span>
                <input
                  type="text"
                  name="patente"
                  value={filtros.patente}
                  onChange={actualizarFiltro}
                  className={FIELD_CLASS}
                  placeholder="Camión o acoplado"
                />
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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
              <button
                type="button"
                onClick={limpiarFiltros}
                className={BUTTON_SECONDARY_CLASS}
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </section>

        <section className={SECTION_CLASS}>
          {loading ? (
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">
                Cargando registros...
              </h2>
              <p className="mt-2 text-[#475569]">
                Estamos consultando ingresos guardados.
              </p>
            </div>
          ) : error ? (
            <div>
              <h2 className="text-xl font-semibold text-red-700">
                No se pudieron cargar los registros
              </h2>
              <p className="mt-2 text-[#475569]">{error}</p>
            </div>
          ) : registros.length === 0 ? (
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">
                Sin registros
              </h2>
              <p className="mt-2 text-[#475569]">
                No se encontraron ingresos con los filtros aplicados.
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
                      <th className="py-3 pr-4 font-semibold">Artículo</th>
                      <th className="py-3 pr-4 font-semibold">Cantidad</th>
                      <th className="py-3 pr-4 font-semibold">Patente</th>
                      <th className="py-3 pr-4 font-semibold">Fotos</th>
                      <th className="py-3 pr-4 font-semibold">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrosVisibles.map((registro) => {
                      const href = detalleHref(registro)

                      return (
                        <tr
                          key={registro.id}
                          className="border-b border-slate-100 text-[#0F172A] hover:bg-red-50/30"
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
                            <div className="flex flex-col">
                              <span>{mostrar(registro.proveedorNombreCargado)}</span>
                              <ProveedorManualBadge registro={registro} />
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            {mostrar(registro.remitoProveedor)}
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex flex-col">
                              <span>{mostrar(descripcionArticulos(registro))}</span>
                              <ArticuloManualBadge registro={registro} />
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            {cantidadArticulos(registro)}
                          </td>
                          <td className="py-3 pr-4">
                            {mostrar(registro.patenteCamion)}
                          </td>
                          <td className="py-3 pr-4">
                            {registro.fotos?.length || 0}
                          </td>
                          <td className="py-3 pr-4">
                            {href ? (
                              <Link
                                href={href}
                                className="rounded-lg bg-[#F3171B] px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#D90F14]"
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
                        <span className="rounded-full border border-[#CBD5E1] bg-white px-3 py-1 text-sm font-semibold text-[#475569]">
                          {registro.fotos?.length || 0} fotos
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-[#475569]">
                        <p>
                          <span className="font-semibold">Proveedor:</span>{" "}
                          {mostrar(registro.proveedorNombreCargado)}
                        </p>
                        <ProveedorManualBadge registro={registro} />
                        <p>
                          <span className="font-semibold">Remito:</span>{" "}
                          {mostrar(registro.remitoProveedor)}
                        </p>
                        <p>
                          <span className="font-semibold">Artículo:</span>{" "}
                          {mostrar(descripcionArticulos(registro))}
                        </p>
                        <ArticuloManualBadge registro={registro} />
                        <p>
                          <span className="font-semibold">Cantidad:</span>{" "}
                          {cantidadArticulos(registro)}
                        </p>
                        <p>
                          <span className="font-semibold">Patente:</span>{" "}
                          {mostrar(registro.patenteCamion)}
                        </p>
                      </div>

                      <div className="mt-4">
                        {href ? (
                          <Link
                            href={href}
                            className="inline-flex rounded-lg bg-[#F3171B] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#D90F14]"
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
                    ? "Mostrando todos los registros"
                    : `Mostrando ${
                        totalRegistros === 0
                          ? 0
                          : (paginaActual - 1) * itemsPorPagina + 1
                      }-${Math.min(totalRegistros, paginaActual * itemsPorPagina)} de ${totalRegistros}`}
                </p>
                {itemsPorPagina !== "TODOS" && totalRegistros > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={irPaginaAnterior}
                      disabled={paginaActualValida === 1}
                      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                        paginaActualValida === 1
                          ? "border-slate-200 bg-slate-100 text-slate-400"
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
                          ? "border-slate-200 bg-slate-100 text-slate-400"
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
