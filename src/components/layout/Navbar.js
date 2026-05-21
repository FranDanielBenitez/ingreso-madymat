"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FiHome,
  FiList,
  FiAlertTriangle,
  FiBookOpen,
  FiSettings,
  FiSun,
  FiMoon,
  FiChevronUp,
  FiChevronDown,
  FiLogOut,
} from "react-icons/fi"
import { GiWoodPile, GiWoodBeam } from "react-icons/gi"

const LINKS = [
  { href: "/", label: "Inicio", icon: FiHome, iconOnly: true },
  { href: "/ingresos/rollizos", label: "Rollizos", icon: GiWoodPile },
  { href: "/ingresos/materiales", label: "Materiales", icon: GiWoodBeam },
  { href: "/registros", label: "Registros", icon: FiList },
  { href: "/registros/pendientes-validacion", label: "Pendientes", icon: FiAlertTriangle },
  { href: "/manual", label: "Manual", icon: FiBookOpen },
]

const ROL_PRINCIPAL = [
  { rol: "IT_TECNICO", label: "IT" },
  { rol: "ADMINISTRADOR", label: "Admin" },
  { rol: "PROVEEDORES_AUDITOR", label: "Pago a Proveedores" },
  { rol: "DATA_ENTRY", label: "Porteria" },
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
  const [usuario, setUsuario] = useState(null)
  const [cargandoUsuario, setCargandoUsuario] = useState(true)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    const oculto =
      localStorage.getItem("ingreso-madymat-navbar-oculto") === "true"
    const usuarioGuardado = leerUsuarioGuardado()

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(isDark ? "dark" : "light")
    setNavbarOculto(oculto)
    if (usuarioGuardado) {
      setUsuario(usuarioGuardado)
    }
  }, [pathname])

  useEffect(() => {
    if (pathname === "/login") {
      return
    }

    async function cargarUsuario() {
      setCargandoUsuario(true)

      try {
        const response = await fetch("/api/auth/me")
        const result = await response.json()

        if (response.ok && result.ok) {
          const usuarioActual = normalizarUsuarioNavbar(result.user || result.usuario)

          setUsuario(usuarioActual)
          guardarUsuarioNavbar(usuarioActual)
        } else {
          if (response.status === 401) {
            setUsuario(null)
            localStorage.removeItem("ingreso-madymat-user")
          }
        }
      } catch (error) {
        const usuarioGuardado = leerUsuarioGuardado()

        if (usuarioGuardado) {
          setUsuario(usuarioGuardado)
        }
      } finally {
        setCargandoUsuario(false)
      }
    }

    cargarUsuario()
  }, [pathname])

  const mostrarConfiguracion =
    !cargandoUsuario &&
    (usuario?.roles?.includes("ADMINISTRADOR") ||
      usuario?.roles?.includes("IT_TECNICO"))

  async function cerrarSesion() {
    await fetch("/api/auth/logout", { method: "POST" })
    localStorage.removeItem("ingreso-madymat-user")
    window.location.href = "/login"
  }

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

  if (pathname === "/login") {
    return null
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
      </button>

      <header
        className={`sticky top-0 z-30 border-b border-[#CBD5E1] bg-white/95 shadow-sm backdrop-blur transition-[max-height,transform,opacity] duration-300 ease-in-out ${
          navbarOculto
            ? "max-h-0 -translate-y-full overflow-hidden border-transparent opacity-0"
            : "max-h-96 translate-y-0 overflow-visible opacity-100"
        }`}
      >
        <nav className="flex w-full flex-wrap items-center gap-3 px-4 py-2.5 sm:px-6 lg:flex-nowrap">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                theme === "dark"
                  ? "/Logo%20Envases%20white.png"
                  : "/Logo%20Envases%20dark.png"
              }
              alt="Puebla Envases"
              className="h-8 w-auto object-contain object-left xl:h-9"
            />
            <span
              aria-hidden="true"
              className="hidden h-9 w-px bg-gradient-to-b from-transparent via-[#F3171B]/45 to-transparent sm:block"
            />
            <span className="hidden whitespace-nowrap text-sm font-black tracking-tight text-[#0F172A] xl:block 2xl:text-base">
              Ingreso Madymat
            </span>
          </Link>

          <div className="ml-auto flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2 pr-12 lg:flex-nowrap">
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1 overflow-hidden lg:flex-nowrap">
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
                    className={`nav-link nav-link-compact shrink-0 ${
                      link.iconOnly ? "px-3" : ""
                    } ${activo ? "nav-link-active" : ""}`}
                    aria-label={link.iconOnly ? link.label : undefined}
                    title={link.iconOnly ? link.label : undefined}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {!link.iconOnly ? (
                      <span className="hidden whitespace-nowrap xl:inline">
                        {link.label}
                      </span>
                    ) : null}
                  </Link>
                )
              })}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {mostrarConfiguracion && (
                <Link
                  href="/configuracion"
                  className={`btn-icon shrink-0 ${
                    pathname?.startsWith("/configuracion")
                      ? "border-[#F3171B]/30 bg-[#F3171B]/10 text-[#D90F14] dark:border-[#F3171B]/35 dark:bg-[#F3171B]/15 dark:text-red-100"
                      : ""
                  }`}
                  aria-label="Configuracion"
                  title="Configuracion"
                >
                  <FiSettings className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
              <button
                type="button"
                onClick={cambiarTema}
                className="btn-icon shrink-0"
                aria-label={`Cambiar a modo ${theme === "dark" ? "claro" : "oscuro"}`}
                title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
              >
                <ThemeIcon dark={theme === "dark"} />
              </button>
            </div>

            {!cargandoUsuario && (
              <div className="flex min-w-0 shrink-0 items-center gap-1.5">
                {usuario && (
                  <div
                    className="flex min-w-0 max-w-[11.5rem] items-center gap-2 rounded-xl border border-[#CBD5E1] bg-white px-3 py-2 text-[#0F172A] shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 2xl:max-w-[16rem]"
                    title={`${usuario.nombre || nombreVisible(usuario)} - ${(usuario.roles || []).join(", ")}`}
                  >
                    <span className="min-w-0 truncate text-sm font-black">
                      {nombreVisible(usuario)}
                    </span>
                    <span className="hidden shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-bold text-[#475569] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 2xl:inline-flex">
                      {rolPrincipal(usuario)}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={cerrarSesion}
                  className="btn-icon group relative shrink-0"
                  title="Salir"
                  aria-label="Salir"
                >
                  <FiLogOut className="h-4 w-4" aria-hidden="true" />
                  <span className="pointer-events-none absolute right-0 top-[calc(100%+0.5rem)] z-50 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-[#0F172A] opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                    Salir
                  </span>
                </button>
              </div>
            )}
            {cargandoUsuario && (
              <div className="h-10 w-40 shrink-0 rounded-xl border border-[#CBD5E1] bg-white/70 dark:border-slate-700 dark:bg-slate-900/70" />
            )}
          </div>
        </nav>
      </header>
    </>
  )
}

function rolPrincipal(usuario) {
  const roles = normalizarRolesNavbar(usuario?.roles || usuario?.rol)
  const encontrado = ROL_PRINCIPAL.find((item) => roles.includes(item.rol))

  return encontrado?.label || "Usuario"
}

function nombreVisible(usuario) {
  return usuario?.nombre || usuario?.usuario || "Usuario"
}

function normalizarRolesNavbar(value) {
  const roles = Array.isArray(value) ? value : [value].filter(Boolean)

  return roles
    .map((item) => (typeof item === "string" ? item : item?.rol))
    .filter(Boolean)
    .map((rol) => {
      const clave = String(rol).toUpperCase()

      if (clave === "ADMIN") return "ADMINISTRADOR"
      if (clave === "PORTERIA") return "DATA_ENTRY"
      if (clave === "PROVEEDORES") return "PROVEEDORES_AUDITOR"
      if (clave === "SISTEMAS") return "IT_TECNICO"

      return clave
    })
}

function normalizarUsuarioNavbar(value) {
  if (!value) return null

  return {
    ...value,
    roles: normalizarRolesNavbar(value.roles || value.rol),
  }
}

function leerUsuarioGuardado() {
  try {
    const raw = localStorage.getItem("ingreso-madymat-user")
    return normalizarUsuarioNavbar(raw ? JSON.parse(raw) : null)
  } catch {
    return null
  }
}

function guardarUsuarioNavbar(usuario) {
  if (!usuario) return

  localStorage.setItem("ingreso-madymat-user", JSON.stringify(usuario))
}

