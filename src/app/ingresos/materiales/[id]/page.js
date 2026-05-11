"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"

const SECTION_CLASS = "rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
const LABEL_CLASS = "text-sm font-medium text-slate-600"
const VALUE_CLASS = "mt-1 text-base font-semibold text-slate-900"

const TITULOS_FOTO = {
  CAMION_PATENTE: "Camion / patente",
  MATERIAL_CARGADO: "Material cargado",
  REMITO_FISICO: "Remito fisico",
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

export default function DetalleIngresoMaterialesPage() {
  const params = useParams()
  const id = params?.id
  const [ingreso, setIngreso] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const articuloPrincipal = useMemo(
    () => ingreso?.articulos?.[0] || null,
    [ingreso]
  )

  useEffect(() => {
    async function cargarIngreso() {
      setLoading(true)
      setError("")

      try {
        const response = await fetch(`/api/ingresos/materiales/${id}`)
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

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <section className={`mx-auto max-w-6xl ${SECTION_CLASS}`}>
          <h1 className="text-2xl font-bold text-slate-900">
            Cargando ingreso...
          </h1>
          <p className="mt-2 text-slate-600">
            Estamos obteniendo el detalle y sus fotos.
          </p>
        </section>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <section className={`mx-auto max-w-6xl ${SECTION_CLASS}`}>
          <h1 className="text-2xl font-bold text-red-700">
            No se pudo cargar el ingreso
          </h1>
          <p className="mt-2 text-slate-700">{error}</p>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className={SECTION_CLASS}>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Detalle de ingreso
              </p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">
                Ingreso de Materiales #{ingreso.id}
              </h1>
            </div>
            <span className="w-fit rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800">
              {ingreso.estado}
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <Campo label="Fecha ingreso" value={formatearFecha(ingreso.fechaIngreso)} />
            <Campo label="Fecha creacion" value={formatearFecha(ingreso.createdAt)} />
            <Campo label="Tipo" value={ingreso.tipoIngreso?.nombre} />
            <Campo label="Categoria" value={ingreso.categoriaFormulario?.nombre} />
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Datos generales
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Campo label="Portero" value={ingreso.registradoPor?.nombre} />
            <Campo label="Remito proveedor" value={ingreso.remitoProveedor} />
            <Campo label="Categoria" value={ingreso.categoriaFormulario?.nombre} />
            <div className="md:col-span-3">
              <Campo label="Observaciones" value={ingreso.observaciones} />
            </div>
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Proveedor
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Campo label="Codigo" value={ingreso.proveedorCodigoBejerman} />
            <Campo label="Razon social" value={ingreso.proveedorNombreCargado} />
            <Campo label="CUIT" value={ingreso.proveedorCuitCargado} />
            <Campo
              label="Grupo / Subgrupo"
              value={`${mostrar(ingreso.proveedorGrupoBejerman)} / ${mostrar(
                ingreso.proveedorSubgrupoBejerman
              )}`}
            />
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Material
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Campo
              label="Categoria"
              value={
                ingreso.categoriaFormulario?.nombre ||
                articuloPrincipal?.categoriaFormulario
              }
            />
            <Campo label="Articulo" value={articuloPrincipal?.articuloDescripcion} />
            <Campo label="Codigo" value={articuloPrincipal?.articuloCodigo} />
            <Campo
              label="Cantidad"
              value={`${mostrar(articuloPrincipal?.cantidad)} ${mostrar(
                articuloPrincipal?.unidad
              )}`}
            />
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Logistica
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Campo label="Tipo servicio" value={ingreso.tipoServicioLogistico} />
            <Campo label="Servicio logistico" value={ingreso.servicioNombreCargado} />
            <Campo label="CUIT servicio" value={ingreso.servicioCuitCargado} />
            <Campo label="Patente camion" value={ingreso.patenteCamion} />
            <Campo label="Patente acoplado" value={ingreso.patenteAcoplado} />
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
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
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Fotos</h2>
          {ingreso.fotos?.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ingreso.fotos.map((foto) => (
                <article
                  key={foto.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
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
                    <h3 className="font-semibold text-slate-900">
                      {TITULOS_FOTO[foto.tipoFoto] || foto.tipoFoto}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {mostrar(foto.nombreOriginal)}
                    </p>
                    <p className="text-sm text-slate-600">
                      {mostrar(foto.mimeType)} - {formatearBytes(foto.sizeBytes)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-slate-600">Este ingreso no tiene fotos registradas.</p>
          )}
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Logs</h2>
          {ingreso.logs?.length > 0 ? (
            <div className="space-y-3">
              {ingreso.logs.map((log) => (
                <article
                  key={log.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <p className="font-semibold text-slate-900">{log.estado}</p>
                    <p className="text-sm text-slate-600">
                      {formatearFecha(log.createdAt)}
                    </p>
                  </div>
                  <p className="mt-2 text-slate-700">{mostrar(log.detalle)}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-slate-600">Este ingreso no tiene logs registrados.</p>
          )}
        </section>
      </div>
    </main>
  )
}
