"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

const FIELD_CLASS =
  "w-full rounded-lg border border-[#CBD5E1] bg-white p-3 text-[#0F172A] placeholder:text-slate-400 outline-none focus:border-[#F3171B] focus:ring-2 focus:ring-red-100 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:ring-red-950/40"
const LABEL_CLASS = "mb-1 block text-sm font-semibold text-[#0F172A] dark:text-slate-100"

function fechaInput(value) {
  if (!value) return ""

  return new Date(value).toISOString().slice(0, 10)
}

function valorInicial(value) {
  if (value === null || value === undefined) return ""

  return String(value)
}

export default function EditarIngresoPanel({
  ingreso,
  articulo,
  onCancel,
  onUpdated,
}) {
  const [values, setValues] = useState({
    fechaIngreso: fechaInput(ingreso.fechaIngreso),
    remitoProveedor: valorInicial(ingreso.remitoProveedor),
    cantidad: valorInicial(articulo?.cantidad),
    unidad: valorInicial(articulo?.unidad),
    patenteCamion: valorInicial(ingreso.patenteCamion),
    patenteAcoplado: valorInicial(ingreso.patenteAcoplado),
    tipoUnidadLogistica: valorInicial(ingreso.tipoUnidadLogistica),
    observaciones: valorInicial(ingreso.observaciones),
    choferNombreCargado: valorInicial(ingreso.choferNombreCargado),
    choferDocumentoCargado: valorInicial(ingreso.choferDocumentoCargado),
    procedenciaId: valorInicial(ingreso.procedenciaId),
    motivo: "",
  })
  const [guardando, setGuardando] = useState(false)
  const [procedencias, setProcedencias] = useState([])
  const [cargandoProcedencias, setCargandoProcedencias] = useState(false)
  const choferManual = ingreso.choferOrigenDato === "MANUAL"
  const esMateriales = ingreso.tipoIngreso?.codigo === "MATERIALES"
  const esRollizos = ingreso.tipoIngreso?.codigo === "ROLLIZOS"

  useEffect(() => {
    async function cargarProcedencias() {
      if (!esRollizos && !esMateriales) return

      try {
        setCargandoProcedencias(true)

        const tipo = esRollizos ? "ROLLIZOS" : "MATERIALES"
        const response = await fetch(`/api/dimensiones/procedencias?tipo=${tipo}`)
        const result = await response.json()

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "No se pudieron cargar procedencias")
        }

        setProcedencias(result.procedencias || [])
      } catch (error) {
        toast.error(error.message || "No se pudieron cargar procedencias")
      } finally {
        setCargandoProcedencias(false)
      }
    }

    cargarProcedencias()
  }, [esMateriales, esRollizos])

  function actualizarCampo(event) {
    const { name, value } = event.target

    setValues((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function guardarCambios() {
    const motivo = values.motivo.trim()
    const cantidad = Number(String(values.cantidad).replace(",", "."))

    if (!values.fechaIngreso) {
      toast.error("La fecha de ingreso es obligatoria")
      return
    }

    if ((esRollizos || esMateriales) && !values.procedenciaId) {
      toast.error("La procedencia es obligatoria")
      return
    }

    if (!esMateriales && (!cantidad || cantidad <= 0)) {
      toast.error("La cantidad debe ser mayor a 0")
      return
    }

    if (!esMateriales && !values.unidad.trim()) {
      toast.error("La unidad es obligatoria")
      return
    }

    if (!motivo) {
      toast.error("El motivo de edicion es obligatorio")
      return
    }

    if (!["CHASIS", "EQUIPO"].includes(values.tipoUnidadLogistica)) {
      toast.error("Debe seleccionar si el viaje corresponde a Chasis o Equipo.")
      return
    }

    try {
      setGuardando(true)

      const payload = {
        fechaIngreso: values.fechaIngreso,
        remitoProveedor: values.remitoProveedor,
        patenteCamion: values.patenteCamion,
        patenteAcoplado: values.patenteAcoplado,
        tipoUnidadLogistica: values.tipoUnidadLogistica,
        observaciones: values.observaciones,
        choferNombreCargado: values.choferNombreCargado,
        choferDocumentoCargado: values.choferDocumentoCargado,
        motivo,
      }

      if (esRollizos || esMateriales) {
        payload.procedenciaId = values.procedenciaId
      }

      if (!esMateriales) {
        payload.cantidad = values.cantidad
        payload.unidad = values.unidad
      }

      const response = await fetch(`/api/ingresos/${ingreso.id}/editar`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "No se pudo actualizar el ingreso")
      }

      onUpdated(result.ingreso)
      toast.success("Ingreso actualizado correctamente")
    } catch (error) {
      toast.error(error.message || "No se pudo actualizar el ingreso")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="mt-5 rounded-xl border border-[#CBD5E1] bg-[#F5F7FA] p-4">
      <h3 className="text-lg font-bold text-[#0F172A]">
        Editar ingreso
      </h3>
      <p className="mt-1 text-sm text-[#475569]">
        Solo se pueden modificar campos administrativos. El motivo queda en el
        log de auditoria.
      </p>

      {esMateriales ? (
        <div className="mt-4 rounded-lg border border-[#CBD5E1] bg-white p-3 text-sm font-semibold text-[#475569]">
          La cantidad y unidad de Materiales se editan desde cada item del
          remito.
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label>
          <span className={LABEL_CLASS}>Fecha ingreso</span>
          <input
            type="date"
            name="fechaIngreso"
            value={values.fechaIngreso}
            onChange={actualizarCampo}
            className={FIELD_CLASS}
          />
        </label>

        <label>
          <span className={LABEL_CLASS}>Remito proveedor</span>
          <input
            type="text"
            name="remitoProveedor"
            value={values.remitoProveedor}
            onChange={actualizarCampo}
            className={FIELD_CLASS}
          />
        </label>

        {esRollizos || esMateriales ? (
          <label>
            <span className={LABEL_CLASS}>Procedencia *</span>
            <select
              name="procedenciaId"
              value={values.procedenciaId}
              onChange={actualizarCampo}
              className={FIELD_CLASS}
              disabled={cargandoProcedencias}
            >
              <option value="">
                {cargandoProcedencias
                  ? "Cargando procedencias..."
                  : "Seleccionar procedencia"}
              </option>
              {procedencias.map((procedencia) => (
                <option key={procedencia.id} value={procedencia.id}>
                  {procedencia.nombre}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {!esMateriales ? (
          <>
            <label>
              <span className={LABEL_CLASS}>Cantidad</span>
              <input
                type="number"
                step="0.001"
                name="cantidad"
                value={values.cantidad}
                onChange={actualizarCampo}
                className={FIELD_CLASS}
              />
            </label>

            <label>
              <span className={LABEL_CLASS}>Unidad</span>
              <input
                type="text"
                name="unidad"
                value={values.unidad}
                onChange={actualizarCampo}
                className={FIELD_CLASS}
              />
            </label>
          </>
        ) : null}

        <label>
          <span className={LABEL_CLASS}>Patente camion</span>
          <input
            type="text"
            name="patenteCamion"
            value={values.patenteCamion}
            onChange={actualizarCampo}
            className={`${FIELD_CLASS} uppercase`}
          />
        </label>

        <label>
          <span className={LABEL_CLASS}>Patente acoplado</span>
          <input
            type="text"
            name="patenteAcoplado"
            value={values.patenteAcoplado}
            onChange={actualizarCampo}
            className={`${FIELD_CLASS} uppercase`}
          />
        </label>

        <label>
          <span className={LABEL_CLASS}>Tipo de unidad *</span>
          <select
            name="tipoUnidadLogistica"
            value={values.tipoUnidadLogistica}
            onChange={actualizarCampo}
            className={FIELD_CLASS}
          >
            <option value="">Seleccionar unidad</option>
            <option value="CHASIS">Chasis</option>
            <option value="EQUIPO">Equipo</option>
          </select>
        </label>

        {choferManual ? (
          <>
            <label>
              <span className={LABEL_CLASS}>Nombre del chofer</span>
              <input
                type="text"
                name="choferNombreCargado"
                value={values.choferNombreCargado}
                onChange={actualizarCampo}
                className={FIELD_CLASS}
              />
            </label>

            <label>
              <span className={LABEL_CLASS}>Documento del chofer</span>
              <input
                type="text"
                name="choferDocumentoCargado"
                value={values.choferDocumentoCargado}
                onChange={actualizarCampo}
                className={FIELD_CLASS}
              />
            </label>
          </>
        ) : null}

        <label className="md:col-span-2">
          <span className={LABEL_CLASS}>Observaciones</span>
          <textarea
            name="observaciones"
            value={values.observaciones}
            onChange={actualizarCampo}
            className={`${FIELD_CLASS} min-h-24`}
          />
        </label>

        <label className="md:col-span-2">
          <span className={LABEL_CLASS}>Motivo de edicion *</span>
          <textarea
            name="motivo"
            value={values.motivo}
            onChange={actualizarCampo}
            className={`${FIELD_CLASS} min-h-24`}
            placeholder="Ej: Correccion por error de carga"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-[#CBD5E1] bg-white px-4 py-2 font-semibold text-[#0F172A] hover:border-[#F3171B] hover:text-[#D90F14]"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={guardarCambios}
          disabled={guardando}
          className="rounded-lg bg-[#F3171B] px-4 py-2 font-semibold text-white shadow-sm hover:bg-[#D90F14] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  )
}
