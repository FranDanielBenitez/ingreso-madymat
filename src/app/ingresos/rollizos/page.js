"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import SearchableSelect, {
  ModoBusquedaInline,
} from "@/components/forms/SearchableSelect"

const SECTION_CLASS = "panel-surface"
const LABEL_CLASS = "mb-1 block font-semibold text-[#0F172A] dark:text-slate-100"
const FIELD_CLASS =
  "w-full rounded-2xl border border-[#CBD5E1] bg-white p-3 text-[#0F172A] placeholder:text-slate-400 outline-none focus:border-[#F3171B] focus:ring-2 focus:ring-red-100 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:ring-red-950/40"
const TEXTAREA_CLASS =
  "min-h-28 w-full rounded-2xl border border-[#CBD5E1] bg-white p-3 text-[#0F172A] placeholder:text-slate-400 outline-none focus:border-[#F3171B] focus:ring-2 focus:ring-red-100 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:ring-red-950/40"
const MODO_SUGERIDOS = "SUGERIDOS"
const MODO_TODOS = "TODOS"

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

export default function IngresoRollizosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [usuarioCargando, setUsuarioCargando] = useState(true)
  const [puedeGuardar, setPuedeGuardar] = useState(false)

  useEffect(() => {
    async function cargarUsuario() {
      try {
        const response = await fetch("/api/auth/me")
        const result = await response.json()

        if (response.ok && result.ok) {
          setCurrentUser(result.user)
          setPuedeGuardar(
            result.user.roles?.includes("DATA_ENTRY") ||
              result.user.roles?.includes("ADMINISTRADOR")
          )
        } else {
          setPuedeGuardar(false)
        }
      } catch {
        setPuedeGuardar(false)
      } finally {
        setUsuarioCargando(false)
      }
    }

    cargarUsuario()
  }, [])

  const [proveedores, setProveedores] = useState([])
  const [articulos, setArticulos] = useState([])
  const [servicios, setServicios] = useState([])
  const [hachadores, setHachadores] = useState([])
  const [choferes, setChoferes] = useState([])
  const [porteros, setPorteros] = useState([])
  const [procedencias, setProcedencias] = useState([])
  const [modoProveedor, setModoProveedor] = useState(MODO_SUGERIDOS)
  const [modoArticulo, setModoArticulo] = useState(MODO_SUGERIDOS)
  const [modoServicio, setModoServicio] = useState(MODO_SUGERIDOS)
  const [modoHachador, setModoHachador] = useState(MODO_SUGERIDOS)
  const [proveedorCargaManual, setProveedorCargaManual] = useState(false)
  const [articuloCargaManual, setArticuloCargaManual] = useState(false)
  const [servicioCargaManual, setServicioCargaManual] = useState(false)
  const [hachadorCargaManual, setHachadorCargaManual] = useState(false)
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

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fechaIngreso: fechaActual(),
      horaIngreso: horaActual(),
      tipoServicio: "FLETERO",
      tipoChofer: "EXTERNO",
      unidad: "TN",
    },
  })

  const proveedorCodigo = watch("proveedorCodigo")
  const articuloCodigo = watch("articuloCodigo")
  const servicioCodigo = watch("servicioCodigo")
  const hachadorCodigo = watch("hachadorCodigo")
  const choferLegajo = watch("choferLegajo")
  const porteroLegajo = watch("porteroLegajo")
  const procedenciaId = watch("procedenciaId")
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

  const procedenciaSeleccionada = useMemo(
    () =>
      procedencias.find((item) => String(item.id) === String(procedenciaId)) ||
      null,
    [procedencias, procedenciaId]
  )

  const hayErroresDimensiones = Object.values(dimensionErrors).some(Boolean)

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

  function hachadorUrl(modo) {
    return modo === MODO_TODOS
      ? "/api/dimensiones/proveedores?modo=TODOS"
      : "/api/dimensiones/hachadores?categoria=ROLLIZOS"
  }

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

  function activarArticuloManual() {
    setArticuloCargaManual(true)
    setValue("articuloCodigo", "", {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function volverABuscarArticulo() {
    setArticuloCargaManual(false)
    setValue("articuloManualDescripcion", "")
    setValue("articuloManualCodigo", "")
    setValue("articuloManualObservacion", "")
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

  function activarHachadorManual() {
    setHachadorCargaManual(true)
    setValue("hachadorCodigo", "", {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function volverABuscarHachador() {
    setHachadorCargaManual(false)
    setValue("hachadorManualNombre", "")
    setValue("hachadorManualCuit", "")
    setValue("hachadorManualCodigo", "")
    setValue("hachadorManualObservacion", "")
  }

  async function cambiarModoProveedor(modo) {
    if (modo === modoProveedor) return

    setModoProveedor(modo)
    setValue("proveedorCodigo", "")
    setCargandoDimension("proveedor", true)

    try {
      const data = await fetchDimensionSegura(proveedorUrl(modo))
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

  async function cambiarModoArticulo(modo) {
    if (modo === modoArticulo) return

    setModoArticulo(modo)
    setValue("articuloCodigo", "")
    setCargandoDimension("articulo", true)

    try {
      const data = await fetchDimensionSegura(articuloUrl(modo))
      setArticulos(data)
      setDimensionError("articulos", "")
      if (modo === MODO_TODOS) toast.info("Mostrando todos los articulos")
    } catch (err) {
      const mensaje = err.message || "No se pudieron cargar articulos"
      setDimensionError("articulos", mensaje)
      toast.error(mensaje)
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
      setDimensionError("servicios", "")
      if (modo === MODO_TODOS) toast.info("Mostrando todos los servicios")
    } catch (err) {
      const mensaje = err.message || "No se pudieron cargar servicios"
      setDimensionError("servicios", mensaje)
      toast.error(mensaje)
    } finally {
      setCargandoDimension("servicio", false)
    }
  }

  async function cambiarModoHachador(modo) {
    if (modo === modoHachador) return

    setModoHachador(modo)
    setValue("hachadorCodigo", "")
    setCargandoDimension("hachador", true)

    try {
      const data = await fetchDimensionSegura(hachadorUrl(modo))
      setHachadores(data)
      setDimensionError("hachadores", "")
      if (modo === MODO_TODOS) toast.info("Mostrando todos los hachadores")
    } catch (err) {
      const mensaje = err.message || "No se pudieron cargar hachadores"
      setDimensionError("hachadores", mensaje)
      toast.error(mensaje)
    } finally {
      setCargandoDimension("hachador", false)
    }
  }

  async function cargarDimensionesIniciales({ reintento = false } = {}) {
    try {
      console.log("Cargando dimensiones...")
      if (reintento) {
        setReintentandoDimensiones(true)
      } else {
        setLoading(true)
      }
      setError("")

      const [
        proveedoresResult,
        articulosResult,
        serviciosResult,
        hachadoresResult,
        choferesResult,
        porterosResult,
        procedenciasResult,
      ] = await Promise.allSettled([
        fetchDimensionSegura(proveedorUrl(modoProveedor)),
        fetchDimensionSegura(articuloUrl(modoArticulo)),
        fetchDimensionSegura(servicioUrl(tipoServicio, modoServicio)),
        fetchDimensionSegura(hachadorUrl(modoHachador)),
        fetchDimensionSegura("/api/dimensiones/choferes"),
        fetchDimensionSegura("/api/dimensiones/porteros"),
        fetchDimensionSegura("/api/dimensiones/procedencias?tipo=ROLLIZOS"),
      ])

      if (proveedoresResult.status === "fulfilled") {
        setProveedores(proveedoresResult.value)
      }
      if (articulosResult.status === "fulfilled") {
        setArticulos(articulosResult.value)
      }
      if (serviciosResult.status === "fulfilled") {
        setServicios(serviciosResult.value)
      }
      if (hachadoresResult.status === "fulfilled") {
        setHachadores(hachadoresResult.value)
      }
      if (choferesResult.status === "fulfilled") {
        setChoferes(choferesResult.value)
      }
      if (porterosResult.status === "fulfilled") {
        setPorteros(porterosResult.value)
      }
      if (procedenciasResult.status === "fulfilled") {
        setProcedencias(procedenciasResult.value)
      }

      setDimensionErrors({
        proveedores: mensajeErrorDimension(
          proveedoresResult,
          "No se pudieron cargar proveedores"
        ),
        articulos: mensajeErrorDimension(
          articulosResult,
          "No se pudieron cargar articulos"
        ),
        servicios: mensajeErrorDimension(
          serviciosResult,
          "No se pudieron cargar servicios logisticos"
        ),
        hachadores: mensajeErrorDimension(
          hachadoresResult,
          "No se pudieron cargar hachadores"
        ),
        choferes: mensajeErrorDimension(
          choferesResult,
          "No se pudieron cargar choferes"
        ),
        porteros: mensajeErrorDimension(
          porterosResult,
          "No se pudieron cargar porteros"
        ),
        procedencias: mensajeErrorDimension(
          procedenciasResult,
          "No se pudieron cargar procedencias"
        ),
      })

      console.log("Dimensiones cargadas correctamente")
    } catch (err) {
      setError(err.message || "Error cargando dimensiones")
    } finally {
      setLoading(false)
      setReintentandoDimensiones(false)
    }
  }

  async function cargarServiciosPorTipo(tipo) {
    try {
      const data = await fetchDimensionSegura(servicioUrl(tipo, modoServicio))
      setServicios(data)
      setValue("servicioCodigo", "")
      setDimensionError("servicios", "")
    } catch (err) {
      console.warn(err)
      const mensaje = "No se pudieron cargar los servicios logisticos"
      setDimensionError("servicios", mensaje)
      toast.error(mensaje)
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

    if (!puedeGuardar) {
      toast.error(
        "No puede guardar el ingreso porque su usuario no tiene rol Data Entry. Solicite habilitación a IT si corresponde."
      )
      return
    }

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

      if (!porteroSeleccionado) {
        toast.error("No se pudo seleccionar portero. Reintentá la carga de datos.")
        return
      }

      const remitoProveedor = String(values.remitoProveedor || "").trim()

      if (!remitoProveedor) {
        toast.error("Debe ingresar el remito del proveedor.")
        return
      }

      if (!procedenciaSeleccionada) {
        toast.error("La procedencia es obligatoria para Rollizos")
        return
      }

      if (proveedorCargaManual && !String(values.proveedorManualNombre || "").trim()) {
        toast.error("El nombre del proveedor manual es obligatorio")
        return
      }

      if (!proveedorCargaManual && !proveedorSeleccionado) {
        toast.error(
          "No se pudo seleccionar proveedor. Reintenta la carga de datos."
        )
        return
      }

      if (
        articuloCargaManual &&
        !String(values.articuloManualDescripcion || "").trim()
      ) {
        toast.error("La descripción del artículo manual es obligatoria")
        return
      }

      if (!values.horaIngreso || !/^\d{2}:\d{2}$/.test(values.horaIngreso)) {
        toast.error("La hora de ingreso es obligatoria y debe tener formato HH:mm")
        return
      }

      if (!articuloCargaManual && !articuloSeleccionado) {
        toast.error("No se pudo seleccionar articulo. Reintenta la carga de datos.")
        return
      }

      const cantidadIngreso = normalizarCantidad(values.cantidad)

      if (!cantidadIngreso || cantidadIngreso <= 0) {
        toast.error("La cantidad debe ser mayor a cero")
        return
      }

      if (!String(values.unidad || "").trim()) {
        toast.error("La unidad es obligatoria")
        return
      }

      if (!String(values.patenteCamion || "").trim()) {
        toast.error("La patente del camión es obligatoria")
        return
      }

      if (servicioCargaManual && !String(values.servicioManualNombre || "").trim()) {
        toast.error("El nombre del servicio manual es obligatorio")
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

      if (hachadorCargaManual && !String(values.hachadorManualNombre || "").trim()) {
        toast.error("El nombre del hachador manual es obligatorio")
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
        remitoProveedor,
        proveedorCargaManual,
        proveedorSeleccionado: proveedorCargaManual ? null : proveedorSeleccionado,
        proveedorManual: {
          nombre: values.proveedorManualNombre || "",
          cuit: values.proveedorManualCuit || "",
          observacion: values.proveedorManualObservacion || "",
        },
        proveedorModoBusqueda: modoProveedor,
        articuloCargaManual,
        articuloSeleccionado: articuloCargaManual ? null : articuloSeleccionado,
        articuloManual: {
          descripcion: values.articuloManualDescripcion || "",
          codigo: values.articuloManualCodigo || "",
          observacion: values.articuloManualObservacion || "",
        },
        articuloModoBusqueda: modoArticulo,
        servicioCargaManual,
        servicioSeleccionado: servicioCargaManual ? null : servicioSeleccionado,
        servicioManual: {
          nombre: values.servicioManualNombre || "",
          cuit: values.servicioManualCuit || "",
          observacion: values.servicioManualObservacion || "",
        },
        servicioModoBusqueda: modoServicio,
        hachadorCargaManual,
        hachadorSeleccionado: hachadorCargaManual ? null : hachadorSeleccionado,
        hachadorManual: {
          nombre: values.hachadorManualNombre || "",
          cuit: values.hachadorManualCuit || "",
          codigo: values.hachadorManualCodigo || "",
          observacion: values.hachadorManualObservacion || "",
        },
        hachadorModoBusqueda: modoHachador,
        choferSeleccionado:
          tipoChofer === "INTERNO" ? choferSeleccionado : null,
        porteroSeleccionado,
        procedenciaId: procedenciaSeleccionada.id,
        procedenciaSeleccionada,
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
      fechaIngreso: fechaActual(),
      horaIngreso: horaActual(),
      tipoServicio: "FLETERO",
      tipoChofer: "EXTERNO",
      unidad: "TN",
    })
    setPreviewsFotos({})
    setProveedorCargaManual(false)
    setArticuloCargaManual(false)
    setServicioCargaManual(false)
    setHachadorCargaManual(false)
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
            onClick={() => cargarDimensionesIniciales({ reintento: true })}
            disabled={reintentandoDimensiones}
            className="mt-5 rounded-lg bg-[#F3171B] px-4 py-2 font-semibold text-white hover:bg-[#D90F14]"
          >
            {reintentandoDimensiones ? "Reintentando..." : "Reintentar"}
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

        {hayErroresDimensiones ? (
          <AvisoErroresDimensiones
            errores={dimensionErrors}
            onRetry={() => cargarDimensionesIniciales({ reintento: true })}
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
                    {item.NombreCompleto}
                  </option>
                ))}
              </select>
              <CampoErrorDimension message={dimensionErrors.porteros} />
            </div>

            <div>
              <label className={LABEL_CLASS}>
                Remito proveedor <span className="text-[#F3171B]">*</span>
              </label>
              <input
                type="text"
                {...register("remitoProveedor", { required: true })}
                className={FIELD_CLASS}
                placeholder="Número de remito"
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>
                Procedencia <span className="text-[#F3171B]">*</span>
              </label>
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
          <h2 className="mb-4 text-xl font-bold text-[#0F172A]">
            Proveedor y material
          </h2>

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
                    getOptionLabel={(item) =>
                      `${item.Codigo} - ${item.RazonSocial}`
                    }
                    getSearchText={(item) =>
                      `${item.Codigo} ${item.RazonSocial}`
                    }
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

            <div className={articuloCargaManual ? "md:col-span-2" : ""}>
              <input
                type="hidden"
                {...register("articuloCodigo")}
              />
              {articuloCargaManual ? (
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-400/25 dark:bg-slate-800/60">
                  <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
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
                        Usalo solo si el articulo no aparece en Bejerman.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={volverABuscarArticulo}
                      className="w-fit rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm font-semibold text-[#0F172A] hover:border-amber-300 hover:text-amber-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-amber-400/50 dark:hover:text-amber-200"
                    >
                      Volver a buscar en Bejerman
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label>
                      <span className={LABEL_CLASS}>Descripcion articulo *</span>
                      <input
                        type="text"
                        {...register("articuloManualDescripcion")}
                        className={FIELD_CLASS}
                        placeholder="Ej: Rollizos especiales"
                      />
                    </label>
                    <label>
                      <span className={LABEL_CLASS}>Codigo articulo</span>
                      <input
                        type="text"
                        {...register("articuloManualCodigo")}
                        className={FIELD_CLASS}
                        placeholder="Opcional"
                      />
                    </label>
                    <label className="md:col-span-2">
                      <span className={LABEL_CLASS}>Observacion articulo</span>
                      <textarea
                        {...register("articuloManualObservacion")}
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
                    getSearchText={(item) =>
                      `${item.Codigo} ${item.Descripcion}`
                    }
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
                  <CampoErrorDimension message={dimensionErrors.articulos} />
                  <button
                    type="button"
                    onClick={activarArticuloManual}
                    className="mt-3 text-sm font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200"
                  >
                    No encuentro el articulo / Cargar manualmente
                  </button>
                </>
              )}
            </div>

            <div>
              <label className={LABEL_CLASS}>Cantidad *</label>
              <input
                type="text"
                {...register("cantidad", { required: true })}
                className={FIELD_CLASS}
                placeholder="Ej: 2.500,50"
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Unidad *</label>
              <input
                type="text"
                {...register("unidad", { required: true })}
                className={FIELD_CLASS}
                placeholder="Ej: TN"
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
                Tipo de servicio logístico *
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
                    getOptionLabel={(item) =>
                      `${item.Codigo} - ${item.RazonSocial}`
                    }
                    getSearchText={(item) =>
                      `${item.Codigo} ${item.RazonSocial}`
                    }
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
                <CampoErrorDimension message={dimensionErrors.choferes} />
              </div>
            ) : (
              <>
                <div>
                  <label className={LABEL_CLASS}>
                    Nombre chofer externo *
                  </label>
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
              <label className={LABEL_CLASS}>Patente camión *</label>
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
            Registro fotográfico
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>
                Foto del camión / patente
                <span className="text-red-600"> *</span>
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
                <span className="text-red-600"> *</span>
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
              {hachadorCargaManual ? (
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-400/25 dark:bg-slate-800/60">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-slate-300 bg-white/70 px-3 py-1 text-xs font-semibold text-[#475569] dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200">
                          Hachador manual
                        </span>
                        <span className="rounded-full border border-amber-200 bg-amber-100/70 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
                          Pendiente de validar
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[#475569]">
                        El hachador quedara pendiente de aprobacion.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={volverABuscarHachador}
                      className="rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm font-semibold text-[#0F172A] hover:border-amber-300 hover:text-amber-800 dark:hover:border-amber-400/50 dark:hover:text-amber-200"
                    >
                      Volver a buscar en Bejerman
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <label>
                      <span className={LABEL_CLASS}>
                        Nombre / Razon social hachador *
                      </span>
                      <input
                        type="text"
                        {...register("hachadorManualNombre")}
                        className={FIELD_CLASS}
                        placeholder="Nombre del hachador"
                      />
                    </label>
                    <label>
                      <span className={LABEL_CLASS}>CUIT hachador</span>
                      <input
                        type="text"
                        {...register("hachadorManualCuit")}
                        className={FIELD_CLASS}
                        placeholder="Opcional"
                      />
                    </label>
                    <label>
                      <span className={LABEL_CLASS}>Codigo hachador</span>
                      <input
                        type="text"
                        {...register("hachadorManualCodigo")}
                        className={FIELD_CLASS}
                        placeholder="Opcional"
                      />
                    </label>
                    <label>
                      <span className={LABEL_CLASS}>
                        Observacion hachador
                      </span>
                      <textarea
                        {...register("hachadorManualObservacion")}
                        className={TEXTAREA_CLASS}
                        placeholder="Opcional"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <>
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
                    getSearchText={(item) =>
                      `${item.Codigo} ${item.RazonSocial} ${item.CUIT || ""}`
                    }
                    placeholder="Buscar hachador"
                    loading={cargandoDimensiones.hachador}
                    modeControl={
                      <ModoBusquedaInline
                        value={modoHachador}
                        onChange={cambiarModoHachador}
                        disabled={cargandoDimensiones.hachador}
                      />
                    }
                  />
                  <CampoErrorDimension message={dimensionErrors.hachadores} />
                  <button
                    type="button"
                    onClick={activarHachadorManual}
                    className="mt-3 text-sm font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200"
                  >
                    No encuentro el hachador / Cargar manualmente
                  </button>
                </>
              )}
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

        {!usuarioCargando && !puedeGuardar && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            No puede guardar el ingreso porque su usuario no tiene rol Data Entry.
            Solicite habilitación a IT si corresponde.
          </div>
        )}

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
            disabled={guardando || !puedeGuardar}
            className="rounded-lg bg-[#F3171B] px-5 py-3 font-bold text-white shadow-sm hover:bg-[#D90F14] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Guardar ingreso"}
          </button>
        </div>
      </form>
    </main>
  )
}
