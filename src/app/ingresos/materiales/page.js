"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import SearchableSelect, {
  ModoBusquedaInline,
} from "@/components/forms/SearchableSelect"

const SECTION_CLASS = "panel-surface"
const LABEL_CLASS = "mb-1 block font-semibold text-[#0F172A]"
const FIELD_CLASS =
  "w-full rounded-2xl border border-[#CBD5E1] bg-white p-3 text-[#0F172A] placeholder:text-slate-400 outline-none focus:border-[#F3171B] focus:ring-2 focus:ring-red-100"
const TEXTAREA_CLASS =
  "min-h-28 w-full rounded-2xl border border-[#CBD5E1] bg-white p-3 text-[#0F172A] placeholder:text-slate-400 outline-none focus:border-[#F3171B] focus:ring-2 focus:ring-red-100"
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

function horaActual() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
}

function normalizarCantidad(value) {
  const texto = String(value || "").trim().replace(/\./g, "").replace(",", ".")
  const numero = Number(texto)
  return Number.isNaN(numero) ? 0 : numero
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
    articuloCargaManual: false,
    articuloManualDescripcion: "",
    articuloManualCodigo: "",
    articuloManualObservacion: "",
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

function mensajeErrorDimension(result, fallback) {
  if (result.status === "fulfilled") return ""

  const detalle = result.reason?.message
  return detalle ? `${fallback}. ${detalle}` : fallback
}

function CampoErrorDimension({ message }) {
  if (!message) return null

  return (
    <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
      {message}
    </p>
  )
}

function AvisoErroresDimensiones({ errores, onRetry, reintentando }) {
  const erroresActivos = Object.values(errores).filter(Boolean)

  if (erroresActivos.length === 0) return null

  return (
    <section className="rounded-2xl border border-red-200 bg-red-50/80 p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="font-bold text-red-700">
            Algunas dimensiones no se pudieron cargar
          </h2>
          <p className="mt-1 text-sm text-[#475569]">
            Podes seguir revisando el formulario, pero para guardar necesitas
            completar las dimensiones obligatorias.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-red-700">
            {erroresActivos.map((mensaje) => (
              <li key={mensaje}>{mensaje}</li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={onRetry}
          disabled={reintentando}
          className="w-fit rounded-lg bg-[#F3171B] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#D90F14] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {reintentando ? "Reintentando..." : "Reintentar carga"}
        </button>
      </div>
    </section>
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
  const [procedencias, setProcedencias] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [articulosPorCategoria, setArticulosPorCategoria] = useState({})
  const [articulosTodos, setArticulosTodos] = useState([])
  const [categoriasCargando, setCategoriasCargando] = useState({})
  const [articulosTodosCargando, setArticulosTodosCargando] = useState(false)
  const [servicios, setServicios] = useState([])
  const [itemsRemito, setItemsRemito] = useState(() => [crearItemRemito()])
  const [modoProveedor, setModoProveedor] = useState(MODO_SUGERIDOS)
  const [modoServicio, setModoServicio] = useState(MODO_SUGERIDOS)
  const [proveedorCargaManual, setProveedorCargaManual] = useState(false)
  const [servicioCargaManual, setServicioCargaManual] = useState(false)
  const [cargandoDimensiones, setCargandoDimensiones] = useState({})
  const [dimensionErrors, setDimensionErrors] = useState({})
  const [reintentandoDimensiones, setReintentandoDimensiones] = useState(false)
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
      horaIngreso: horaActual(),
      tipoServicio: "FLETERO",
      tipoChofer: "EXTERNO",
      procedenciaId: "",
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

  const hayErroresDimensiones = Object.values(dimensionErrors).some(Boolean)

  function setCargandoDimension(nombre, value) {
    setCargandoDimensiones((prev) => ({
      ...prev,
      [nombre]: value,
    }))
  }

  function setDimensionError(nombre, message) {
    setDimensionErrors((prev) => ({
      ...prev,
      [nombre]: message,
    }))
  }

  function activarProveedorManual() {
    setProveedorCargaManual(true)
    setValue("proveedorCodigo", "", {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function volverABuscarProveedor() {
    setProveedorCargaManual(false)
    setValue("proveedorManualNombre", "")
    setValue("proveedorManualCuit", "")
    setValue("proveedorManualObservacion", "")
  }

  function activarServicioManual() {
    setServicioCargaManual(true)
    setValue("servicioCodigo", "", {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function volverABuscarServicio() {
    setServicioCargaManual(false)
    setValue("servicioManualNombre", "")
    setValue("servicioManualCuit", "")
    setValue("servicioManualObservacion", "")
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
      setDimensionError("proveedores", "")
      if (modo === MODO_TODOS) toast.info("Mostrando todos los proveedores")
    } catch (err) {
      const mensaje = err.message || "No se pudieron cargar proveedores"
      setDimensionError("proveedores", mensaje)
      toast.error(mensaje)
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
      setErrorLogistica("")
      setDimensionError("servicios", "")
      if (modo === MODO_TODOS) toast.info("Mostrando todos los servicios")
    } catch (err) {
      const mensaje = err.message || "No se pudieron cargar servicios"
      setErrorLogistica(mensaje)
      setDimensionError("servicios", mensaje)
      toast.error(mensaje)
    } finally {
      setCargandoDimension("servicio", false)
    }
  }

  async function cargarDatosIniciales({ reintento = false } = {}) {
    if (reintento) {
      setReintentandoDimensiones(true)
    } else {
      setLoadingInicial(true)
    }
    setError("")

    try {
      const [porterosResult, choferesResult, procedenciasResult, proveedoresResult] =
        await Promise.allSettled([
          fetchDimension("/api/dimensiones/porteros"),
          fetchDimension("/api/dimensiones/choferes"),
          fetchDimension("/api/dimensiones/procedencias"),
          fetchDimension(proveedorUrl(modoProveedor)),
        ])

      if (porterosResult.status === "fulfilled") {
        setPorteros(porterosResult.value)
      }
      if (choferesResult.status === "fulfilled") {
        setChoferes(choferesResult.value)
      }
      if (procedenciasResult.status === "fulfilled") {
        setProcedencias(procedenciasResult.value)
      }
      if (proveedoresResult.status === "fulfilled") {
        setProveedores(proveedoresResult.value)
      }

      setDimensionErrors((prev) => ({
        ...prev,
        porteros: mensajeErrorDimension(
          porterosResult,
          "No se pudieron cargar porteros"
        ),
        choferes: mensajeErrorDimension(
          choferesResult,
          "No se pudieron cargar choferes"
        ),
        procedencias: mensajeErrorDimension(
          procedenciasResult,
          "No se pudieron cargar procedencias"
        ),
        proveedores: mensajeErrorDimension(
          proveedoresResult,
          "No se pudieron cargar proveedores"
        ),
      }))
    } catch (err) {
      setError(err.message || "No se pudieron cargar datos iniciales")
    } finally {
      setLoadingInicial(false)
      setReintentandoDimensiones(false)
    }
  }

  useEffect(() => {
    // Carga inicial del formulario; mantiene el formulario usable aunque una dimension falle.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
        setDimensionError("servicios", "")
      } catch (err) {
        const mensaje = err.message || "No se pudieron cargar servicios logisticos"
        setErrorLogistica(mensaje)
        setDimensionError("servicios", mensaje)
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
      setDimensionError("articulos", "")
    } catch (err) {
      const mensaje = err.message || "No se pudieron cargar articulos"
      setDimensionError("articulos", mensaje)
      toast.error(mensaje)
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
      setDimensionError("articulos", "")
    } catch (err) {
      const mensaje = err.message || "No se pudieron cargar todos los articulos"
      setDimensionError("articulos", mensaje)
      toast.error(mensaje)
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
                articuloCargaManual: false,
                articuloManualDescripcion: "",
                articuloManualCodigo: "",
                articuloManualObservacion: "",
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
                articuloManualDescripcion: "",
                articuloManualCodigo: "",
                articuloManualObservacion: "",
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

    if (campo === "articuloCargaManual") {
      setItemsRemito((prev) =>
        prev.map((item) =>
          item.idLocal === idLocal
            ? {
                ...item,
                articuloCargaManual: Boolean(valor),
                articuloCodigo: "",
                articuloManualDescripcion: "",
                articuloManualCodigo: "",
                articuloManualObservacion: "",
              }
            : item
        )
      )

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
      articuloCargaManual: item.articuloCargaManual,
      articuloSeleccionado: item.articuloCargaManual
        ? null
        : buscarPorCodigo(articulosDisponiblesItem(item), item.articuloCodigo),
      articuloManual: {
        descripcion: item.articuloManualDescripcion || "",
        codigo: item.articuloManualCodigo || "",
        observacion: item.articuloManualObservacion || "",
      },
      cantidad: item.cantidad,
      unidad: item.unidad,
    }))
  }

  function limpiarFormulario() {
    reset({
      fechaIngreso: fechaActual(),
      horaIngreso: horaActual(),
      tipoServicio: "FLETERO",
      tipoChofer: "EXTERNO",
      procedenciaId: "",
    })
    setArticulosPorCategoria({})
    setCategoriasCargando({})
    setItemsRemito([crearItemRemito()])
    setPreviewsFotos({})
    setProveedorCargaManual(false)
    setServicioCargaManual(false)
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

    if (!porteroSeleccionado) {
      toast.error("No se pudo seleccionar portero. Reintentá la carga de datos.")
      return
    }

    if (!values.procedenciaId) {
      toast.error("La procedencia es obligatoria")
      return
    }

    if (proveedorCargaManual && !String(values.proveedorManualNombre || "").trim()) {
      toast.error("El nombre del proveedor manual es obligatorio")
      return
    }

    if (!proveedorCargaManual && !proveedorSeleccionado) {
      toast.error("No se pudo seleccionar proveedor. Reintenta la carga de datos.")
      return
    }

    if (!values.horaIngreso || !/^\d{2}:\d{2}$/.test(values.horaIngreso)) {
      toast.error("La hora de ingreso es obligatoria y debe tener formato HH:mm")
      return
    }

    if (!servicioCargaManual && !servicioSeleccionado) {
      toast.error("No se pudo seleccionar servicio. Reintenta la carga de datos.")
      return
    }

    if (tipoChofer === "INTERNO" && !choferSeleccionado) {
      toast.error("Debes seleccionar un chofer interno")
      return
    }

    if (tipoChofer === "EXTERNO" && !String(values.choferNombreExterno || "").trim()) {
      toast.error("El nombre del chofer externo es obligatorio")
      return
    }

    const itemsPreparados = prepararItemsRemito()
    const itemsCompletos = itemsPreparados.every((item) => {
      const cantidad = normalizarCantidad(item.cantidad)

      return (
        item.categoriaMaterial &&
        cantidad > 0 &&
        String(item.unidad || "").trim() &&
        (item.articuloCargaManual
          ? String(item.articuloManual?.descripcion || "").trim()
          : item.articuloSeleccionado)
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
        proveedorCargaManual,
        procedenciaId: Number(values.procedenciaId),
        procedenciaSeleccionada:
          procedencias.find(
            (procedencia) => String(procedencia.id) === String(values.procedenciaId)
          ) || null,
        proveedorSeleccionado: proveedorCargaManual ? null : proveedorSeleccionado,
        proveedorManual: {
          nombre: values.proveedorManualNombre || "",
          cuit: values.proveedorManualCuit || "",
          observacion: values.proveedorManualObservacion || "",
        },
        proveedorModoBusqueda: modoProveedor,
        items: itemsPreparados,
        servicioCargaManual,
        servicioSeleccionado: servicioCargaManual ? null : servicioSeleccionado,
        servicioManual: {
          nombre: values.servicioManualNombre || "",
          cuit: values.servicioManualCuit || "",
          observacion: values.servicioManualObservacion || "",
        },
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
            Estamos consultando porteros, choferes y procedencias.
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
          <button
            type="button"
            onClick={() => cargarDatosIniciales({ reintento: true })}
            disabled={reintentandoDimensiones}
            className="mt-5 rounded-lg bg-[#F3171B] px-4 py-2 font-semibold text-white hover:bg-[#D90F14] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {reintentandoDimensiones ? "Reintentando..." : "Reintentar"}
          </button>
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

        {hayErroresDimensiones ? (
          <AvisoErroresDimensiones
            errores={dimensionErrors}
            onRetry={() => cargarDatosIniciales({ reintento: true })}
            reintentando={reintentandoDimensiones}
          />
        ) : null}

        <section className={SECTION_CLASS}>
          <h2 className="mb-4 text-xl font-bold text-[#0F172A]">
            Datos generales
          </h2>

          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className={LABEL_CLASS}>Fecha de ingreso</label>
              <input
                type="date"
                {...register("fechaIngreso", { required: true })}
                className={FIELD_CLASS}
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Hora de ingreso</label>
              <input
                type="time"
                {...register("horaIngreso", { required: true })}
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
              <CampoErrorDimension message={dimensionErrors.porteros} />
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

            <div>
              <label className={LABEL_CLASS}>Procedencia *</label>
              <select
                {...register("procedenciaId", { required: true })}
                className={FIELD_CLASS}
              >
                <option value="">Seleccionar procedencia</option>
                {procedencias.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </select>
              <CampoErrorDimension message={dimensionErrors.procedencias} />
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
            <div className={proveedorCargaManual ? "md:col-span-2" : ""}>
              <input
                type="hidden"
                {...register("proveedorCodigo")}
              />
              {proveedorCargaManual ? (
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-400/25 dark:bg-slate-800/60">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-slate-300 bg-white/70 px-3 py-1 text-xs font-semibold text-[#475569] dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200">
                          Proveedor manual
                        </span>
                        <span className="rounded-full border border-amber-200 bg-amber-100/70 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
                          Pendiente de validar
                        </span>
                      </div>
                      <p className="text-sm text-[#475569]">
                        El proveedor quedara pendiente de validar.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={volverABuscarProveedor}
                      className="rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm font-semibold text-[#0F172A] hover:border-amber-300 hover:text-amber-800 dark:hover:border-amber-400/50 dark:hover:text-amber-200"
                    >
                      Volver a buscar en Bejerman
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <label>
                      <span className={LABEL_CLASS}>
                        Nombre / Razon social proveedor *
                      </span>
                      <input
                        type="text"
                        {...register("proveedorManualNombre")}
                        className={FIELD_CLASS}
                        placeholder="Nombre del proveedor"
                      />
                    </label>
                    <label>
                      <span className={LABEL_CLASS}>CUIT proveedor</span>
                      <input
                        type="text"
                        {...register("proveedorManualCuit")}
                        className={FIELD_CLASS}
                        placeholder="Opcional"
                      />
                    </label>
                    <label>
                      <span className={LABEL_CLASS}>
                        Observacion proveedor
                      </span>
                      <textarea
                        {...register("proveedorManualObservacion")}
                        className={TEXTAREA_CLASS}
                        placeholder="Opcional"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <>
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
                    getSearchText={(item) =>
                      `${item.Codigo} ${item.RazonSocial}`
                    }
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
                  <CampoErrorDimension message={dimensionErrors.proveedores} />
                  <button
                    type="button"
                    onClick={activarProveedorManual}
                    className="mt-3 text-sm font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200"
                  >
                    No encuentro el proveedor / Cargar manualmente
                  </button>
                </>
              )}
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

                  <div>
                    {item.articuloCargaManual ? (
                      <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-400/25 dark:bg-slate-800/60">
                        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full border border-slate-300 bg-white/70 px-2.5 py-1 text-xs font-semibold text-[#475569] dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-200">
                                Articulo manual
                              </span>
                              <span className="rounded-full border border-amber-200 bg-amber-100/70 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
                                Pendiente de validar
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-[#475569] dark:text-slate-300">
                              La categoria del item se mantiene como referencia
                              operativa.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              actualizarItemRemito(
                                item.idLocal,
                                "articuloCargaManual",
                                false
                              )
                            }
                            className="w-fit rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm font-semibold text-[#0F172A] hover:border-amber-300 hover:text-amber-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-amber-400/50 dark:hover:text-amber-200"
                          >
                            Volver a buscar en Bejerman
                          </button>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <label>
                            <span className={LABEL_CLASS}>
                              Descripcion articulo *
                            </span>
                            <input
                              type="text"
                              value={item.articuloManualDescripcion}
                              onChange={(event) =>
                                actualizarItemRemito(
                                  item.idLocal,
                                  "articuloManualDescripcion",
                                  event.target.value
                                )
                              }
                              className={FIELD_CLASS}
                              placeholder="Ej: Pallet especial"
                            />
                          </label>
                          <label>
                            <span className={LABEL_CLASS}>Codigo articulo</span>
                            <input
                              type="text"
                              value={item.articuloManualCodigo}
                              onChange={(event) =>
                                actualizarItemRemito(
                                  item.idLocal,
                                  "articuloManualCodigo",
                                  event.target.value
                                )
                              }
                              className={FIELD_CLASS}
                              placeholder="Opcional"
                            />
                          </label>
                          <label className="md:col-span-2">
                            <span className={LABEL_CLASS}>
                              Observacion articulo
                            </span>
                            <textarea
                              value={item.articuloManualObservacion}
                              onChange={(event) =>
                                actualizarItemRemito(
                                  item.idLocal,
                                  "articuloManualObservacion",
                                  event.target.value
                                )
                              }
                              className={TEXTAREA_CLASS}
                              placeholder="Opcional"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <>
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
                        <CampoErrorDimension
                          message={dimensionErrors.articulos}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            actualizarItemRemito(
                              item.idLocal,
                              "articuloCargaManual",
                              true
                            )
                          }
                          className="mt-3 text-sm font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200"
                        >
                          No encuentro el articulo / Cargar manualmente
                        </button>
                      </>
                    )}
                  </div>

                  <label>
                    <span className={LABEL_CLASS}>Cantidad *</span>
                    <input
                      type="text"
                      value={item.cantidad}
                      onChange={(event) =>
                        actualizarItemRemito(
                          item.idLocal,
                          "cantidad",
                          event.target.value
                        )
                      }
                      className={FIELD_CLASS}
                      placeholder="Ej: 2.500,50"
                    />
                  </label>

                  <label>
                    <span className={LABEL_CLASS}>Unidad *</span>
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
                      placeholder="Ej: UNI"
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
              <label className={LABEL_CLASS}>Tipo de servicio logístico *</label>
              <select {...register("tipoServicio")} className={FIELD_CLASS}>
                <option value="FLETERO">Fletero</option>
                <option value="TRANSPORTE">Transporte</option>
              </select>
            </div>

            <div>
              <input type="hidden" {...register("servicioCodigo")} />
              {servicioCargaManual ? (
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-400/25 dark:bg-slate-800/60">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-slate-300 bg-white/70 px-3 py-1 text-xs font-semibold text-[#475569] dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200">
                          Servicio manual
                        </span>
                        <span className="rounded-full border border-amber-200 bg-amber-100/70 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
                          Pendiente de validar
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[#475569]">
                        El servicio quedara pendiente de validar.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={volverABuscarServicio}
                      className="rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm font-semibold text-[#0F172A] hover:border-amber-300 hover:text-amber-800 dark:hover:border-amber-400/50 dark:hover:text-amber-200"
                    >
                      Volver a buscar en Bejerman
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <label>
                      <span className={LABEL_CLASS}>
                        Nombre / Razon social servicio *
                      </span>
                      <input
                        type="text"
                        {...register("servicioManualNombre")}
                        className={FIELD_CLASS}
                        placeholder="Nombre del servicio"
                      />
                    </label>
                    <label>
                      <span className={LABEL_CLASS}>CUIT servicio</span>
                      <input
                        type="text"
                        {...register("servicioManualCuit")}
                        className={FIELD_CLASS}
                        placeholder="Opcional"
                      />
                    </label>
                    <label>
                      <span className={LABEL_CLASS}>
                        Observacion servicio
                      </span>
                      <textarea
                        {...register("servicioManualObservacion")}
                        className={TEXTAREA_CLASS}
                        placeholder="Opcional"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <>
                  <SearchableSelect
                    label="Servicio logístico"
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
                    getSearchText={(item) =>
                      `${item.Codigo} ${item.RazonSocial}`
                    }
                    placeholder="Buscar servicio"
                    loading={loadingLogistica || cargandoDimensiones.servicio}
                    modeControl={
                      <ModoBusquedaInline
                        value={modoServicio}
                        onChange={cambiarModoServicio}
                        disabled={
                          loadingLogistica || cargandoDimensiones.servicio
                        }
                      />
                    }
                  />
                  <CampoErrorDimension message={dimensionErrors.servicios} />
                  <button
                    type="button"
                    onClick={activarServicioManual}
                    className="mt-3 text-sm font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200"
                  >
                    No encuentro el servicio / Cargar manualmente
                  </button>
                </>
              )}
            </div>

            <div>
              <label className={LABEL_CLASS}>Tipo de chofer *</label>
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
                <CampoErrorDimension message={dimensionErrors.choferes} />
              </div>
            ) : (
              <>
                <div>
                  <label className={LABEL_CLASS}>Nombre chofer externo *</label>
                  <input
                    type="text"
                    {...register("choferNombreExterno")}
                    className={FIELD_CLASS}
                    placeholder="Nombre completo"
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
                    placeholder="Opcional"
                  />
                </div>
              </>
            )}

            <div>
              <label className={LABEL_CLASS}>Patente camion *</label>
              <input
                type="text"
                {...register("patenteCamion")}
                className={`${FIELD_CLASS} uppercase`}
                placeholder="Ej: AB 123 CD"
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Patente acoplado</label>
              <input
                type="text"
                {...register("patenteAcoplado")}
                className={`${FIELD_CLASS} uppercase`}
                placeholder="Ej: AB 123 CD"
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
