"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
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

function crearItemRemito() {
  return {
    idLocal: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    categoriaMaterial: "",
    modoArticulo: MODO_SUGERIDOS,
    articuloCodigo: "",
    cantidad: "",
    unidad: "UNI",
  }
}

function FotoField({
  label,
  name,
  register,
  error,
  preview,
  inputKey,
  onRemove,
  required = false,
}) {
  return (
    <div>
      <label className={LABEL_CLASS}>
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      <input
        key={inputKey}
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
        <div className="mt-3 overflow-hidden rounded-lg border border-[#CBD5E1] bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt={`Vista previa ${label}`}
            className="h-48 w-full object-cover"
          />
          <button
            type="button"
            onClick={onRemove}
            className="w-full border-t border-[#CBD5E1] bg-white px-3 py-2 text-sm font-semibold text-[#0F172A] hover:bg-red-50 hover:text-[#D90F14] focus:outline-none focus:ring-2 focus:ring-red-100"
          >
            Quitar imagen
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default function IngresoMaterialesPage() {
  const router = useRouter()
  const [loadingInicial, setLoadingInicial] = useState(true)
  const [loadingLogistica, setLoadingLogistica] = useState(false)
  const [error, setError] = useState("")
  const [errorLogistica, setErrorLogistica] = useState("")
  const [porteros, setPorteros] = useState([])
  const [choferes, setChoferes] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [articulosPorCategoria, setArticulosPorCategoria] = useState({})
  const [articulosTodos, setArticulosTodos] = useState([])
  const [categoriasCargando, setCategoriasCargando] = useState({})
  const [articulosTodosCargando, setArticulosTodosCargando] = useState(false)
  const [servicios, setServicios] = useState([])
  const [itemsRemito, setItemsRemito] = useState(() => [crearItemRemito()])
  const [modoProveedor, setModoProveedor] = useState(MODO_SUGERIDOS)
  const [modoServicio, setModoServicio] = useState(MODO_SUGERIDOS)
  const [cargandoDimensiones, setCargandoDimensiones] = useState({})
  const [previewsFotos, setPreviewsFotos] = useState({})
  const [fotoInputKeys, setFotoInputKeys] = useState({
    fotoCamionPatente: 0,
    fotoMaterialCargado: 0,
    fotoRemitoFisico: 0,
    fotoAdicional: 0,
  })
  const [guardando, setGuardando] = useState(false)

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
      tipoServicio: "FLETERO",
      tipoChofer: "INTERNO",
    },
  })

  const proveedorCodigo = useWatch({ control, name: "proveedorCodigo" })
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

  function setCargandoDimension(nombre, value) {
    setCargandoDimensiones((prev) => ({
      ...prev,
      [nombre]: value,
    }))
  }

  function proveedorUrl(modo) {
    return modo === MODO_TODOS
      ? "/api/dimensiones/proveedores?modo=TODOS"
      : "/api/dimensiones/proveedores?categoria=MATERIA_PRIMA"
  }

  function servicioUrl(tipo, modo) {
    if (modo === MODO_TODOS) {
      return "/api/dimensiones/servicios-logisticos?modo=TODOS"
    }

    return tipo === "TRANSPORTE"
      ? "/api/dimensiones/servicios-logisticos?tipo=TRANSPORTE"
      : "/api/dimensiones/servicios-logisticos?categoria=MATERIA_PRIMA"
  }

  async function cambiarModoProveedor(modo) {
    if (modo === modoProveedor) return

    setModoProveedor(modo)
    setValue("proveedorCodigo", "")
    setCargandoDimension("proveedor", true)

    try {
      const data = await fetchDimension(proveedorUrl(modo))
      setProveedores(data)
      if (modo === MODO_TODOS) toast.info("Mostrando todos los proveedores")
    } catch (err) {
      toast.error(err.message || "No se pudieron cargar proveedores")
    } finally {
      setCargandoDimension("proveedor", false)
    }
  }

  async function cambiarModoServicio(modo) {
    if (modo === modoServicio) return

    setModoServicio(modo)
    setValue("servicioCodigo", "")
    setCargandoDimension("servicio", true)

    try {
      const data = await fetchDimension(servicioUrl(tipoServicio, modo))
      setServicios(data)
      if (modo === MODO_TODOS) toast.info("Mostrando todos los servicios")
    } catch (err) {
      toast.error(err.message || "No se pudieron cargar servicios")
    } finally {
      setCargandoDimension("servicio", false)
    }
  }

  useEffect(() => {
    async function cargarDatosIniciales() {
      setLoadingInicial(true)
      setError("")

      try {
        const [porterosData, choferesData, proveedoresData] = await Promise.all([
          fetchDimension("/api/dimensiones/porteros"),
          fetchDimension("/api/dimensiones/choferes"),
          fetchDimension("/api/dimensiones/proveedores?categoria=MATERIA_PRIMA"),
        ])

        setPorteros(porterosData)
        setChoferes(choferesData)
        setProveedores(proveedoresData)
      } catch (err) {
        setError(err.message || "No se pudieron cargar datos iniciales")
      } finally {
        setLoadingInicial(false)
      }
    }

    cargarDatosIniciales()
  }, [])

  useEffect(() => {
    async function cargarServicios() {
      setLoadingLogistica(true)
      setErrorLogistica("")
      setValue("servicioCodigo", "")

      try {
        const serviciosData = await fetchDimension(
          servicioUrl(tipoServicio, modoServicio)
        )

        setServicios(serviciosData)
      } catch (err) {
        setErrorLogistica(
          err.message || "No se pudieron cargar servicios logisticos"
        )
      } finally {
        setLoadingLogistica(false)
      }
    }

    cargarServicios()
  }, [setValue, tipoServicio, modoServicio])

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

  async function cargarArticulosCategoria(categoria) {
    if (!categoria || articulosPorCategoria[categoria]) return

    setCategoriasCargando((prev) => ({
      ...prev,
      [categoria]: true,
    }))

    try {
      const data = await fetchDimension(
        `/api/dimensiones/articulos?categoria=${categoria}`
      )

      setArticulosPorCategoria((prev) => ({
        ...prev,
        [categoria]: data,
      }))
    } catch (err) {
      toast.error(err.message || "No se pudieron cargar articulos")
    } finally {
      setCategoriasCargando((prev) => ({
        ...prev,
        [categoria]: false,
      }))
    }
  }

  async function cargarArticulosTodos() {
    if (articulosTodos.length > 0 || articulosTodosCargando) return

    setArticulosTodosCargando(true)

    try {
      const data = await fetchDimension("/api/dimensiones/articulos?modo=TODOS")
      setArticulosTodos(data)
    } catch (err) {
      toast.error(err.message || "No se pudieron cargar todos los articulos")
    } finally {
      setArticulosTodosCargando(false)
    }
  }

  function articulosDisponiblesItem(item) {
    return item.modoArticulo === MODO_TODOS
      ? articulosTodos
      : articulosPorCategoria[item.categoriaMaterial] || []
  }

  function actualizarItemRemito(idLocal, campo, valor) {
    if (campo === "categoriaMaterial") {
      const itemActual = itemsRemito.find((item) => item.idLocal === idLocal)

      setItemsRemito((prev) =>
        prev.map((item) =>
          item.idLocal === idLocal
            ? {
                ...item,
                categoriaMaterial: valor,
                articuloCodigo: "",
                unidad: "UNI",
              }
            : item
        )
      )

      if (itemActual?.modoArticulo === MODO_TODOS) {
        cargarArticulosTodos()
      } else {
        cargarArticulosCategoria(valor)
      }

      return
    }

    if (campo === "modoArticulo") {
      setItemsRemito((prev) =>
        prev.map((item) =>
          item.idLocal === idLocal
            ? {
                ...item,
                modoArticulo: valor,
                articuloCodigo: "",
                unidad: "UNI",
              }
            : item
        )
      )

      if (valor === MODO_TODOS) {
        cargarArticulosTodos()
      } else {
        const itemActual = itemsRemito.find((item) => item.idLocal === idLocal)
        cargarArticulosCategoria(itemActual?.categoriaMaterial)
      }

      return
    }

    setItemsRemito((prev) =>
      prev.map((item) => {
        if (item.idLocal !== idLocal) return item

        const siguiente = {
          ...item,
          [campo]: valor,
        }

        if (campo === "articuloCodigo") {
          const articulo = buscarPorCodigo(articulosDisponiblesItem(item), valor)
          siguiente.unidad = articulo?.Clase || item.unidad || ""
        }

        return siguiente
      })
    )
  }

  function agregarItemRemito() {
    setItemsRemito((prev) => [...prev, crearItemRemito()])
  }

  function quitarItemRemito(idLocal) {
    setItemsRemito((prev) => {
      if (prev.length <= 1) return prev

      return prev.filter((item) => item.idLocal !== idLocal)
    })
  }

  function prepararItemsRemito() {
    return itemsRemito.map((item) => ({
      categoriaMaterial: item.categoriaMaterial,
      modoBusquedaArticulo: item.modoArticulo,
      articuloSeleccionado: buscarPorCodigo(
        articulosDisponiblesItem(item),
        item.articuloCodigo
      ),
      cantidad: item.cantidad,
      unidad: item.unidad,
    }))
  }

  function limpiarFormulario() {
    reset({
      fechaIngreso: fechaActual(),
      tipoServicio: "FLETERO",
      tipoChofer: "INTERNO",
    })
    setArticulosPorCategoria({})
    setCategoriasCargando({})
    setItemsRemito([crearItemRemito()])
    setPreviewsFotos({})
    setFotoInputKeys((prev) => ({
      fotoCamionPatente: prev.fotoCamionPatente + 1,
      fotoMaterialCargado: prev.fotoMaterialCargado + 1,
      fotoRemitoFisico: prev.fotoRemitoFisico + 1,
      fotoAdicional: prev.fotoAdicional + 1,
    }))
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
    if (guardando) return

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

    const itemsPreparados = prepararItemsRemito()
    const itemsCompletos = itemsPreparados.every((item) => {
      const cantidad = Number(String(item.cantidad).replace(",", "."))

      return (
        item.categoriaMaterial &&
        item.articuloSeleccionado &&
        cantidad > 0 &&
        String(item.unidad || "").trim()
      )
    })

    if (itemsPreparados.length === 0 || !itemsCompletos) {
      toast.error(
        "Completa categoria, articulo, cantidad y unidad en todos los items del remito"
      )
      return
    }

    try {
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
        items: itemsPreparados,
        servicioSeleccionado,
        servicioModoBusqueda: modoServicio,
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

      const ingresoId = result.ingreso?.id

      toast.success("Ingreso de materiales guardado correctamente")

      if (ingresoId) {
        router.push(`/ingresos/materiales/${ingresoId}`)
      }
    } catch (error) {
      console.error("Error guardando ingreso de materiales:", error)
      toast.error(error.message || "Error guardando ingreso de materiales")
    } finally {
      setGuardando(false)
    }
  }

  if (loadingInicial) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] p-6">
        <section className={`mx-auto max-w-5xl ${SECTION_CLASS}`}>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            Cargando formulario...
          </h1>
          <p className="mt-3 text-[#475569]">
            Estamos consultando porteros y choferes.
          </p>
        </section>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] p-6">
        <section className={`mx-auto max-w-5xl ${SECTION_CLASS}`}>
          <h1 className="text-2xl font-bold text-red-700">
            Error cargando formulario
          </h1>
          <p className="mt-3 text-[#475569]">{error}</p>
        </section>
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
            Ingreso de Materiales
          </h1>
          <p className="mt-2 text-[#475569]">
            Formulario para registrar ingresos de materiales con fotos en
            porteria.
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
                    {etiquetaPersona(item)}
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
            <h2 className="text-xl font-bold text-[#0F172A]">
              Proveedor
            </h2>
            {loadingLogistica ? (
              <span className="rounded-full border border-[#CBD5E1] bg-[#F5F7FA] px-3 py-1 text-sm font-semibold text-[#475569]">
                Cargando servicios...
              </span>
            ) : null}
          </div>

          {errorLogistica ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorLogistica}
            </div>
          ) : null}

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
                getOptionLabel={etiquetaEntidad}
                getSearchText={(item) => `${item.Codigo} ${item.RazonSocial}`}
                placeholder="Buscar proveedor"
                loading={loadingInicial || cargandoDimensiones.proveedor}
                modeControl={
                  <ModoBusquedaInline
                    value={modoProveedor}
                    onChange={cambiarModoProveedor}
                    disabled={cargandoDimensiones.proveedor}
                  />
                }
              />
            </div>
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">
                Ítems del remito
              </h2>
              <p className="mt-1 text-sm text-[#475569]">
                Cargá uno o más artículos asociados al mismo remito.
              </p>
            </div>
            <button
              type="button"
              onClick={agregarItemRemito}
              className="w-fit rounded-lg border border-[#CBD5E1] bg-white px-4 py-2 text-sm font-bold text-[#0F172A] hover:border-[#F3171B] hover:text-[#D90F14] disabled:cursor-not-allowed disabled:opacity-60"
            >
              + Agregar ítem
            </button>
          </div>

          <div className="space-y-4">
            {itemsRemito.map((item, index) => (
              <div
                key={item.idLocal}
                className="rounded-xl border border-[#CBD5E1] bg-[#F5F7FA] p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="font-bold text-[#0F172A]">
                    Ítem {index + 1}
                  </h3>
                  {itemsRemito.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => quitarItemRemito(item.idLocal)}
                      className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:border-red-400"
                    >
                      Quitar
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-[220px_1fr_160px_160px]">
                  <label>
                    <span className={LABEL_CLASS}>Categoría</span>
                    <select
                      value={item.categoriaMaterial}
                      onChange={(event) =>
                        actualizarItemRemito(
                          item.idLocal,
                          "categoriaMaterial",
                          event.target.value
                        )
                      }
                      className={FIELD_CLASS}
                    >
                      <option value="">Seleccionar categoría</option>
                      {CATEGORIAS_MATERIALES.map((categoria) => (
                        <option key={categoria.codigo} value={categoria.codigo}>
                          {categoria.nombre}
                        </option>
                      ))}
                    </select>
                  </label>

                  <SearchableSelect
                    label="Articulo"
                    value={item.articuloCodigo}
                    options={articulosDisponiblesItem(item)}
                    onChange={(articulo) =>
                      actualizarItemRemito(
                        item.idLocal,
                        "articuloCodigo",
                        articulo?.Codigo || ""
                      )
                    }
                    getOptionValue={(articulo) => articulo.Codigo}
                    getOptionLabel={etiquetaArticulo}
                    getSearchText={(articulo) =>
                      `${articulo.Codigo} ${articulo.Descripcion}`
                    }
                    placeholder="Buscar articulo"
                    loading={
                      categoriasCargando[item.categoriaMaterial] ||
                      (item.modoArticulo === MODO_TODOS &&
                        articulosTodosCargando)
                    }
                    disabled={
                      item.modoArticulo !== MODO_TODOS &&
                      !item.categoriaMaterial
                    }
                    modeControl={
                      <ModoBusquedaInline
                        value={item.modoArticulo}
                        onChange={(modo) =>
                          actualizarItemRemito(
                            item.idLocal,
                            "modoArticulo",
                            modo
                          )
                        }
                        disabled={articulosTodosCargando}
                      />
                    }
                  />

                  <label>
                    <span className={LABEL_CLASS}>Cantidad</span>
                    <input
                      type="number"
                      step="0.001"
                      value={item.cantidad}
                      onChange={(event) =>
                        actualizarItemRemito(
                          item.idLocal,
                          "cantidad",
                          event.target.value
                        )
                      }
                      className={FIELD_CLASS}
                      placeholder="Ej: 2500"
                    />
                  </label>

                  <label>
                    <span className={LABEL_CLASS}>Unidad</span>
                    <input
                      type="text"
                      value={item.unidad}
                      onChange={(event) =>
                        actualizarItemRemito(
                          item.idLocal,
                          "unidad",
                          event.target.value
                        )
                      }
                      className={FIELD_CLASS}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="mb-4 text-xl font-bold text-[#0F172A]">
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
                getOptionLabel={etiquetaEntidad}
                getSearchText={(item) => `${item.Codigo} ${item.RazonSocial}`}
                placeholder="Buscar servicio"
                loading={loadingLogistica || cargandoDimensiones.servicio}
                modeControl={
                  <ModoBusquedaInline
                    value={modoServicio}
                    onChange={cambiarModoServicio}
                    disabled={loadingLogistica || cargandoDimensiones.servicio}
                  />
                }
              />
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
          <h2 className="mb-4 text-xl font-bold text-[#0F172A]">
            Registro fotografico
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <FotoField
              label="Foto del camion / patente"
              name="fotoCamionPatente"
              register={register}
              error={errors.fotoCamionPatente}
              preview={previewsFotos.fotoCamionPatente}
              inputKey={fotoInputKeys.fotoCamionPatente}
              onRemove={() => quitarFoto("fotoCamionPatente")}
              required
            />
            <FotoField
              label="Foto del material cargado"
              name="fotoMaterialCargado"
              register={register}
              error={errors.fotoMaterialCargado}
              preview={previewsFotos.fotoMaterialCargado}
              inputKey={fotoInputKeys.fotoMaterialCargado}
              onRemove={() => quitarFoto("fotoMaterialCargado")}
              required
            />
            <FotoField
              label="Foto del remito fisico"
              name="fotoRemitoFisico"
              register={register}
              preview={previewsFotos.fotoRemitoFisico}
              inputKey={fotoInputKeys.fotoRemitoFisico}
              onRemove={() => quitarFoto("fotoRemitoFisico")}
            />
            <FotoField
              label="Foto adicional"
              name="fotoAdicional"
              register={register}
              preview={previewsFotos.fotoAdicional}
              inputKey={fotoInputKeys.fotoAdicional}
              onRemove={() => quitarFoto("fotoAdicional")}
            />
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="mb-4 text-xl font-bold text-[#0F172A]">
            Observaciones
          </h2>
          <textarea
            {...register("observaciones")}
            className={TEXTAREA_CLASS}
            placeholder="Observaciones del ingreso"
          />
        </section>

        <div className={`flex flex-col justify-end gap-3 sm:flex-row ${SECTION_CLASS}`}>
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
