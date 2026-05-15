"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FiHome,
  FiList,
  FiAlertTriangle,
  FiSettings,
  FiSun,
  FiMoon,
  FiChevronUp,
  FiChevronDown,
} from "react-icons/fi"
import { GiWoodPile, GiWoodBeam } from "react-icons/gi"

const LINKS = [
  { href: "/", label: "Inicio", icon: FiHome },
  { href: "/ingresos/rollizos", label: "Rollizos", icon: GiWoodPile },
  { href: "/ingresos/materiales", label: "Materiales", icon: GiWoodBeam },
  { href: "/registros", label: "Registros", icon: FiList },
  { href: "/registros/pendientes-validacion", label: "Pendientes", icon: FiAlertTriangle },
]

function ThemeIcon({ dark }) {
  return dark ? (
    <FiSun className="h-5 w-5" aria-hidden="true" />
  ) : (
    <FiMoon className="h-5 w-5" aria-hidden="true" />
  )
}

export default function Navbar() {
  const pathname = usePathname()
  const [theme, setTheme] = useState("light")
  const [navbarOculto, setNavbarOculto] = useState(false)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    const oculto =
      localStorage.getItem("ingreso-madymat-navbar-oculto") === "true"

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(isDark ? "dark" : "light")
    setNavbarOculto(oculto)
  }, [])

  function cambiarTema() {
    const nuevoTema = theme === "dark" ? "light" : "dark"

    document.documentElement.classList.toggle("dark", nuevoTema === "dark")
    document.documentElement.dataset.theme = nuevoTema
    localStorage.setItem("ingreso-madymat-theme", nuevoTema)
    setTheme(nuevoTema)
  }

  function ocultarNavbar() {
    localStorage.setItem("ingreso-madymat-navbar-oculto", "true")
    setNavbarOculto(true)
  }

  function mostrarNavbar() {
    localStorage.setItem("ingreso-madymat-navbar-oculto", "false")
    setNavbarOculto(false)
  }

  function alternarNavbar() {
    if (navbarOculto) {
      mostrarNavbar()
      return
    }

    ocultarNavbar()
  }

  return (
    <>
      <button
        type="button"
        onClick={alternarNavbar}
        className="fixed right-4 top-4 z-40 grid h-10 w-10 place-items-center rounded-lg border border-[#CBD5E1] bg-white text-xl font-normal leading-none text-[#0F172A] shadow-sm hover:border-[#F3171B] hover:text-[#D90F14] focus:border-[#F3171B] focus:outline-none focus:ring-2 focus:ring-red-100"
        aria-label={navbarOculto ? "Mostrar navbar" : "Ocultar navbar"}
        aria-expanded={!navbarOculto}
        title={navbarOculto ? "Mostrar navbar" : "Ocultar navbar"}
      >
        {navbarOculto ? (
          <FiChevronDown className="h-4 w-4" aria-hidden="true" />
        ) : (
          <FiChevronUp className="h-4 w-4" aria-hidden="true" />
        )}
        <span aria-hidden="true" className="hidden">
          {navbarOculto ? "⌄" : "⌃"}
        </span>
      </button>

      <header
        className={`sticky top-0 z-30 overflow-hidden border-b border-[#CBD5E1] bg-white/95 shadow-sm backdrop-blur transition-[max-height,transform,opacity] duration-300 ease-in-out ${
          navbarOculto
            ? "max-h-0 -translate-y-full border-transparent opacity-0"
            : "max-h-96 translate-y-0 opacity-100"
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-0">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                theme === "dark"
                  ? "/Logo%20Envases%20white.png"
                  : "/Logo%20Envases%20dark.png"
              }
              alt="Puebla Envases"
              className="h-9 w-auto object-contain object-left"
            />
            <span
              aria-hidden="true"
              className="hidden h-9 w-px bg-gradient-to-b from-transparent via-[#F3171B]/45 to-transparent sm:block"
            />
            <span className="hidden whitespace-nowrap text-base font-black tracking-tight text-[#0F172A] sm:block">
              Ingreso Madymat
            </span>
          </Link>

          <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-1 pr-12 lg:flex-nowrap">
            {LINKS.map((link) => {
              const activo =
                link.href === "/"
                  ? pathname === "/"
                  : link.href === "/registros"
                    ? pathname === "/registros"
                    : pathname?.startsWith(link.href)

              const Icon = link.icon

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link nav-link-compact ${activo ? "nav-link-active" : ""}`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
            <Link
              href="/configuracion/procedencias"
              className={`btn-icon ${
                pathname?.startsWith("/configuracion")
                  ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100"
                  : ""
              }`}
              aria-label="Configuracion"
              title="Configuracion"
            >
              <FiSettings className="h-4 w-4" aria-hidden="true" />
            </Link>
            <span
              aria-hidden="true"
              className="mx-1 hidden h-8 w-px bg-gradient-to-b from-transparent via-[#CBD5E1] to-transparent lg:block"
            />
            <button
              type="button"
              onClick={cambiarTema}
              className="btn-icon"
              aria-label={`Cambiar a modo ${theme === "dark" ? "claro" : "oscuro"}`}
              title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
            >
              <ThemeIcon dark={theme === "dark"} />
            </button>
          </div>
        </nav>
      </header>
    </>
  )
}
