"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { FiCheck, FiX } from "react-icons/fi"

const SECTION_CLASS =
  "rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm shadow-slate-200/70"
const LABEL_CLASS = "mb-1 block text-sm font-semibold text-[#0F172A]"
const FIELD_CLASS =
  "w-full rounded-lg border border-[#CBD5E1] bg-white p-3 text-[#0F172A] placeholder:text-slate-400 outline-none focus:border-[#F3171B] focus:ring-2 focus:ring-red-100"

function SwitchControl({ checked, disabled, onChange, trueLabel = "Si", falseLabel = "No" }) {
  const label = checked ? trueLabel : falseLabel
  const Icon = checked ? FiCheck : FiX

  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`inline-flex min-w-28 items-center justify-between rounded-full border p-1 text-xs font-bold transition disabled:cursor-wait disabled:opacity-60 ${
        checked
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100"
          : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-300"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`grid h-6 w-6 place-items-center rounded-full border shadow-sm transition ${
          checked
            ? "order-2 border-emerald-600 bg-emerald-600 text-white"
            : "border-slate-400 bg-white text-slate-500 dark:bg-slate-800 dark:text-slate-300"
        }`}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span className="px-2">{label}</span>
    </button>
  )
}

export default function ConfiguracionProcedenciasPage() {
  const [procedencias, setProcedencias] = useState([])
  const [nombre, setNombre] = useState("")
  const [aplicaRollizos, setAplicaRollizos] = useState(true)
  const [aplicaMateriales, setAplicaMateriales] = useState(true)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [actualizandoId, setActualizandoId] = useState(null)
  const [error, setError] = useState("")

  async function cargarProcedencias() {
    setLoading(true)
    setError("")

    try {
      const response = await fetch(
        "/api/dimensiones/procedencias?incluirInactivas=true"
      )
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "No se pudieron cargar procedencias")
      }

      setProcedencias(result.procedencias || [])
    } catch (err) {
      setError(err.message || "No se pudieron cargar procedencias")
    } finally {
      setLoading(false)
    }
  }

  async function guardarProcedencia(event) {
    event.preventDefault()

    const nombreTrim = nombre.trim()

    if (!nombreTrim) {
      toast.error("El nombre de la procedencia es obligatorio")
      return
    }

    try {
      setGuardando(true)

      const response = await fetch("/api/dimensiones/procedencias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: nombreTrim,
          aplicaRollizos,
          aplicaMateriales,
        }),
      })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "No se pudo agregar la procedencia")
      }

      setNombre("")
      setAplicaRollizos(true)
      setAplicaMateriales(true)
      setProcedencias((prev) =>
        [...prev, result.procedencia].sort((a, b) =>
          a.nombre.localeCompare(b.nombre, "es")
        )
      )
      toast.success("Procedencia agregada correctamente")
    } catch (err) {
      toast.error(err.message || "No se pudo agregar la procedencia")
    } finally {
      setGuardando(false)
    }
  }

  async function actualizarProcedencia(procedencia, cambios) {
    try {
      setActualizandoId(procedencia.id)

      const response = await fetch(
        `/api/dimensiones/procedencias/${procedencia.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cambios),
        }
      )
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error
            ? `${result.message}: ${result.error}`
            : result.message || "No se pudo actualizar la procedencia"
        )
      }

      setProcedencias((prev) =>
        prev.map((item) =>
          item.id === procedencia.id ? result.procedencia : item
        )
      )
      toast.success("Procedencia actualizada")
    } catch (err) {
      toast.error(err.message || "No se pudo actualizar la procedencia")
    } finally {
      setActualizandoId(null)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarProcedencias()
  }, [])

  return (
    <main className="min-h-screen bg-[#F5F7FA] p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className={SECTION_CLASS}>
          <p className="text-sm font-bold uppercase tracking-wide text-[#F3171B]">
            Configuracion
          </p>
          <h1 className="mt-1 text-3xl font-black text-[#0F172A]">
            Procedencias
          </h1>
          <p className="mt-2 max-w-3xl text-[#475569]">
            Dimension parametrizable para ingresos de Rollizos y Materiales.
          </p>
        </section>

        <section className={`${SECTION_CLASS} max-w-xl`}>
          <h2 className="text-lg font-bold text-[#0F172A]">
            Nueva procedencia
          </h2>
          <form onSubmit={guardarProcedencia} className="mt-4 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex-1">
                <span className={LABEL_CLASS}>Nueva procedencia</span>
                <input
                  type="text"
                  value={nombre}
                  onChange={(event) => setNombre(event.target.value)}
                  className={FIELD_CLASS}
                  placeholder="Ej: Bariloche"
                />
              </label>
              <button
                type="submit"
                disabled={guardando}
                className="rounded-lg bg-[#F3171B] px-5 py-3 font-bold text-white shadow-sm hover:bg-[#D90F14] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando ? "Agregando..." : "Agregar"}
              </button>
            </div>

            <div className="flex flex-col gap-3 text-sm text-[#475569] sm:flex-row">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={aplicaRollizos}
                  onChange={(event) => setAplicaRollizos(event.target.checked)}
                  className="h-4 w-4 rounded border-[#CBD5E1] accent-[#F3171B]"
                />
                Aplica a Rollizos
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={aplicaMateriales}
                  onChange={(event) => setAplicaMateriales(event.target.checked)}
                  className="h-4 w-4 rounded border-[#CBD5E1] accent-[#F3171B]"
                />
                Aplica a Materiales
              </label>
            </div>
          </form>
        </section>

        <section className={SECTION_CLASS}>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">
                Procedencias registradas
              </h2>
              <p className="mt-1 text-sm text-[#475569]">
                La baja es logica: las procedencias inactivas no aparecen en formularios.
              </p>
            </div>
            <button
              type="button"
              onClick={cargarProcedencias}
              className="btn-secondary w-fit"
            >
              Actualizar
            </button>
          </div>

          {loading ? (
            <p className="mt-4 text-[#475569]">Cargando procedencias...</p>
          ) : error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="font-semibold text-red-700">{error}</p>
              <button
                type="button"
                onClick={cargarProcedencias}
                className="mt-3 rounded-lg bg-[#F3171B] px-4 py-2 text-sm font-bold text-white hover:bg-[#D90F14]"
              >
                Reintentar
              </button>
            </div>
          ) : procedencias.length === 0 ? (
            <p className="mt-4 text-[#475569]">
              Todavia no hay procedencias registradas.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#CBD5E1] text-[#475569]">
                    <th className="py-3 pr-4 font-semibold">Procedencia</th>
                    <th className="py-3 pr-4 font-semibold">Aplica a Rollizos</th>
                    <th className="py-3 pr-4 font-semibold">Aplica a Materiales</th>
                    <th className="py-3 pr-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {procedencias.map((procedencia) => {
                    const disabled = actualizandoId === procedencia.id

                    return (
                      <tr
                        key={procedencia.id}
                        className="border-b border-slate-100 text-[#0F172A] hover:bg-red-50/20"
                      >
                        <td className="py-3 pr-4">
                          <div className="flex flex-col">
                            <span className="font-bold">{procedencia.nombre}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <SwitchControl
                            checked={procedencia.aplicaRollizos}
                            disabled={disabled}
                            onChange={(value) =>
                              actualizarProcedencia(procedencia, {
                                aplicaRollizos: value,
                              })
                            }
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <SwitchControl
                            checked={procedencia.aplicaMateriales}
                            disabled={disabled}
                            onChange={(value) =>
                              actualizarProcedencia(procedencia, {
                                aplicaMateriales: value,
                              })
                            }
                          />
                        </td>
                        <td className="py-3 pr-4">
                          <SwitchControl
                            checked={procedencia.activa}
                            disabled={disabled}
                            trueLabel="Activa"
                            falseLabel="Inactiva"
                            onChange={(value) =>
                              actualizarProcedencia(procedencia, {
                                activa: value,
                              })
                            }
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
