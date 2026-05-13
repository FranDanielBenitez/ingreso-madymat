"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

const SECTION_CLASS =
  "rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm shadow-slate-200/70"
const LABEL_CLASS = "mb-1 block text-sm font-semibold text-[#0F172A]"
const FIELD_CLASS =
  "w-full rounded-lg border border-[#CBD5E1] bg-white p-3 text-[#0F172A] placeholder:text-slate-400 outline-none focus:border-[#F3171B] focus:ring-2 focus:ring-red-100"

export default function ConfiguracionProcedenciasPage() {
  const [procedencias, setProcedencias] = useState([])
  const [nombre, setNombre] = useState("")
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")

  async function cargarProcedencias() {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/dimensiones/procedencias")
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
        body: JSON.stringify({ nombre: nombreTrim }),
      })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "No se pudo guardar la procedencia")
      }

      setNombre("")
      setProcedencias((prev) =>
        [...prev, result.procedencia].sort((a, b) =>
          a.nombre.localeCompare(b.nombre, "es")
        )
      )
      toast.success("Procedencia guardada correctamente")
    } catch (err) {
      toast.error(err.message || "No se pudo guardar la procedencia")
    } finally {
      setGuardando(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarProcedencias()
  }, [])

  return (
    <main className="min-h-screen bg-[#F5F7FA] p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className={SECTION_CLASS}>
          <p className="text-sm font-bold uppercase tracking-wide text-[#F3171B]">
            Configuracion
          </p>
          <h1 className="mt-1 text-3xl font-black text-[#0F172A]">
            Procedencias
          </h1>
          <p className="mt-2 text-[#475569]">
            Dimension parametrizable para ingresos de Rollizos.
          </p>
        </section>

        <section className={SECTION_CLASS}>
          <form onSubmit={guardarProcedencia} className="space-y-4">
            <label>
              <span className={LABEL_CLASS}>Nueva procedencia</span>
              <input
                type="text"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                className={FIELD_CLASS}
                placeholder="Ej: Neuquen"
              />
            </label>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={guardando}
                className="rounded-lg bg-[#F3171B] px-5 py-3 font-bold text-white shadow-sm hover:bg-[#D90F14] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </section>

        <section className={SECTION_CLASS}>
          <h2 className="text-xl font-bold text-[#0F172A]">
            Procedencias activas
          </h2>

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
              Todavia no hay procedencias activas.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {procedencias.map((procedencia) => (
                <article
                  key={procedencia.id}
                  className="rounded-xl border border-[#CBD5E1] bg-[#F5F7FA] p-4"
                >
                  <p className="font-bold text-[#0F172A]">
                    {procedencia.nombre}
                  </p>
                  <p className="mt-1 text-sm text-[#475569]">Activa</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
