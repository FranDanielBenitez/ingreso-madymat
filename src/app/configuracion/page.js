"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FiMapPin, FiUsers } from "react-icons/fi"

const SECTION_CLASS = "panel-surface"

const MODULOS = [
  {
    titulo: "Usuarios y Permisos",
    descripcion: "Alta, baja, activacion de usuarios y asignacion de roles.",
    href: "/configuracion/usuarios",
    icon: FiUsers,
  },
  {
    titulo: "Configuracion de Procedencias",
    descripcion: "Administrar procedencias disponibles para Rollizos y Materiales.",
    href: "/configuracion/procedencias",
    icon: FiMapPin,
  },
]

export default function ConfiguracionPage() {
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargarUsuario() {
      try {
        const response = await fetch("/api/auth/me")
        const result = await response.json()

        if (response.ok && result.ok) {
          setUsuario(result.user)
        }
      } finally {
        setLoading(false)
      }
    }

    cargarUsuario()
  }, [])

  const autorizado =
    usuario?.roles?.includes("ADMINISTRADOR") ||
    usuario?.roles?.includes("IT_TECNICO")

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] p-6">
        <section className={`mx-auto max-w-6xl ${SECTION_CLASS}`}>
          <h1 className="text-2xl font-bold text-[#0F172A]">Cargando configuracion...</h1>
        </section>
      </main>
    )
  }

  if (!autorizado) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] p-6">
        <section className={`mx-auto max-w-6xl ${SECTION_CLASS}`}>
          <h1 className="text-2xl font-bold text-[#0F172A]">Acceso denegado</h1>
          <p className="mt-2 text-[#475569]">
            Solo administradores o IT tecnico pueden acceder a configuracion.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className={SECTION_CLASS}>
          <p className="text-sm font-bold uppercase tracking-wide text-[#F3171B]">
            Configuracion
          </p>
          <h1 className="mt-1 text-3xl font-black text-[#0F172A]">
            Panel de configuracion
          </h1>
          <p className="mt-2 text-[#475569]">
            Administracion de parametros, usuarios y permisos del sistema.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {MODULOS.map((modulo) => {
            const Icon = modulo.icon

            return (
              <Link
                key={modulo.href}
                href={modulo.href}
                className="quick-access-card panel-surface panel-surface-soft group flex items-start gap-4 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#CBD5E1] bg-white text-slate-700 group-hover:border-amber-300 group-hover:bg-amber-50 group-hover:text-amber-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:group-hover:border-amber-400/40 dark:group-hover:bg-amber-400/10 dark:group-hover:text-amber-200">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-lg font-black text-[#0F172A]">
                    {modulo.titulo}
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-[#475569]">
                    {modulo.descripcion}
                  </span>
                </span>
              </Link>
            )
          })}
        </section>
      </div>
    </main>
  )
}
