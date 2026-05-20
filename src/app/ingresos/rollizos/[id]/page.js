"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import EditarIngresoPanel from "@/components/forms/EditarIngresoPanel"
import DocumentacionFexCard from "@/components/ingresos/DocumentacionFexCard"
import PendientesAprobacionCard from "@/components/ingresos/PendientesAprobacionCard"
import { articuloManualAprobado } from "@/lib/ingresos/pendientes"

const SECTION_CLASS =
  "rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm shadow-slate-200/70"
const LABEL_CLASS = "text-sm font-semibold text-[#475569]"
const VALUE_CLASS = "mt-1 text-base font-bold text-[#0F172A]"

const TITULOS_FOTO = {
  CAMION_PATENTE: "Camión / patente",
  MATERIAL_CARGADO: "Material cargado",
  REMITO_FISICO: "Remito físico",
  ADICIONAL: "Foto adicional",
}

function formatearFecha(value) {
  if (!value) return "-"

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

function formatearBytes(value) {
  if (!value) return "-"

  if (value < 1024) return `${value} B`

  const kb = value / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`

  return `${(kb / 1024).toFixed(1)} MB`
}

function mostrar(value) {
  if (value === null || value === undefined || value === "") return "-"

  return String(value)
}

function Campo({ label, value }) {
  return (
    <div>
      <p className={LABEL_CLASS}>{label}</p>
      <p className={VALUE_CLASS}>{mostrar(value)}</p>
    </div>
  )
}

function CampoValidado({ label, original, validado }) {
  const tieneValidado = validado !== null && validado !== undefined && validado !== ""

  return (
    <div>
      <p className={LABEL_CLASS}>{label}</p>
      <p className={VALUE_CLASS}>{mostrar(tieneValidado ? validado : original)}</p>
      {tieneValidado && mostrar(original) !== mostrar(validado) ? (
        <p className="mt-1 text-xs font-medium text-[#64748B]">
          Original cargado: {mostrar(original)}
        </p>
      ) : null}
    </div>
  )
}

function ProveedorBadges({ ingreso }) {
  if (!ingreso?.proveedorCargaManual) return null
  const aprobado = ingreso.proveedorValidado === true

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
        Proveedor manual
      </span>
      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${
        aprobado
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}>
        {aprobado ? "Validado" : "Pendiente de validar"}
      </span>
    </div>
  )
}

function ServicioBadges({ ingreso }) {
  if (!ingreso?.servicioCargaManual) return null
  const aprobado = ingreso.servicioValidado === true

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <span className="rounded-full border border-slate-300 bg-white/70 px-3 py-1 text-xs font-semibold text-[#475569] dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200">
        Servicio manual
      </span>
      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
        aprobado
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-100/70 text-amber-800"
      }`}>
        {aprobado ? "Validado" : "Pendiente de validar"}
      </span>
    </div>
  )
}

function ArticuloBadges({ articulo, ingreso }) {
  if (articulo?.origenDato !== "MANUAL") return null
  const aprobado = articuloManualAprobado(ingreso, articulo)

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <span className="rounded-full border border-slate-300 bg-white/70 px-3 py-1 text-xs font-semibold text-[#475569] dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200">
        Articulo manual
      </span>
      <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
        aprobado
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-100/70 text-amber-800"
      }`}>
        {aprobado ? "Validado" : "Pendiente de validar"}
      </span>
    </div>
  )
}

export default function DetalleIngresoRollizosPage() {
  const params = useParams()
  const id = params?.id
  const [ingreso, setIngreso] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [mostrandoAnulacion, setMostrandoAnulacion] = useState(false)
  const [mostrandoEdicion, setMostrandoEdicion] = useState(false)
  const [motivoAnulacion, setMotivoAnulacion] = useState("")
  const [anulando, setAnulando] = useState(false)

  const articuloPrincipal = useMemo(
    () => ingreso?.articulos?.[0] || null,
    [ingreso]
  )

  const ingresoAnulado = ingreso?.estado === "ANULADO"

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  useEffect(() => {
    async function cargarIngreso() {
      setLoading(true)
      setError("")

      try {
        const response = await fetch(`/api/ingresos/rollizos/${id}`)
        const result = await response.json()

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "No se pudo cargar el ingreso")
        }

        setIngreso(result.ingreso)
      } catch (err) {
        setError(err.message || "No se pudo cargar el ingreso")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      cargarIngreso()
    }
  }, [id])

  async function confirmarAnulacion() {
    const motivo = motivoAnulacion.trim()

    if (!motivo) {
      toast.error("El motivo de anulacion es obligatorio")
      return
    }

    try {
      setAnulando(true)

      const response = await fetch(`/api/ingresos/${id}/anular`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ motivo }),
      })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "No se pudo anular el ingreso")
      }

      setIngreso(result.ingreso)
      setMotivoAnulacion("")
      setMostrandoAnulacion(false)
      toast.success("Ingreso anulado correctamente")
    } catch (err) {
      toast.error(err.message || "No se pudo anular el ingreso")
    } finally {
      setAnulando(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] p-6">
        <section className={`mx-auto max-w-6xl ${SECTION_CLASS}`}>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            Cargando ingreso...
          </h1>
          <p className="mt-2 text-[#475569]">
            Estamos obteniendo el detalle y sus fotos.
          </p>
        </section>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] p-6">
        <section className={`mx-auto max-w-6xl ${SECTION_CLASS}`}>
          <h1 className="text-2xl font-bold text-red-700">
            No se pudo cargar el ingreso
          </h1>
          <p className="mt-2 text-[#475569]">{error}</p>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className={SECTION_CLASS}>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[#F3171B]">
                Detalle de ingreso
              </p>
              <h1 className="mt-1 text-3xl font-black text-[#0F172A]">
                Ingreso de Rollizos #{ingreso.id}
              </h1>
            </div>
            <span
              className={`w-fit rounded-full border px-4 py-2 text-sm font-semibold ${
                ingresoAnulado
                  ? "border-red-200 bg-red-50 text-[#DC2626]"
                  : ingreso.estado === "REGISTRADO"
                    ? "border-green-200 bg-green-50 text-[#16A34A]"
                    : "border-slate-300 bg-[#F5F7FA] text-[#475569]"
              }`}
            >
              {ingreso.estado}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Campo label="Fecha ingreso" value={formatearFecha(ingreso.fechaIngreso)} />
            <Campo label="Fecha creación" value={formatearFecha(ingreso.createdAt)} />
            <Campo label="Tipo" value={ingreso.tipoIngreso?.nombre} />
          </div>
        </section>

        {ingresoAnulado ? (
          <section className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-red-800">
              Este ingreso se encuentra ANULADO
            </h2>
            <p className="mt-2 text-red-700">
              El registro se conserva completo para auditoria.
            </p>
          </section>
        ) : (
          <section className={SECTION_CLASS}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#0F172A]">
                  Acciones
                </h2>
                <p className="mt-1 text-sm text-[#475569]">
                  Edita campos administrativos o anula el ingreso con motivo.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setMostrandoEdicion(true)
                    setMostrandoAnulacion(false)
                  }}
                  className="w-fit rounded-lg border border-[#CBD5E1] bg-white px-5 py-3 font-semibold text-[#0F172A] hover:border-[#F3171B] hover:text-[#D90F14] focus:border-[#F3171B] focus:ring-2 focus:ring-red-100"
                >
                  Editar ingreso
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMostrandoAnulacion(true)
                    setMostrandoEdicion(false)
                  }}
                  className="w-fit rounded-lg border border-red-300 bg-white px-5 py-3 font-medium text-red-700 focus:border-red-700 focus:ring-2 focus:ring-red-100"
                >
                  Anular ingreso
                </button>
              </div>
            </div>

            {mostrandoEdicion ? (
              <EditarIngresoPanel
                ingreso={ingreso}
                articulo={articuloPrincipal}
                onCancel={() => setMostrandoEdicion(false)}
                onUpdated={(ingresoActualizado) => {
                  setIngreso(ingresoActualizado)
                  setMostrandoEdicion(false)
                }}
              />
            ) : null}

            {mostrandoAnulacion ? (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4">
                <label className="block text-sm font-medium text-red-800">
                  Motivo de anulacion
                </label>
                <textarea
                  value={motivoAnulacion}
                  onChange={(event) => setMotivoAnulacion(event.target.value)}
                  className="mt-2 min-h-28 w-full rounded-lg border border-red-200 bg-white p-3 text-[#0F172A] outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-red-100"
                  placeholder="Indicar por que se anula este ingreso"
                />
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrandoAnulacion(false)
                      setMotivoAnulacion("")
                    }}
                    className="rounded-lg border border-[#CBD5E1] bg-white px-4 py-2 font-semibold text-[#0F172A] hover:border-[#F3171B] hover:text-[#D90F14]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirmarAnulacion}
                    disabled={anulando}
                    className="rounded-lg bg-red-700 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {anulando ? "Anulando..." : "Confirmar anulacion"}
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        )}

        <PendientesAprobacionCard
          ingreso={ingreso}
          onIngresoActualizado={setIngreso}
        />

        <DocumentacionFexCard ingreso={ingreso} tipo="rollizos" />

        <section className={SECTION_CLASS}>
                <h2 className="mb-4 text-xl font-bold text-[#0F172A]">
            Datos generales
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Campo label="Portero" value={ingreso.registradoPor?.nombre} />
            <Campo label="Remito proveedor" value={ingreso.remitoProveedor} />
            <Campo label="Categoría" value={ingreso.categoriaFormulario?.nombre} />
            <Campo label="Procedencia" value={ingreso.procedencia?.nombre} />
            <div className="md:col-span-4">
              <Campo label="Observaciones" value={ingreso.observaciones} />
            </div>
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="mb-4 text-xl font-bold text-[#0F172A]">
            Proveedor
          </h2>
          <ProveedorBadges ingreso={ingreso} />
          <div className="grid gap-4 md:grid-cols-4">
            <CampoValidado
              label="Código"
              original={ingreso.proveedorCodigoBejerman}
              validado={ingreso.proveedorCodigoValidado}
            />
            <CampoValidado
              label="Razón social"
              original={ingreso.proveedorNombreCargado}
              validado={ingreso.proveedorNombreValidado}
            />
            <CampoValidado
              label="CUIT"
              original={ingreso.proveedorCuitCargado}
              validado={ingreso.proveedorCuitValidado}
            />
            <Campo
              label="Grupo / Subgrupo"
              value={`${mostrar(ingreso.proveedorGrupoBejerman)} / ${mostrar(
                ingreso.proveedorSubgrupoBejerman
              )}`}
            />
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="mb-4 text-xl font-bold text-[#0F172A]">
            Material
          </h2>
          <ArticuloBadges articulo={articuloPrincipal} ingreso={ingreso} />
          <div className="grid gap-4 md:grid-cols-4">
            <CampoValidado
              label="Artículo"
              original={articuloPrincipal?.articuloDescripcion}
              validado={articuloPrincipal?.articuloDescripcionValidada}
            />
            <CampoValidado
              label="Código"
              original={articuloPrincipal?.articuloCodigo}
              validado={articuloPrincipal?.articuloCodigoValidado}
            />
            <Campo label="Cantidad" value={articuloPrincipal?.cantidad} />
            <Campo label="Unidad" value={articuloPrincipal?.unidad} />
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="mb-4 text-xl font-bold text-[#0F172A]">
            Logística
          </h2>
          <ServicioBadges ingreso={ingreso} />
          <div className="grid gap-4 md:grid-cols-3">
            <Campo label="Tipo servicio" value={ingreso.tipoServicioLogistico} />
            <CampoValidado
              label="Servicio logístico"
              original={ingreso.servicioNombreCargado}
              validado={ingreso.servicioNombreValidado}
            />
            <CampoValidado
              label="CUIT servicio"
              original={ingreso.servicioCuitCargado}
              validado={ingreso.servicioCuitValidado}
            />
            <Campo label="Patente camión" value={ingreso.patenteCamion} />
            <Campo label="Patente acoplado" value={ingreso.patenteAcoplado} />
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="mb-4 text-xl font-bold text-[#0F172A]">
            Chofer
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Campo label="Tipo chofer" value={ingreso.tipoChofer} />
            <Campo label="Nombre" value={ingreso.choferNombreCargado} />
            <Campo label="Documento" value={ingreso.choferDocumentoCargado} />
            <Campo label="Legajo" value={ingreso.choferLegajoSjala} />
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="mb-4 text-xl font-bold text-[#0F172A]">
            Hachador
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <CampoValidado
              label="Código"
              original={ingreso.hachadorCodigoBejerman}
              validado={ingreso.hachadorCodigoValidado}
            />
            <CampoValidado
              label="Nombre"
              original={ingreso.hachadorNombreCargado}
              validado={ingreso.hachadorNombreValidado}
            />
            <CampoValidado
              label="CUIT"
              original={ingreso.hachadorCuitCargado}
              validado={ingreso.hachadorCuitValidado}
            />
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="mb-4 text-xl font-bold text-[#0F172A]">Fotos</h2>
          {ingreso.fotos?.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ingreso.fotos.map((foto) => (
                <article
                  key={foto.id}
                  className="overflow-hidden rounded-2xl border border-[#CBD5E1] bg-white shadow-sm"
                >
                  <a
                    href={`/api/uploads/fotos/${foto.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/uploads/fotos/${foto.id}`}
                      alt={TITULOS_FOTO[foto.tipoFoto] || "Foto de ingreso"}
                      className="h-48 w-full object-cover"
                    />
                  </a>
                  <div className="space-y-1 p-4">
                    <h3 className="font-bold text-[#0F172A]">
                      {TITULOS_FOTO[foto.tipoFoto] || foto.tipoFoto}
                    </h3>
                    <p className="text-sm text-[#475569]">
                      {mostrar(foto.nombreOriginal)}
                    </p>
                    <p className="text-sm text-[#475569]">
                      {mostrar(foto.mimeType)} · {formatearBytes(foto.sizeBytes)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-[#475569]">Este ingreso no tiene fotos registradas.</p>
          )}
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="mb-4 text-xl font-bold text-[#0F172A]">Logs</h2>
          {ingreso.logs?.length > 0 ? (
            <div className="space-y-3">
              {ingreso.logs.map((log) => (
                <article
                  key={log.id}
                  className="rounded-xl border border-[#CBD5E1] bg-[#F5F7FA] p-4"
                >
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <p className="font-bold text-[#0F172A]">{log.estado}</p>
                    <p className="text-sm text-[#475569]">
                      {formatearFecha(log.createdAt)}
                    </p>
                  </div>
                  <p className="mt-2 text-[#475569]">{mostrar(log.detalle)}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-[#475569]">Este ingreso no tiene logs registrados.</p>
          )}
        </section>
      </div>
    </main>
  )
}
