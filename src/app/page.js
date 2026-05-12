"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

const SECTION_CLASS = "rounded-xl border border-slate-200 bg-white p-6 shadow-sm"

const ACCESOS = [
  {
    titulo: "Nuevo ingreso Rollizos",
    descripcion: "Registrar madera rolliza con proveedor, material y fotos.",
    href: "/ingresos/rollizos",
  },
  {
    titulo: "Nuevo ingreso Materiales",
    descripcion: "Cargar pallets, tablas, tacos, terciado y otros materiales.",
    href: "/ingresos/materiales",
  },
  {
    titulo: "Ver registros",
    descripcion: "Consultar ingresos guardados y entrar a sus detalles.",
    href: "/registros",
  },
  {
    titulo: "Registros anulados",
    descripcion: "Auditar ingresos anulados y sus motivos en logs.",
    href: "/registros?estado=ANULADO",
  },
]

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
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-slate-300 bg-slate-50 text-slate-700"
      }`}
    >
      {estado}
    </span>
  )
}

export default function Home() {
  const [resumen, setResumen] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const ultimosIngresos = resumen?.ultimosIngresos || []

  const indicadores = useMemo(
    () => {
      const metricas = resumen?.metricas || {}

      return [
        { label: "Total ingresos", value: metricas.totalIngresos || 0 },
        { label: "Ingresos hoy", value: metricas.ingresosHoy || 0 },
        { label: "Rollizos", value: metricas.rollizos || 0 },
        { label: "Materiales", value: metricas.materiales || 0 },
        { label: "Registrados", value: metricas.registrados || 0 },
        { label: "Anulados", value: metricas.anulados || 0, danger: true },
        { label: "Con fotos", value: metricas.conFotos || 0 },
      ]
    },
    [resumen]
  )

  useEffect(() => {
    async function cargarResumen() {
      setLoading(true)
      setError("")

      try {
        const response = await fetch("/api/dashboard/resumen")
        const result = await response.json()

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "No se pudo cargar el dashboard")
        }

        setResumen(result)
      } catch (err) {
        setError(err.message || "No se pudo cargar el dashboard")
      } finally {
        setLoading(false)
      }
    }

    cargarResumen()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <section className={`mx-auto max-w-7xl ${SECTION_CLASS}`}>
          <h1 className="text-2xl font-bold text-slate-900">
            Cargando dashboard...
          </h1>
          <p className="mt-2 text-slate-600">
            Estamos consultando la actividad reciente.
          </p>
        </section>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <section className={`mx-auto max-w-7xl ${SECTION_CLASS}`}>
          <h1 className="text-2xl font-bold text-red-700">
            No se pudo cargar el dashboard
          </h1>
          <p className="mt-2 text-slate-700">{error}</p>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className={SECTION_CLASS}>
          <p className="text-sm font-medium text-slate-600">Inicio</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Dashboard Ingreso Madymat
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Gestion de ingresos de madera y materiales para porteria,
            proveedores y sistemas.
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="text-xl font-semibold text-slate-900">
            Accesos rapidos
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {ACCESOS.map((acceso) => (
              <Link
                key={acceso.href}
                href={acceso.href}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-400 hover:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <h3 className="text-lg font-bold text-slate-900">
                  {acceso.titulo}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {acceso.descripcion}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="text-xl font-semibold text-slate-900">
            Indicadores principales
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {indicadores.map((item) => (
              <article
                key={item.label}
                className={`rounded-xl border p-5 ${
                  item.danger
                    ? "border-red-200 bg-red-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    item.danger ? "text-red-700" : "text-slate-600"
                  }`}
                >
                  {item.label}
                </p>
                <p
                  className={`mt-2 text-3xl font-bold ${
                    item.danger ? "text-red-800" : "text-slate-900"
                  }`}
                >
                  {item.value}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Ultimos ingresos
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Los 8 registros creados mas recientemente.
              </p>
            </div>
            <Link
              href="/registros"
              className="w-fit rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
            >
              Ver todos
            </Link>
          </div>

          {ultimosIngresos.length === 0 ? (
            <p className="mt-4 text-slate-600">Todavia no hay ingresos registrados.</p>
          ) : (
            <>
              <div className="mt-4 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600">
                      <th className="py-3 pr-4 font-semibold">ID</th>
                      <th className="py-3 pr-4 font-semibold">Fecha</th>
                      <th className="py-3 pr-4 font-semibold">Tipo</th>
                      <th className="py-3 pr-4 font-semibold">Estado</th>
                      <th className="py-3 pr-4 font-semibold">Proveedor</th>
                      <th className="py-3 pr-4 font-semibold">Remito</th>
                      <th className="py-3 pr-4 font-semibold">Articulo</th>
                      <th className="py-3 pr-4 font-semibold">Cantidad</th>
                      <th className="py-3 pr-4 font-semibold">Patente</th>
                      <th className="py-3 pr-4 font-semibold">Fotos</th>
                      <th className="py-3 pr-4 font-semibold">Accion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ultimosIngresos.map((registro) => {
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

              <div className="mt-4 space-y-4 md:hidden">
                {ultimosIngresos.map((registro) => {
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
                            #{registro.id} - {mostrar(registro.tipoIngreso?.codigo)}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="text-sm text-slate-600">
                              {formatearFecha(registro.fechaIngreso)}
                            </span>
                            <EstadoBadge estado={registro.estado} />
                          </div>
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
                          <span className="font-semibold">Articulo:</span>{" "}
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
