"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/ingresos/rollizos", label: "Nuevo Rollizos" },
  { href: "/ingresos/materiales", label: "Nuevo Materiales" },
  { href: "/registros", label: "Registros" },
]

function SunIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.8v2.1M12 19.1v2.1M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2.8 12h2.1M19.1 12h2.1M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
    >
      <path d="M20.4 14.7A8.2 8.2 0 0 1 9.3 3.6 8.7 8.7 0 1 0 20.4 14.7Z" />
    </svg>
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
        <span aria-hidden="true" className="-translate-y-px">
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
        <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-0">
          <Link
            href="/"
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                theme === "dark"
                  ? "/Logo%20Envases%20white.png"
                  : "/Logo%20Envases%20dark.png"
              }
              alt="Puebla Envases"
              className="h-10 w-auto object-contain object-left"
            />
            <span
              aria-hidden="true"
              className="hidden h-10 w-px bg-gradient-to-b from-transparent via-[#F3171B]/45 to-transparent sm:block"
            />
            <span className="block text-lg font-black tracking-tight text-[#0F172A]">
              Ingreso Madymat
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-2 pr-12">
            {LINKS.map((link) => {
              const activo =
                link.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(link.href)

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link rounded-lg px-3 py-2 text-sm font-bold ${
                    activo
                      ? "nav-link-active bg-[#F3171B] text-white shadow-sm"
                      : "text-[#0F172A] hover:bg-red-50 hover:text-[#D90F14] focus:bg-red-50 focus:text-[#D90F14] focus:outline-none"
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
            <button
              type="button"
              onClick={cambiarTema}
              className="grid h-10 w-10 place-items-center rounded-lg border-[0.5px] border-[#CBD5E1] bg-white text-[#0F172A] hover:border-[#F3171B] hover:text-[#D90F14] focus:border-[#F3171B] focus:outline-none focus:ring-2 focus:ring-red-100"
              aria-label={`Cambiar a modo ${theme === "dark" ? "claro" : "oscuro"}`}
              title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </nav>
      </header>
    </>
  )
}
