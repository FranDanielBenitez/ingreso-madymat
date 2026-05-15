"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { FiLock, FiUser } from "react-icons/fi"

const FIELD_CLASS =
  "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-[#0F172A] outline-none placeholder:text-slate-400 focus:border-[#F3171B] focus:ring-4 focus:ring-red-100"

export default function LoginPage() {
  const router = useRouter()
  const [verificandoSesion, setVerificandoSesion] = useState(true)
  const [enviando, setEnviando] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      usuario: "",
      password: "",
    },
  })

  useEffect(() => {
    async function verificarSesion() {
      try {
        const response = await fetch("/api/auth/me")
        const result = await response.json()

        if (response.ok && result.ok) {
          router.replace("/")
          return
        }
      } catch {
        // Si no hay sesion disponible, se muestra el portal de login.
      } finally {
        setVerificandoSesion(false)
      }
    }

    verificarSesion()
  }, [router])

  async function onSubmit(values) {
    if (enviando) return

    setEnviando(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario: values.usuario,
          password: values.password,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Usuario o contraseña incorrectos")
      }

      toast.success("Inicio de sesión correcto")
      router.replace("/")
      router.refresh()
    } catch (error) {
      toast.error(error.message || "Error procesando inicio de sesión")
    } finally {
      setEnviando(false)
    }
  }

  if (verificandoSesion) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0B1120] px-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/10 px-6 py-5 text-sm font-semibold shadow-2xl backdrop-blur">
          Preparando acceso...
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B1120] text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(243,23,27,0.28),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(245,158,11,0.14),transparent_24%),linear-gradient(135deg,#0B1120_0%,#111827_48%,#1E293B_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute -left-24 top-20 h-72 w-72 rounded-full border border-white/10 bg-white/5 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[-8rem] right-[-6rem] h-80 w-80 rounded-full border border-red-300/10 bg-[#F3171B]/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/30 to-transparent"
      />

      <section className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-6 py-10 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
        <div className="space-y-8">
          <div className="inline-flex rounded-3xl border border-white/10 bg-white/8 px-5 py-4 shadow-2xl shadow-black/20 backdrop-blur">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Logo%20Envases%20white.png"
              alt="Puebla Envases"
              className="h-12 w-auto object-contain sm:h-14"
            />
          </div>

          <div className="max-w-2xl space-y-5">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#F3171B]">
              Portal interno
            </p>
            <div className="space-y-3">
              <h1 className="text-5xl font-black leading-tight tracking-tight sm:text-6xl">
                Madymat
              </h1>
              <p className="text-2xl font-extrabold text-white/90 sm:text-3xl">
                Registración de Ingresos a Fábrica
              </p>
            </div>
            <p className="max-w-xl text-base leading-8 text-slate-200 sm:text-lg">
              Sistema interno para registrar, controlar y auditar ingresos de
              rollizos, materiales, proveedores, transporte y documentación
              asociada.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {["Portería", "Proveedores", "Auditoría"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-bold text-slate-100"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="w-full">
          <div className="rounded-[2rem] border border-white/18 bg-white/95 p-6 text-[#0F172A] shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
            <div className="mb-8">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#F3171B]">
                Acceso al sistema
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">
                Iniciar sesión
              </h2>
              <p className="mt-2 text-sm font-medium leading-6 text-[#475569]">
                Ingresá con tu usuario interno para continuar.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label
                  htmlFor="usuario"
                  className="mb-2 flex items-center gap-2 text-sm font-black text-[#0F172A]"
                >
                  <FiUser className="h-4 w-4 text-[#D90F14]" />
                  Usuario
                </label>
                <input
                  id="usuario"
                  type="text"
                  autoComplete="username"
                  placeholder="Ej: admin"
                  className={FIELD_CLASS}
                  {...register("usuario", {
                    required: "El usuario es obligatorio",
                  })}
                />
                {errors.usuario && (
                  <p className="mt-2 text-sm font-semibold text-[#DC2626]">
                    {errors.usuario.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 flex items-center gap-2 text-sm font-black text-[#0F172A]"
                >
                  <FiLock className="h-4 w-4 text-[#D90F14]" />
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Ingresá tu contraseña"
                  className={FIELD_CLASS}
                  {...register("password", {
                    required: "La contraseña es obligatoria",
                  })}
                />
                {errors.password && (
                  <p className="mt-2 text-sm font-semibold text-[#DC2626]">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-[#F3171B] px-5 py-3.5 text-base font-black text-white shadow-lg shadow-red-950/15 hover:bg-[#D90F14] focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {enviando ? "Ingresando..." : "Ingresar"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
