"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

const SECTION_CLASS = "rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
const LABEL_CLASS = "mb-1 block font-medium text-slate-800"
const FIELD_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
const TEXTAREA_CLASS =
  "min-h-28 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"

const CATEGORIAS_MATERIALES = [
  { codigo: "PALLETS", nombre: "Pallets" },
  { codigo: "TABLAS_ASERRADAS", nombre: "Tablas aserradas" },
  { codigo: "TABLAS_CEPILLADAS", nombre: "Tablas cepilladas" },
  { codigo: "TACOS", nombre: "Tacos" },
  { codigo: "TERCIADO", nombre: "Terciado" },
  { codigo: "ESQUINEROS", nombre: "Esquineros" },
  { codigo: "FONDOS", nombre: "Fondos" },
  { codigo: "INTERIOR", nombre: "Interior" },
]

async function fetchDimension(url) {
  const response = await fetch(url)
  const json = await response.json().catch(() => null)

  if (!response.ok || !json?.ok) {
    throw new Error(
      json?.message || json?.error || `No se pudo consultar ${url}`
    )
  }

  return json.data || []
}

function fechaActual() {
  return new Date().toISOString().slice(0, 10)
}

function etiquetaEntidad(item) {
  if (!item) return ""

  const codigo = item.Codigo ? `${item.Codigo} - ` : ""

  return `${codigo}${item.RazonSocial || "Sin razon social"}`
}

function etiquetaArticulo(item) {
  if (!item) return ""

  return item.Descripcion || "Sin descripcion"
}

function etiquetaPersona(item) {
  if (!item) return ""

  return item.NombreCompleto || "Sin nombre"
}

function buscarPorCodigo(items, codigo) {
  return items.find((item) => String(item.Codigo) === String(codigo)) || null
}

function buscarPorLegajo(items, legajo) {
  return items.find((item) => String(item.Legajo) === String(legajo)) || null
}

function categoriaProveedor(categoria) {
  return categoria === "ESQUINEROS" ? "ESQUINEROS" : "MATERIA_PRIMA"
}

function servicioFleteroUrl(categoria) {
  const categoriaServicio =
    categoria === "ESQUINEROS" ? "ESQUINEROS" : "MATERIA_PRIMA"

  return `/api/dimensiones/servicios-logisticos?categoria=${categoriaServicio}`
}

function FotoField({ label, name, register, error, preview, required = false }) {
  return (
    <div>
      <label className={LABEL_CLASS}>
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        {...register(name, {
          validate: required
            ? (files) => files?.length > 0 || `${label} es obligatoria`
            : undefined,
        })}
        className={FIELD_CLASS}
      />
      {error ? <p className="mt-1 text-sm text-red-600">{error.message}</p> : null}
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt={`Vista previa ${label}`}
          className="mt-3 h-48 w-full rounded-lg border border-slate-300 object-cover"
        />
      ) : null}
    </div>
  )
}

export default function IngresoMaterialesPage() {
  const [loadingInicial, setLoadingInicial] = useState(true)
  const [loadingCategoria, setLoadingCategoria] = useState(false)
  const [error, setError] = useState("")
  const [errorCategoria, setErrorCategoria] = useState("")
  const [porteros, setPorteros] = useState([])
  const [choferes, setChoferes] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [articulos, setArticulos] = useState([])
  const [servicios, setServicios] = useState([])
  const [previewsFotos, setPreviewsFotos] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [ingresoGuardadoId, setIngresoGuardadoId] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fechaIngreso: fechaActual(),
      categoriaMaterial: "",
      tipoServicio: "FLETERO",
      tipoChofer: "INTERNO",
      unidad: "",
    },
  })

  const categoriaMaterial = useWatch({
    control,
    name: "categoriaMaterial",
    defaultValue: "",
  })
  const proveedorCodigo = useWatch({ control, name: "proveedorCodigo" })
  const articuloCodigo = useWatch({ control, name: "articuloCodigo" })
  const servicioCodigo = useWatch({ control, name: "servicioCodigo" })
  const choferLegajo = useWatch({ control, name: "choferLegajo" })
  const porteroLegajo = useWatch({ control, name: "porteroLegajo" })
  const tipoServicio = useWatch({
    control,
    name: "tipoServicio",
    defaultValue: "FLETERO",
  })
  const tipoChofer = useWatch({
    control,
    name: "tipoChofer",
    defaultValue: "INTERNO",
  })
  const fotoCamionPatente = useWatch({ control, name: "fotoCamionPatente" })
  const fotoMaterialCargado = useWatch({ control, name: "fotoMaterialCargado" })
  const fotoRemitoFisico = useWatch({ control, name: "fotoRemitoFisico" })
  const fotoAdicional = useWatch({ control, name: "fotoAdicional" })

  const proveedorSeleccionado = useMemo(
    () => buscarPorCodigo(proveedores, proveedorCodigo),
    [proveedores, proveedorCodigo]
  )

  const articuloSeleccionado = useMemo(
    () => buscarPorCodigo(articulos, articuloCodigo),
    [articulos, articuloCodigo]
  )

  const servicioSeleccionado = useMemo(
    () => buscarPorCodigo(servicios, servicioCodigo),
    [servicios, servicioCodigo]
  )

  const choferSeleccionado = useMemo(
    () => buscarPorLegajo(choferes, choferLegajo),
    [choferes, choferLegajo]
  )

  const porteroSeleccionado = useMemo(
    () => buscarPorLegajo(porteros, porteroLegajo),
    [porteros, porteroLegajo]
  )

  useEffect(() => {
    async function cargarDatosIniciales() {
      setLoadingInicial(true)
      setError("")

      try {
        const [porterosData, choferesData] = await Promise.all([
          fetchDimension("/api/dimensiones/porteros"),
          fetchDimension("/api/dimensiones/choferes"),
        ])

        setPorteros(porterosData)
        setChoferes(choferesData)
      } catch (err) {
        setError(err.message || "No se pudieron cargar porteros y choferes")
      } finally {
        setLoadingInicial(false)
      }
    }

    cargarDatosIniciales()
  }, [])

  useEffect(() => {
    async function cargarDatosCategoria() {
      if (!categoriaMaterial) {
        setArticulos([])
        setProveedores([])
        setServicios([])
        return
      }

      setLoadingCategoria(true)
      setErrorCategoria("")
      setValue("proveedorCodigo", "")
      setValue("articuloCodigo", "")
      setValue("servicioCodigo", "")

      try {
        const proveedorCategoria = categoriaProveedor(categoriaMaterial)
        const servicioUrl =
          tipoServicio === "TRANSPORTE"
            ? "/api/dimensiones/servicios-logisticos?tipo=TRANSPORTE"
            : servicioFleteroUrl(categoriaMaterial)

        const [articulosData, proveedoresData, serviciosData] =
          await Promise.all([
            fetchDimension(
              `/api/dimensiones/articulos?categoria=${categoriaMaterial}`
            ),
            fetchDimension(
              `/api/dimensiones/proveedores?categoria=${proveedorCategoria}`
            ),
            fetchDimension(servicioUrl),
          ])

        setArticulos(articulosData)
        setProveedores(proveedoresData)
        setServicios(serviciosData)
      } catch (err) {
        setErrorCategoria(
          err.message || "No se pudieron cargar datos de la categoria"
        )
      } finally {
        setLoadingCategoria(false)
      }
    }

    cargarDatosCategoria()
  }, [categoriaMaterial, setValue, tipoServicio])

  useEffect(() => {
    if (articuloSeleccionado?.Clase) {
      setValue("unidad", articuloSeleccionado.Clase)
    }
  }, [articuloSeleccionado, setValue])

  useEffect(() => {
    const fotos = {
      fotoCamionPatente,
      fotoMaterialCargado,
      fotoRemitoFisico,
      fotoAdicional,
    }
    const previews = {}

    Object.entries(fotos).forEach(([campo, files]) => {
      const file = files?.[0]

      if (file) {
        previews[campo] = URL.createObjectURL(file)
      }
    })

    // Object URLs are external browser resources; keep preview state tied to file inputs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewsFotos(previews)

    return () => {
      Object.values(previews).forEach((url) => URL.revokeObjectURL(url))
    }
  }, [fotoCamionPatente, fotoMaterialCargado, fotoRemitoFisico, fotoAdicional])

  function limpiarFormulario() {
    reset({
      fechaIngreso: fechaActual(),
      categoriaMaterial: "",
      tipoServicio: "FLETERO",
      tipoChofer: "INTERNO",
      unidad: "",
    })
    setProveedores([])
    setArticulos([])
    setServicios([])
    setPreviewsFotos({})
    setIngresoGuardadoId(null)
  }

  function metadataArchivo(file) {
    return file
      ? {
          nombre: file.name,
          tipo: file.type,
          tamanio: file.size,
        }
      : null
  }

  async function onSubmit(values) {
    const fotoCamionPatenteFile = values.fotoCamionPatente?.[0]
    const fotoMaterialCargadoFile = values.fotoMaterialCargado?.[0]
    const fotoRemitoFisicoFile = values.fotoRemitoFisico?.[0]
    const fotoAdicionalFile = values.fotoAdicional?.[0]

    if (!fotoCamionPatenteFile) {
      toast.error("La foto del camion / patente es obligatoria")
      return
    }

    if (!fotoMaterialCargadoFile) {
      toast.error("La foto del material cargado es obligatoria")
      return
    }

    try {
      setGuardando(true)
      setIngresoGuardadoId(null)

      const {
        fotoCamionPatente,
        fotoMaterialCargado,
        fotoRemitoFisico,
        fotoAdicional,
        ...datosIngreso
      } = values

      const ingresoPreparado = {
        ...datosIngreso,
        categoriaMaterial,
        proveedorSeleccionado,
        articuloSeleccionado,
        servicioSeleccionado,
        choferSeleccionado:
          tipoChofer === "INTERNO" ? choferSeleccionado : null,
        porteroSeleccionado,
        fotosRegistro: {
          camionPatente: metadataArchivo(fotoCamionPatenteFile),
          materialCargado: metadataArchivo(fotoMaterialCargadoFile),
          remitoFisico: metadataArchivo(fotoRemitoFisicoFile),
          adicional: metadataArchivo(fotoAdicionalFile),
        },
      }

      const formData = new FormData()
      formData.append("payload", JSON.stringify(ingresoPreparado))
      formData.append("fotoCamionPatente", fotoCamionPatenteFile)
      formData.append("fotoMaterialCargado", fotoMaterialCargadoFile)

      if (fotoRemitoFisicoFile) {
        formData.append("fotoRemitoFisico", fotoRemitoFisicoFile)
      }

      if (fotoAdicionalFile) {
        formData.append("fotoAdicional", fotoAdicionalFile)
      }

      console.log("Ingreso de materiales preparado:", ingresoPreparado)

      const response = await fetch("/api/ingresos/materiales", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "No se pudo guardar el ingreso")
      }

      console.log("Ingreso de materiales guardado:", result.ingreso)
      setIngresoGuardadoId(result.ingreso?.id || null)
      toast.success("Ingreso de materiales guardado correctamente")
    } catch (error) {
      console.error("Error guardando ingreso de materiales:", error)
      toast.error(error.message || "Error guardando ingreso de materiales")
    } finally {
      setGuardando(false)
    }
  }

  if (loadingInicial) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <section className={`mx-auto max-w-5xl ${SECTION_CLASS}`}>
          <h1 className="text-2xl font-bold text-slate-900">
            Cargando formulario...
          </h1>
          <p className="mt-3 text-slate-600">
            Estamos consultando porteros y choferes.
          </p>
        </section>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <section className={`mx-auto max-w-5xl ${SECTION_CLASS}`}>
          <h1 className="text-2xl font-bold text-red-700">
            Error cargando formulario
          </h1>
          <p className="mt-3 text-slate-700">{error}</p>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto max-w-6xl space-y-6"
      >
        <header className={SECTION_CLASS}>
          <h1 className="text-3xl font-bold text-slate-900">
            Ingreso de Materiales
          </h1>
          <p className="mt-2 text-slate-600">
            Formulario para registrar ingresos de materiales con fotos en
            porteria.
          </p>
        </header>

        <section className={SECTION_CLASS}>
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Datos generales
          </h2>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className={LABEL_CLASS}>Fecha de ingreso</label>
              <input
                type="date"
                {...register("fechaIngreso", { required: true })}
                className={FIELD_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Portero</label>
              <select
                {...register("porteroLegajo", { required: true })}
                className={FIELD_CLASS}
              >
                <option value="">Seleccionar portero</option>
                {porteros.map((item) => (
                  <option key={item.Legajo} value={item.Legajo}>
                    {etiquetaPersona(item)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Categoria de material</label>
              <select
                {...register("categoriaMaterial", { required: true })}
                className={FIELD_CLASS}
              >
                <option value="">Seleccionar categoria</option>
                {CATEGORIAS_MATERIALES.map((categoria) => (
                  <option key={categoria.codigo} value={categoria.codigo}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Remito proveedor</label>
              <input
                type="text"
                {...register("remitoProveedor")}
                className={FIELD_CLASS}
                placeholder="Numero de remito"
              />
            </div>
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-slate-900">
              Proveedor y material
            </h2>
            {loadingCategoria ? (
              <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
                Cargando datos de categoria...
              </span>
            ) : null}
          </div>

          {errorCategoria ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorCategoria}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Proveedor</label>
              <select
                {...register("proveedorCodigo", { required: true })}
                className={FIELD_CLASS}
                disabled={!categoriaMaterial || loadingCategoria}
              >
                <option value="">Seleccionar proveedor</option>
                {proveedores.map((item) => (
                  <option key={item.Codigo} value={item.Codigo}>
                    {etiquetaEntidad(item)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Articulo</label>
              <select
                {...register("articuloCodigo", { required: true })}
                className={FIELD_CLASS}
                disabled={!categoriaMaterial || loadingCategoria}
              >
                <option value="">Seleccionar articulo</option>
                {articulos.map((item) => (
                  <option key={item.Codigo} value={item.Codigo}>
                    {etiquetaArticulo(item)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Cantidad</label>
              <input
                type="number"
                step="0.001"
                {...register("cantidad", { required: true })}
                className={FIELD_CLASS}
                placeholder="Ej: 12.500"
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Unidad</label>
              <input
                type="text"
                {...register("unidad", { required: true })}
                className={FIELD_CLASS}
              />
            </div>
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Logistica y chofer
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Tipo de servicio logistico</label>
              <select {...register("tipoServicio")} className={FIELD_CLASS}>
                <option value="FLETERO">Fletero</option>
                <option value="TRANSPORTE">Transporte</option>
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Servicio logistico</label>
              <select
                {...register("servicioCodigo")}
                className={FIELD_CLASS}
                disabled={!categoriaMaterial || loadingCategoria}
              >
                <option value="">Seleccionar servicio</option>
                {servicios.map((item) => (
                  <option key={item.Codigo} value={item.Codigo}>
                    {etiquetaEntidad(item)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Tipo de chofer</label>
              <select {...register("tipoChofer")} className={FIELD_CLASS}>
                <option value="INTERNO">Interno</option>
                <option value="EXTERNO">Externo</option>
              </select>
            </div>

            {tipoChofer === "INTERNO" ? (
              <div>
                <label className={LABEL_CLASS}>Chofer interno</label>
                <select {...register("choferLegajo")} className={FIELD_CLASS}>
                  <option value="">Seleccionar chofer</option>
                  {choferes.map((item) => (
                    <option key={item.Legajo} value={item.Legajo}>
                      {etiquetaPersona(item)}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className={LABEL_CLASS}>Nombre chofer externo</label>
                  <input
                    type="text"
                    {...register("choferNombreExterno")}
                    className={FIELD_CLASS}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Documento chofer externo
                  </label>
                  <input
                    type="text"
                    {...register("choferDocumentoExterno")}
                    className={FIELD_CLASS}
                  />
                </div>
              </>
            )}

            <div>
              <label className={LABEL_CLASS}>Patente camion</label>
              <input
                type="text"
                {...register("patenteCamion")}
                className={`${FIELD_CLASS} uppercase`}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Patente acoplado</label>
              <input
                type="text"
                {...register("patenteAcoplado")}
                className={`${FIELD_CLASS} uppercase`}
              />
            </div>
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Registro fotografico
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <FotoField
              label="Foto del camion / patente"
              name="fotoCamionPatente"
              register={register}
              error={errors.fotoCamionPatente}
              preview={previewsFotos.fotoCamionPatente}
              required
            />
            <FotoField
              label="Foto del material cargado"
              name="fotoMaterialCargado"
              register={register}
              error={errors.fotoMaterialCargado}
              preview={previewsFotos.fotoMaterialCargado}
              required
            />
            <FotoField
              label="Foto del remito fisico"
              name="fotoRemitoFisico"
              register={register}
              preview={previewsFotos.fotoRemitoFisico}
            />
            <FotoField
              label="Foto adicional"
              name="fotoAdicional"
              register={register}
              preview={previewsFotos.fotoAdicional}
            />
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Observaciones
          </h2>
          <textarea
            {...register("observaciones")}
            className={TEXTAREA_CLASS}
            placeholder="Observaciones del ingreso"
          />
        </section>

        <div className={`flex flex-col justify-end gap-3 sm:flex-row ${SECTION_CLASS}`}>
          {ingresoGuardadoId ? (
            <a
              href={`/ingresos/materiales/${ingresoGuardadoId}`}
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-medium text-slate-800 focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            >
              Ver ingreso registrado
            </a>
          ) : null}

          <button
            type="button"
            onClick={limpiarFormulario}
            className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-medium text-slate-800 focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          >
            Limpiar formulario
          </button>

          <button
            type="submit"
            disabled={guardando}
            className="rounded-lg bg-slate-900 px-5 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Guardar ingreso"}
          </button>
        </div>
      </form>
    </main>
  )
}
