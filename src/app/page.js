"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  FiAlertTriangle,
  FiMapPin,
  FiList,
  FiSettings,
  FiXCircle,
} from "react-icons/fi"
import { GiWoodBeam, GiWoodPile } from "react-icons/gi"

const SECTION_CLASS = "panel-surface"

const ACCESOS = [
  {
    titulo: "Nuevo ingreso Rollizos",
    href: "/ingresos/rollizos",
    icon: GiWoodPile,
  },
  {
    titulo: "Nuevo ingreso Materiales",
    href: "/ingresos/materiales",
    icon: GiWoodBeam,
  },
  {
    titulo: "Ver registros",
    href: "/registros",
    icon: FiList,
  },
  {
    titulo: "Registros anulados",
    href: "/registros?estado=ANULADO",
    icon: FiXCircle,
  },
  {
    titulo: "Pendientes de validar",
    href: "/registros/pendientes-validacion",
    icon: FiAlertTriangle,
  },
  {
    titulo: "Configurar procedencias",
    href: "/configuracion/procedencias",
    icon: FiMapPin,
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
        {
          label: "Pendientes de validar",
          value: metricas.pendientesValidacion || 0,
          pending: true,
        },
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
      <main className="min-h-screen bg-[#F5F7FA] p-6">
        <section className={`mx-auto max-w-7xl ${SECTION_CLASS}`}>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            Cargando dashboard...
          </h1>
          <p className="mt-2 text-[#475569]">
            Estamos consultando la actividad reciente.
          </p>
        </section>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] p-6">
        <section className={`mx-auto max-w-7xl ${SECTION_CLASS}`}>
          <h1 className="text-2xl font-bold text-red-700">
            No se pudo cargar el dashboard
          </h1>
          <p className="mt-2 text-[#475569]">{error}</p>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className={SECTION_CLASS}>
          <p className="text-sm font-bold uppercase tracking-wide text-[#F3171B]">
            Inicio
          </p>
          <h1 className="mt-1 text-4xl font-black tracking-tight text-[#0F172A]">
            Dashboard Ingreso Madymat
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[#475569]">
            Gestion de ingresos de madera y materiales para porteria,
            proveedores y sistemas.
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="text-xl font-bold text-[#0F172A]">
            Accesos rapidos
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {ACCESOS.map((acceso) => {
              const Icon = acceso.icon || FiSettings

              return (
                <Link
                  key={acceso.href}
                  href={acceso.href}
                  className="quick-access-card group panel-surface panel-surface-soft flex min-h-32 flex-col items-center justify-center gap-3 text-center hover:-translate-y-0.5 hover:border-amber-300 hover:bg-white hover:shadow-md focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[#CBD5E1] bg-white text-slate-500 group-hover:border-amber-300 group-hover:bg-amber-50 group-hover:text-amber-700 dark:text-slate-300 dark:group-hover:text-amber-200">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-sm font-black leading-5 text-[#0F172A] group-hover:text-amber-800 dark:group-hover:text-amber-100">
                    {acceso.titulo}
                  </h3>
                </Link>
              )
            })}
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="text-xl font-bold text-[#0F172A]">
            Indicadores principales
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {indicadores.map((item) => (
              <article
                key={item.label}
                className={
                  item.danger
                    ? "panel-surface dashboard-danger-card border-red-200 bg-red-50"
                    : item.pending
                      ? "panel-surface dashboard-pending-card border-amber-200 bg-amber-50"
                      : "panel-surface panel-surface-soft"
                }
              >
                <p
                  className={`text-sm font-medium ${
                    item.danger
                      ? "dashboard-danger-text text-[#DC2626]"
                      : item.pending
                        ? "dashboard-pending-text text-amber-800"
                        : "text-[#475569]"
                  }`}
                >
                  {item.label}
                </p>
                <p
                  className={`mt-2 text-3xl font-bold ${
                    item.danger
                      ? "dashboard-danger-text text-[#DC2626]"
                      : item.pending
                        ? "dashboard-pending-text text-amber-900"
                        : "text-[#0F172A]"
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
              <h2 className="text-xl font-bold text-[#0F172A]">
                Ultimos ingresos
              </h2>
              <p className="mt-1 text-sm text-[#475569]">
                Los 8 registros creados mas recientemente.
              </p>
            </div>
            <Link
              href="/registros"
              className="btn-secondary"
            >
              Ver todos
            </Link>
          </div>

          {ultimosIngresos.length === 0 ? (
            <p className="mt-4 text-[#475569]">Todavia no hay ingresos registrados.</p>
          ) : (
            <>
              <div className="mt-4 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#CBD5E1] text-[#475569]">
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

              <div className="mt-4 space-y-4 md:hidden">
                {ultimosIngresos.map((registro) => {
                  const href = detalleHref(registro)

                  return (
                    <article
                      key={registro.id}
                      className="panel-surface panel-surface-soft"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-[#0F172A]">
                            #{registro.id} - {mostrar(registro.tipoIngreso?.codigo)}
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
                          <span className="font-semibold">Articulo:</span>{" "}
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
            </>
          )}
        </section>
      </div>
    </main>
  )
}
