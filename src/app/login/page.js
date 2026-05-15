"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const SECTION_CLASS =
  "rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm shadow-slate-200/70"
const LABEL_CLASS = "mb-1 block text-sm font-semibold text-[#0F172A]"
const FIELD_CLASS =
  "w-full rounded-lg border border-[#CBD5E1] bg-white p-3 text-[#0F172A] placeholder:text-slate-400 outline-none focus:border-[#F3171B] focus:ring-2 focus:ring-red-100"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function verifySession() {
      try {
        const response = await fetch("/api/auth/me")
        const result = await response.json()

        if (response.ok && result.ok) {
          router.replace("/")
        }
      } catch {
        // No action needed
      }
    }

    verifySession()
  }, [router])

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

  async function onSubmit(values) {
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        toast.error(result.message || "No se pudo iniciar sesión")
        return
      }

      toast.success("Bienvenido al sistema")
      router.push("/")
    } catch (error) {
      toast.error("Error iniciando sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] p-6">
      <div className="mx-auto max-w-md space-y-6">
        <section className={SECTION_CLASS}>
          <p className="text-sm font-bold uppercase tracking-wide text-[#F3171B]">
            Login interno
          </p>
          <h1 className="mt-2 text-3xl font-black text-[#0F172A]">
            Acceder a Ingreso Madymat
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#475569]">
            Ingrese su usuario y contraseña para acceder al sistema.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <label>
              <span className={LABEL_CLASS}>Usuario</span>
              <input
                type="text"
                {...register("usuario", { required: true })}
                className={FIELD_CLASS}
                placeholder="admin"
              />
              {errors.usuario && (
                <p className="mt-2 text-sm text-red-600">
                  Este campo es obligatorio.
                </p>
              )}
            </label>

            <label>
              <span className={LABEL_CLASS}>Contraseña</span>
              <input
                type="password"
                {...register("password", { required: true })}
                className={FIELD_CLASS}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">
                  Este campo es obligatorio.
                </p>
              )}
            </label>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
