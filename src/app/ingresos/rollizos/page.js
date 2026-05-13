"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import SearchableSelect, {
  ModoBusquedaInline,
} from "@/components/forms/SearchableSelect"

const SECTION_CLASS =
  "rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm shadow-slate-200/70"
const LABEL_CLASS = "mb-1 block font-semibold text-[#0F172A]"
const FIELD_CLASS =
  "w-full rounded-lg border border-[#CBD5E1] bg-white p-3 text-[#0F172A] placeholder:text-slate-400 outline-none focus:border-[#F3171B] focus:ring-2 focus:ring-red-100"
const TEXTAREA_CLASS =
  "min-h-28 w-full rounded-lg border border-[#CBD5E1] bg-white p-3 text-[#0F172A] placeholder:text-slate-400 outline-none focus:border-[#F3171B] focus:ring-2 focus:ring-red-100"
const MODO_SUGERIDOS = "SUGERIDOS"
const MODO_TODOS = "TODOS"

async function fetchDimensionSegura(url) {
  const response = await fetch(url)
  const json = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      json?.message ||
        json?.error ||
        `Error consultando ${url} (${response.status})`
    )
  }

  if (!json?.ok) {
    throw new Error(json?.message || `Respuesta inválida desde ${url}`)
  }

  return json.data || []
}

export default function IngresoRollizosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)

  const [proveedores, setProveedores] = useState([])
  const [articulos, setArticulos] = useState([])
  const [servicios, setServicios] = useState([])
  const [hachadores, setHachadores] = useState([])
  const [choferes, setChoferes] = useState([])
  const [porteros, setPorteros] = useState([])
  const [modoProveedor, setModoProveedor] = useState(MODO_SUGERIDOS)
  const [modoArticulo, setModoArticulo] = useState(MODO_SUGERIDOS)
  const [modoServicio, setModoServicio] = useState(MODO_SUGERIDOS)
  const [cargandoDimensiones, setCargandoDimensiones] = useState({})
  const [previewsFotos, setPreviewsFotos] = useState({})
  const [fotoInputKeys, setFotoInputKeys] = useState({
    fotoCamionPatente: 0,
    fotoMaterialCargado: 0,
    fotoRemitoFisico: 0,
    fotoAdicional: 0,
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fechaIngreso: new Date().toISOString().slice(0, 10),
      tipoServicio: "FLETERO",
      tipoChofer: "INTERNO",
      unidad: "TN",
    },
  })

  const proveedorCodigo = watch("proveedorCodigo")
  const articuloCodigo = watch("articuloCodigo")
  const servicioCodigo = watch("servicioCodigo")
  const hachadorCodigo = watch("hachadorCodigo")
  const choferLegajo = watch("choferLegajo")
  const porteroLegajo = watch("porteroLegajo")
  const tipoServicio = watch("tipoServicio")
  const tipoChofer = watch("tipoChofer")
  const fotoCamionPatente = watch("fotoCamionPatente")
  const fotoMaterialCargado = watch("fotoMaterialCargado")
  const fotoRemitoFisico = watch("fotoRemitoFisico")
  const fotoAdicional = watch("fotoAdicional")

  const proveedorSeleccionado = useMemo(
    () => proveedores.find((item) => item.Codigo === proveedorCodigo) || null,
    [proveedores, proveedorCodigo]
  )

  const articuloSeleccionado = useMemo(
    () => articulos.find((item) => item.Codigo === articuloCodigo) || null,
    [articulos, articuloCodigo]
  )

  const servicioSeleccionado = useMemo(
    () => servicios.find((item) => item.Codigo === servicioCodigo) || null,
    [servicios, servicioCodigo]
  )

  const hachadorSeleccionado = useMemo(
    () => hachadores.find((item) => item.Codigo === hachadorCodigo) || null,
    [hachadores, hachadorCodigo]
  )

  const choferSeleccionado = useMemo(
    () =>
      choferes.find((item) => String(item.Legajo) === String(choferLegajo)) ||
      null,
    [choferes, choferLegajo]
  )

  const porteroSeleccionado = useMemo(
    () =>
      porteros.find((item) => String(item.Legajo) === String(porteroLegajo)) ||
      null,
    [porteros, porteroLegajo]
  )

  function proveedorUrl(modo) {
    return modo === MODO_TODOS
      ? "/api/dimensiones/proveedores?modo=TODOS"
      : "/api/dimensiones/proveedores?categoria=ROLLIZOS"
  }

  function articuloUrl(modo) {
    return modo === MODO_TODOS
      ? "/api/dimensiones/articulos?modo=TODOS"
      : "/api/dimensiones/articulos?categoria=ROLLIZOS"
  }

  function servicioUrl(tipo, modo) {
    if (modo === MODO_TODOS) {
      return "/api/dimensiones/servicios-logisticos?modo=TODOS"
    }

    return tipo === "TRANSPORTE"
      ? "/api/dimensiones/servicios-logisticos?tipo=TRANSPORTE"
      : "/api/dimensiones/servicios-logisticos?categoria=ROLLIZOS"
  }

  function setCargandoDimension(nombre, value) {
    setCargandoDimensiones((prev) => ({
      ...prev,
      [nombre]: value,
    }))
  }

  async function cambiarModoProveedor(modo) {
    if (modo === modoProveedor) return

    setModoProveedor(modo)
    setValue("proveedorCodigo", "")
    setCargandoDimension("proveedor", true)

    try {
      const data = await fetchDimensionSegura(proveedorUrl(modo))
      setProveedores(data)
      if (modo === MODO_TODOS) toast.info("Mostrando todos los proveedores")
    } catch (err) {
      toast.error(err.message || "No se pudieron cargar proveedores")
    } finally {
      setCargandoDimension("proveedor", false)
    }
  }

  async function cambiarModoArticulo(modo) {
    if (modo === modoArticulo) return

    setModoArticulo(modo)
    setValue("articuloCodigo", "")
    setCargandoDimension("articulo", true)

    try {
      const data = await fetchDimensionSegura(articuloUrl(modo))
      setArticulos(data)
      if (modo === MODO_TODOS) toast.info("Mostrando todos los articulos")
    } catch (err) {
      toast.error(err.message || "No se pudieron cargar articulos")
    } finally {
      setCargandoDimension("articulo", false)
    }
  }

  async function cambiarModoServicio(modo) {
    if (modo === modoServicio) return

    setModoServicio(modo)
    setValue("servicioCodigo", "")
    setCargandoDimension("servicio", true)

    try {
      const data = await fetchDimensionSegura(servicioUrl(tipoServicio, modo))
      setServicios(data)
      if (modo === MODO_TODOS) toast.info("Mostrando todos los servicios")
    } catch (err) {
      toast.error(err.message || "No se pudieron cargar servicios")
    } finally {
      setCargandoDimension("servicio", false)
    }
  }

  async function cargarDimensionesIniciales() {
    try {
      console.log("Cargando dimensiones...")
      setLoading(true)
      setError("")

      const [
        proveedoresData,
        articulosData,
        serviciosData,
        hachadoresData,
        choferesData,
        porterosData,
      ] = await Promise.all([
        fetchDimensionSegura(proveedorUrl(modoProveedor)),
        fetchDimensionSegura(articuloUrl(modoArticulo)),
        fetchDimensionSegura(servicioUrl(tipoServicio, modoServicio)),
        fetchDimensionSegura("/api/dimensiones/hachadores?categoria=ROLLIZOS"),
        fetchDimensionSegura("/api/dimensiones/choferes"),
        fetchDimensionSegura("/api/dimensiones/porteros"),
      ])

      setProveedores(proveedoresData)
      setArticulos(articulosData)
      setServicios(serviciosData)
      setHachadores(hachadoresData)
      setChoferes(choferesData)
      setPorteros(porterosData)

      console.log("Dimensiones cargadas correctamente")
    } catch (err) {
      setError(err.message || "Error cargando dimensiones")
    } finally {
      setLoading(false)
    }
  }

  async function cargarServiciosPorTipo(tipo) {
    try {
      const data = await fetchDimensionSegura(servicioUrl(tipo, modoServicio))
      setServicios(data)
      setValue("servicioCodigo", "")
    } catch (err) {
      console.warn(err)
      toast.error("No se pudieron cargar los servicios logísticos")
    }
  }

  useEffect(() => {
    cargarDimensionesIniciales()
  }, [])

  useEffect(() => {
    if (!articuloSeleccionado) return

    if (articuloSeleccionado.Clase) {
      setValue("unidad", articuloSeleccionado.Clase)
    }
  }, [articuloSeleccionado, setValue])

  useEffect(() => {
    if (!tipoServicio) return

    cargarServiciosPorTipo(tipoServicio)
  }, [tipoServicio, modoServicio])

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

    setPreviewsFotos(previews)

    return () => {
      Object.values(previews).forEach((url) => URL.revokeObjectURL(url))
    }
  }, [fotoCamionPatente, fotoMaterialCargado, fotoRemitoFisico, fotoAdicional])

  function quitarFoto(campo) {
    setValue(campo, undefined, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
    setPreviewsFotos((prev) => {
      const siguiente = { ...prev }
      delete siguiente[campo]
      return siguiente
    })
    setFotoInputKeys((prev) => ({
      ...prev,
      [campo]: prev[campo] + 1,
    }))
  }

  async function onSubmit(values) {
    if (guardando) return

    try {
      const fotoCamionPatenteFile = values.fotoCamionPatente?.[0]
      const fotoMaterialCargadoFile = values.fotoMaterialCargado?.[0]
      const fotoRemitoFisicoFile = values.fotoRemitoFisico?.[0]
      const fotoAdicionalFile = values.fotoAdicional?.[0]

      if (!fotoCamionPatenteFile) {
        toast.error("La foto del camión / patente es obligatoria")
        return
      }

      if (!fotoMaterialCargadoFile) {
        toast.error("La foto del material cargado es obligatoria")
        return
      }

      setGuardando(true)

      const {
        fotoCamionPatente,
        fotoMaterialCargado,
        fotoRemitoFisico,
        fotoAdicional,
        ...datosIngreso
      } = values

      const ingresoPreparado = {
        ...datosIngreso,
        proveedorSeleccionado,
        proveedorModoBusqueda: modoProveedor,
        articuloSeleccionado,
        articuloModoBusqueda: modoArticulo,
        servicioSeleccionado,
        servicioModoBusqueda: modoServicio,
        hachadorSeleccionado,
        choferSeleccionado:
          tipoChofer === "INTERNO" ? choferSeleccionado : null,
        porteroSeleccionado,
        fotosRegistro: {
          camionPatente: {
            nombre: fotoCamionPatenteFile.name,
            tipo: fotoCamionPatenteFile.type,
            tamanio: fotoCamionPatenteFile.size,
          },
          materialCargado: {
            nombre: fotoMaterialCargadoFile.name,
            tipo: fotoMaterialCargadoFile.type,
            tamanio: fotoMaterialCargadoFile.size,
          },
          remitoFisico: fotoRemitoFisicoFile
            ? {
                nombre: fotoRemitoFisicoFile.name,
                tipo: fotoRemitoFisicoFile.type,
                tamanio: fotoRemitoFisicoFile.size,
              }
            : null,
          adicional: fotoAdicionalFile
            ? {
                nombre: fotoAdicionalFile.name,
                tipo: fotoAdicionalFile.type,
                tamanio: fotoAdicionalFile.size,
              }
            : null,
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

      console.log("Ingreso preparado:", ingresoPreparado)

      const response = await fetch("/api/ingresos/rollizos", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "No se pudo guardar el ingreso")
      }

      console.log("Ingreso guardado:", result.ingreso)

      const ingresoId = result.ingreso?.id

      toast.success("Ingreso de rollizos guardado correctamente")

      if (ingresoId) {
        router.push(`/ingresos/rollizos/${ingresoId}`)
      }
    } catch (error) {
      console.error("Error guardando ingreso:", error)
      toast.error(error.message || "Error guardando ingreso")
    } finally {
      setGuardando(false)
    }
  }

  function limpiarFormulario() {
    reset({
      fechaIngreso: new Date().toISOString().slice(0, 10),
      tipoServicio: "FLETERO",
      tipoChofer: "INTERNO",
      unidad: "TN",
    })
    setPreviewsFotos({})
    setFotoInputKeys((prev) => ({
      fotoCamionPatente: prev.fotoCamionPatente + 1,
      fotoMaterialCargado: prev.fotoMaterialCargado + 1,
      fotoRemitoFisico: prev.fotoRemitoFisico + 1,
      fotoAdicional: prev.fotoAdicional + 1,
    }))
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] p-6">
        <div className={`mx-auto max-w-5xl ${SECTION_CLASS}`}>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            Cargando formulario...
          </h1>
          <p className="mt-3 text-[#475569]">
            Estamos consultando proveedores, artículos, choferes, porteros y
            hachadores.
          </p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] p-6">
        <div className={`mx-auto max-w-5xl ${SECTION_CLASS}`}>
          <h1 className="text-2xl font-bold text-red-700">
            Error cargando formulario
          </h1>
          <p className="mt-3 text-[#475569]">{error}</p>
          <button
            type="button"
            onClick={cargarDimensionesIniciales}
            className="mt-5 rounded-lg bg-[#F3171B] px-4 py-2 font-semibold text-white hover:bg-[#D90F14]"
          >
            Reintentar
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] p-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto max-w-6xl space-y-6"
      >
        <header className={SECTION_CLASS}>
          <h1 className="text-3xl font-black text-[#0F172A]">
            Ingreso de Rollizos
          </h1>
          <p className="mt-2 text-[#475569]">
            Formulario inicial para registrar el ingreso de rollizos en
            portería.
          </p>
        </header>

        <section className={SECTION_CLASS}>
          <h2 className="mb-4 text-xl font-bold text-[#0F172A]">
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
                    {item.NombreCompleto}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>
                Remito proveedor
              </label>
              <input
                type="text"
                {...register("remitoProveedor")}
                className={FIELD_CLASS}
                placeholder="Número de remito"
              />
            </div>
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="mb-4 text-xl font-bold text-[#0F172A]">
            Proveedor y material
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <input
                type="hidden"
                {...register("proveedorCodigo", { required: true })}
              />
              <SearchableSelect
                label="Proveedor"
                value={proveedorCodigo}
                options={proveedores}
                onChange={(item) =>
                  setValue("proveedorCodigo", item?.Codigo || "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                getOptionValue={(item) => item.Codigo}
                getOptionLabel={(item) => `${item.Codigo} - ${item.RazonSocial}`}
                getSearchText={(item) => `${item.Codigo} ${item.RazonSocial}`}
                placeholder="Buscar proveedor"
                loading={cargandoDimensiones.proveedor}
                modeControl={
                  <ModoBusquedaInline
                    value={modoProveedor}
                    onChange={cambiarModoProveedor}
                    disabled={cargandoDimensiones.proveedor}
                  />
                }
              />
            </div>

            <div>
              <input
                type="hidden"
                {...register("articuloCodigo", { required: true })}
              />
              <SearchableSelect
                label="Articulo"
                value={articuloCodigo}
                options={articulos}
                onChange={(item) =>
                  setValue("articuloCodigo", item?.Codigo || "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                getOptionValue={(item) => item.Codigo}
                getOptionLabel={(item) => item.Descripcion}
                getSearchText={(item) => `${item.Codigo} ${item.Descripcion}`}
                placeholder="Buscar articulo"
                loading={cargandoDimensiones.articulo}
                modeControl={
                  <ModoBusquedaInline
                    value={modoArticulo}
                    onChange={cambiarModoArticulo}
                    disabled={cargandoDimensiones.articulo}
                  />
                }
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Cantidad</label>
              <input
                type="number"
                step="0.001"
                {...register("cantidad", { required: true })}
                className={FIELD_CLASS}
                placeholder="Ej: 28.500"
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
          <h2 className="mb-4 text-xl font-bold text-[#0F172A]">
            Logística y chofer
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>
                Tipo de servicio logístico
              </label>
              <select
                {...register("tipoServicio")}
                className={FIELD_CLASS}
              >
                <option value="FLETERO">Fletero</option>
                <option value="TRANSPORTE">Transporte</option>
              </select>
            </div>

            <div>
              <input type="hidden" {...register("servicioCodigo")} />
              <SearchableSelect
                label="Servicio logistico"
                value={servicioCodigo}
                options={servicios}
                onChange={(item) =>
                  setValue("servicioCodigo", item?.Codigo || "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                getOptionValue={(item) => item.Codigo}
                getOptionLabel={(item) => `${item.Codigo} - ${item.RazonSocial}`}
                getSearchText={(item) => `${item.Codigo} ${item.RazonSocial}`}
                placeholder="Buscar servicio"
                loading={cargandoDimensiones.servicio}
                modeControl={
                  <ModoBusquedaInline
                    value={modoServicio}
                    onChange={cambiarModoServicio}
                    disabled={cargandoDimensiones.servicio}
                  />
                }
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Tipo de chofer</label>
              <select
                {...register("tipoChofer")}
                className={FIELD_CLASS}
              >
                <option value="INTERNO">Interno</option>
                <option value="EXTERNO">Externo</option>
              </select>
            </div>

            {tipoChofer === "INTERNO" ? (
              <div>
                <label className={LABEL_CLASS}>Chofer interno</label>
                <select
                  {...register("choferLegajo")}
                  className={FIELD_CLASS}
                >
                  <option value="">Seleccionar chofer</option>
                  {choferes.map((item) => (
                    <option key={item.Legajo} value={item.Legajo}>
                      {item.NombreCompleto}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className={LABEL_CLASS}>
                    Nombre chofer externo
                  </label>
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
              <label className={LABEL_CLASS}>Patente camión</label>
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
          <h2 className="mb-4 text-xl font-bold text-[#0F172A]">
            Registro fotográfico
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>
                Foto del camión / patente
              </label>
              <input
                key={fotoInputKeys.fotoCamionPatente}
                type="file"
                accept="image/*"
                capture="environment"
                {...register("fotoCamionPatente", {
                  validate: (files) =>
                    files?.length > 0 ||
                    "La foto del camión / patente es obligatoria",
                })}
                className={FIELD_CLASS}
              />
              {errors.fotoCamionPatente ? (
                <p className="mt-1 text-sm text-red-600">
                  {errors.fotoCamionPatente.message}
                </p>
              ) : null}
              {previewsFotos.fotoCamionPatente ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewsFotos.fotoCamionPatente}
                  alt="Vista previa foto del camión / patente"
                  className="mt-3 h-48 w-full rounded-lg border object-cover"
                />
              ) : null}
              {previewsFotos.fotoCamionPatente ? (
                <button
                  type="button"
                  onClick={() => quitarFoto("fotoCamionPatente")}
                  className="mt-2 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm font-semibold text-[#0F172A] hover:bg-red-50 hover:text-[#D90F14] focus:outline-none focus:ring-2 focus:ring-red-100"
                >
                  Quitar imagen
                </button>
              ) : null}
            </div>

            <div>
              <label className={LABEL_CLASS}>
                Foto del material cargado
              </label>
              <input
                key={fotoInputKeys.fotoMaterialCargado}
                type="file"
                accept="image/*"
                capture="environment"
                {...register("fotoMaterialCargado", {
                  validate: (files) =>
                    files?.length > 0 ||
                    "La foto del material cargado es obligatoria",
                })}
                className={FIELD_CLASS}
              />
              {errors.fotoMaterialCargado ? (
                <p className="mt-1 text-sm text-red-600">
                  {errors.fotoMaterialCargado.message}
                </p>
              ) : null}
              {previewsFotos.fotoMaterialCargado ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewsFotos.fotoMaterialCargado}
                  alt="Vista previa foto del material cargado"
                  className="mt-3 h-48 w-full rounded-lg border object-cover"
                />
              ) : null}
              {previewsFotos.fotoMaterialCargado ? (
                <button
                  type="button"
                  onClick={() => quitarFoto("fotoMaterialCargado")}
                  className="mt-2 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm font-semibold text-[#0F172A] hover:bg-red-50 hover:text-[#D90F14] focus:outline-none focus:ring-2 focus:ring-red-100"
                >
                  Quitar imagen
                </button>
              ) : null}
            </div>

            <div>
              <label className={LABEL_CLASS}>
                Foto del remito físico
              </label>
              <input
                key={fotoInputKeys.fotoRemitoFisico}
                type="file"
                accept="image/*"
                capture="environment"
                {...register("fotoRemitoFisico")}
                className={FIELD_CLASS}
              />
              {previewsFotos.fotoRemitoFisico ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewsFotos.fotoRemitoFisico}
                  alt="Vista previa foto del remito físico"
                  className="mt-3 h-48 w-full rounded-lg border object-cover"
                />
              ) : null}
              {previewsFotos.fotoRemitoFisico ? (
                <button
                  type="button"
                  onClick={() => quitarFoto("fotoRemitoFisico")}
                  className="mt-2 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm font-semibold text-[#0F172A] hover:bg-red-50 hover:text-[#D90F14] focus:outline-none focus:ring-2 focus:ring-red-100"
                >
                  Quitar imagen
                </button>
              ) : null}
            </div>

            <div>
              <label className={LABEL_CLASS}>Foto adicional</label>
              <input
                key={fotoInputKeys.fotoAdicional}
                type="file"
                accept="image/*"
                capture="environment"
                {...register("fotoAdicional")}
                className={FIELD_CLASS}
              />
              {previewsFotos.fotoAdicional ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewsFotos.fotoAdicional}
                  alt="Vista previa foto adicional"
                  className="mt-3 h-48 w-full rounded-lg border object-cover"
                />
              ) : null}
              {previewsFotos.fotoAdicional ? (
                <button
                  type="button"
                  onClick={() => quitarFoto("fotoAdicional")}
                  className="mt-2 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm font-semibold text-[#0F172A] hover:bg-red-50 hover:text-[#D90F14] focus:outline-none focus:ring-2 focus:ring-red-100"
                >
                  Quitar imagen
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="mb-4 text-xl font-bold text-[#0F172A]">
            Hachador y observaciones
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <input type="hidden" {...register("hachadorCodigo")} />
              <SearchableSelect
                label="Hachador"
                value={hachadorCodigo}
                options={hachadores}
                onChange={(item) =>
                  setValue("hachadorCodigo", item?.Codigo || "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                getOptionValue={(item) => item.Codigo}
                getOptionLabel={(item) => item.RazonSocial}
                getSearchText={(item) => `${item.Codigo} ${item.RazonSocial}`}
                placeholder="Buscar hachador"
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Observaciones</label>
              <textarea
                {...register("observaciones")}
                className={TEXTAREA_CLASS}
                placeholder="Observaciones del ingreso"
              />
            </div>
          </div>
        </section>

        <div className={`flex justify-end gap-3 ${SECTION_CLASS}`}>
          <button
            type="button"
            onClick={limpiarFormulario}
            disabled={guardando}
            className="rounded-lg border border-[#CBD5E1] bg-white px-5 py-3 font-semibold text-[#0F172A] hover:border-[#F3171B] hover:text-[#D90F14] focus:border-[#F3171B] focus:ring-2 focus:ring-red-100"
          >
            Limpiar formulario
          </button>

          <button
            type="submit"
            disabled={guardando}
            className="rounded-lg bg-[#F3171B] px-5 py-3 font-bold text-white shadow-sm hover:bg-[#D90F14] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Guardar ingreso"}
          </button>
        </div>
      </form>
    </main>
  )
}
