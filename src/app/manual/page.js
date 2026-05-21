"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  FiBookOpen,
  FiDownload,
  FiExternalLink,
  FiHelpCircle,
} from "react-icons/fi"
import {
  enlacesRapidosManual,
  manualMeta,
  perfilesManual,
  preguntasFrecuentesManual,
} from "@/lib/manual/contenido"

const SECTION_CLASS = "panel-surface"
const TAB_CLASS =
  "rounded-xl border px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-red-100"

function SeccionManual({ seccion }) {
  return (
    <article className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
      <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
        {seccion.titulo}
      </h3>

      {seccion.texto ? (
        <p className="mt-3 leading-7 text-slate-700 dark:text-slate-300">
          {seccion.texto}
        </p>
      ) : null}

      {seccion.pasos ? (
        <ol className="mt-4 space-y-3 text-slate-700 dark:text-slate-300">
          {seccion.pasos.map((paso, index) => (
            <li key={paso} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-slate-300 bg-slate-50 text-sm font-black text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                {index + 1}
              </span>
              <span className="pt-0.5 leading-6">{paso}</span>
            </li>
          ))}
        </ol>
      ) : null}

      {seccion.items ? (
        <ul className="mt-4 space-y-2 text-slate-700 dark:text-slate-300">
          {seccion.items.map((item) => (
            <li key={item} className="flex gap-2 leading-6">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#F3171B]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}

function PreguntasFrecuentes() {
  return (
    <section className={SECTION_CLASS}>
      <div className="flex items-center gap-2">
        <FiHelpCircle className="h-5 w-5 text-[#F3171B]" aria-hidden="true" />
        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
          Preguntas frecuentes
        </h2>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {preguntasFrecuentesManual.map((item, index) => (
          <article
            key={item.pregunta}
            className="rounded-2xl border border-slate-300 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/70"
          >
            <p className="text-sm font-black uppercase text-[#F3171B]">
              Pregunta {index + 1}
            </p>
            <h3 className="mt-2 font-black text-slate-900 dark:text-slate-100">
              {item.pregunta}
            </h3>
            <p className="mt-3 leading-6 text-slate-700 dark:text-slate-300">
              {item.respuesta}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default function ManualPage() {
  const router = useRouter()
  const [perfilActivo, setPerfilActivo] = useState(perfilesManual[0].id)
  const [descargando, setDescargando] = useState(false)
  const [validandoSesion, setValidandoSesion] = useState(true)

  const perfil = perfilesManual.find((item) => item.id === perfilActivo)

  useEffect(() => {
    async function validarSesion() {
      try {
        const response = await fetch("/api/auth/me")
        const result = await response.json()

        if (!response.ok || !result.ok) {
          router.replace("/login")
          return
        }
      } catch {
        router.replace("/login")
        return
      } finally {
        setValidandoSesion(false)
      }
    }

    validarSesion()
  }, [router])

  async function descargarManual() {
    try {
      setDescargando(true)
      const response = await fetch("/api/manual/pdf")

      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw new Error(result.message || "No se pudo descargar el manual")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "manual-madymat.pdf"
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(error.message || "No se pudo descargar el manual")
    } finally {
      setDescargando(false)
    }
  }

  if (validandoSesion) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] p-6 dark:bg-slate-950">
        <section className="panel-surface mx-auto max-w-7xl">
          <p className="text-sm font-black uppercase tracking-wide text-[#F3171B]">
            AYUDA
          </p>
          <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
            Cargando manual...
          </h1>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className={SECTION_CLASS}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#F3171B]">
                <FiBookOpen className="h-5 w-5" aria-hidden="true" />
                {manualMeta.categoria}
              </div>
              <h1 className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">
                {manualMeta.titulo}
              </h1>
              <p className="mt-3 text-lg leading-8 text-slate-700 dark:text-slate-300">
                {manualMeta.descripcion}
              </p>
            </div>

            <button
              type="button"
              onClick={descargarManual}
              disabled={descargando}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#F3171B]/25 bg-[#F3171B] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#D90F14] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <FiDownload className="h-4 w-4" aria-hidden="true" />
              {descargando ? "Generando PDF..." : "Descargar manual en PDF"}
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {enlacesRapidosManual.map((enlace) => (
              <Link
                key={enlace.href}
                href={enlace.href}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900 transition hover:border-[#F3171B] hover:text-[#D90F14] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {enlace.label}
                <FiExternalLink className="h-4 w-4" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>

        <section className={SECTION_CLASS}>
          <div className="flex flex-wrap gap-2">
            {perfilesManual.map((item) => {
              const activo = item.id === perfilActivo

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPerfilActivo(item.id)}
                  className={`${TAB_CLASS} ${
                    activo
                      ? "border-[#F3171B] bg-[#F3171B] text-white"
                      : "border-slate-300 bg-white text-slate-900 hover:border-[#F3171B] hover:text-[#D90F14] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  }`}
                >
                  {item.tab}
                </button>
              )
            })}
          </div>

          <div className="mt-6">
            <p className="text-sm font-black uppercase tracking-wide text-[#F3171B]">
              {perfil.tab}
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">
              {perfil.titulo}
            </h2>
            <p className="mt-2 max-w-3xl leading-7 text-slate-700 dark:text-slate-300">
              {perfil.descripcion}
            </p>
          </div>

          <div className="mt-6 grid gap-4">
            {perfil.secciones.map((seccion) => (
              <SeccionManual key={seccion.titulo} seccion={seccion} />
            ))}
          </div>
        </section>

        <PreguntasFrecuentes />
      </div>
    </main>
  )
}
