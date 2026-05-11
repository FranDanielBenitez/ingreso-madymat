"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

const SECTION_CLASS = "rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
const LABEL_CLASS = "mb-1 block text-sm font-medium text-slate-800"
const FIELD_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"

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

function detalleHref(registro) {
  if (registro.tipoIngreso?.codigo === "ROLLIZOS") {
    return `/ingresos/rollizos/${registro.id}`
  }

  return null
}

export default function RegistrosPage() {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const totalFotos = useMemo(
    () => registros.reduce((acc, item) => acc + (item.fotos?.length || 0), 0),
    [registros]
  )

  function actualizarFiltro(event) {
    const { name, value } = event.target

    setFiltros((prev) => ({
      ...prev,
      [name]: value,
    }))
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
      const response = await fetch(`/api/registros${query ? `?${query}` : ""}`)
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

  function buscar(event) {
    event.preventDefault()
    cargarRegistros()
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES)
    cargarRegistros(FILTROS_INICIALES)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarRegistros(FILTROS_INICIALES)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className={SECTION_CLASS}>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Consulta de ingresos
              </p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                Registros de ingresos
              </h1>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {registros.length} registros · {totalFotos} fotos
            </div>
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <form onSubmit={buscar} className="space-y-4">
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

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={limpiarFiltros}
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-medium text-slate-800 focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              >
                Limpiar filtros
              </button>
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-5 py-3 font-medium text-white"
              >
                Buscar
              </button>
            </div>
          </form>
        </section>

        <section className={SECTION_CLASS}>
          {loading ? (
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Cargando registros...
              </h2>
              <p className="mt-2 text-slate-600">
                Estamos consultando ingresos guardados.
              </p>
            </div>
          ) : error ? (
            <div>
              <h2 className="text-xl font-semibold text-red-700">
                No se pudieron cargar los registros
              </h2>
              <p className="mt-2 text-slate-700">{error}</p>
            </div>
          ) : registros.length === 0 ? (
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Sin registros
              </h2>
              <p className="mt-2 text-slate-600">
                No se encontraron ingresos con los filtros aplicados.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600">
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
                    {registros.map((registro) => {
                      const articulo = articuloPrincipal(registro)
                      const href = detalleHref(registro)

                      return (
                        <tr
                          key={registro.id}
                          className="border-b border-slate-100 text-slate-900"
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
                          <td className="py-3 pr-4">{registro.estado}</td>
                          <td className="py-3 pr-4">
                            {mostrar(registro.proveedorNombreCargado)}
                          </td>
                          <td className="py-3 pr-4">
                            {mostrar(registro.remitoProveedor)}
                          </td>
                          <td className="py-3 pr-4">
                            {mostrar(articulo?.articuloDescripcion)}
                          </td>
                          <td className="py-3 pr-4">
                            {mostrar(articulo?.cantidad)} {mostrar(articulo?.unidad)}
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
                                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
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
                {registros.map((registro) => {
                  const articulo = articuloPrincipal(registro)
                  const href = detalleHref(registro)

                  return (
                    <article
                      key={registro.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-900">
                            #{registro.id} · {mostrar(registro.tipoIngreso?.codigo)}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {formatearFecha(registro.fechaIngreso)} · {registro.estado}
                          </p>
                        </div>
                        <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                          {registro.fotos?.length || 0} fotos
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-slate-700">
                        <p>
                          <span className="font-semibold">Proveedor:</span>{" "}
                          {mostrar(registro.proveedorNombreCargado)}
                        </p>
                        <p>
                          <span className="font-semibold">Remito:</span>{" "}
                          {mostrar(registro.remitoProveedor)}
                        </p>
                        <p>
                          <span className="font-semibold">Artículo:</span>{" "}
                          {mostrar(articulo?.articuloDescripcion)}
                        </p>
                        <p>
                          <span className="font-semibold">Cantidad:</span>{" "}
                          {mostrar(articulo?.cantidad)} {mostrar(articulo?.unidad)}
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
                            className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
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
