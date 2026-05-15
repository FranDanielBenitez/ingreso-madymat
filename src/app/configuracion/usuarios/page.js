"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

const SECTION_CLASS =
  "rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm shadow-slate-200/70"
const LABEL_CLASS = "mb-1 block text-sm font-semibold text-[#0F172A]"
const FIELD_CLASS =
  "w-full rounded-lg border border-[#CBD5E1] bg-white p-3 text-[#0F172A] placeholder:text-slate-400 outline-none focus:border-[#F3171B] focus:ring-2 focus:ring-red-100"

const ROLES = [
  { value: "DATA_ENTRY", label: "Data Entry" },
  { value: "PROVEEDORES_AUDITOR", label: "Proveedores Auditor" },
  { value: "ADMINISTRADOR", label: "Administrador" },
  { value: "IT_TECNICO", label: "IT Tecnico" },
]

function RolesCheckboxes({ value, onChange }) {
  const roles = value || []

  function toggle(rol) {
    onChange(
      roles.includes(rol)
        ? roles.filter((item) => item !== rol)
        : [...roles, rol]
    )
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {ROLES.map((rol) => (
        <label
          key={rol.value}
          className="inline-flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm font-semibold text-[#0F172A]"
        >
          <input
            type="checkbox"
            checked={roles.includes(rol.value)}
            onChange={() => toggle(rol.value)}
            className="h-4 w-4 rounded border-[#CBD5E1] accent-[#F3171B]"
          />
          {rol.label}
        </label>
      ))}
    </div>
  )
}

export default function UsuariosPage() {
  const [currentUser, setCurrentUser] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [actualizando, setActualizando] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [rolesNuevo, setRolesNuevo] = useState(["DATA_ENTRY"])
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nombre: "",
      email: "",
      usuario: "",
      activo: true,
      password: "",
    },
  })

  async function cargarDatos() {
    setLoading(true)
    setError("")

    try {
      const [meResponse, usuariosResponse] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/configuracion/usuarios"),
      ])

      const meResult = await meResponse.json()
      const usuariosResult = await usuariosResponse.json()

      if (meResponse.ok && meResult.ok) {
        setCurrentUser(meResult.user)
      }

      if (!usuariosResponse.ok || !usuariosResult.ok) {
        throw new Error(usuariosResult.message || "No se pudieron cargar los usuarios")
      }

      setUsuarios(usuariosResult.usuarios || [])
    } catch (err) {
      setError(err.message || "No se pudieron cargar los usuarios")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatos()
  }, [])

  function iniciarEdicion(usuarioItem) {
    setEditandoId(usuarioItem.id)
    setEditForm({
      nombre: usuarioItem.nombre || "",
      email: usuarioItem.email || "",
      usuario: usuarioItem.usuario || "",
      roles: usuarioItem.roles?.length ? usuarioItem.roles : ["DATA_ENTRY"],
      activo: Boolean(usuarioItem.activo),
      password: "",
    })
  }

  function actualizarEditForm(campo, valor) {
    setEditForm((prev) => ({
      ...prev,
      [campo]: valor,
    }))
  }

  async function guardarEdicion(usuarioId) {
    if (!editForm) return

    if (!editForm.roles || editForm.roles.length === 0) {
      toast.error("Seleccione al menos un rol.")
      return
    }

    setActualizando(true)

    try {
      const response = await fetch(`/api/configuracion/usuarios/${usuarioId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "No se pudo actualizar el usuario")
      }

      setUsuarios((prev) =>
        prev.map((item) => (item.id === usuarioId ? result.usuario : item))
      )
      setEditandoId(null)
      setEditForm(null)
      toast.success("Usuario actualizado correctamente")
    } catch (err) {
      toast.error(err.message || "No se pudo actualizar el usuario")
    } finally {
      setActualizando(false)
    }
  }

  async function crearUsuario(data) {
    if (rolesNuevo.length === 0) {
      toast.error("Seleccione al menos un rol.")
      return
    }

    setGuardando(true)

    try {
      const response = await fetch("/api/configuracion/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          roles: rolesNuevo,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "No se pudo crear el usuario")
      }

      setUsuarios((prev) => [result.usuario, ...prev])
      toast.success("Usuario agregado correctamente")
      reset({
        nombre: "",
        email: "",
        usuario: "",
        activo: true,
        password: "",
      })
      setRolesNuevo(["DATA_ENTRY"])
    } catch (err) {
      toast.error(err.message || "No se pudo crear el usuario")
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] p-6">
        <section className="mx-auto max-w-5xl">
          <div className={SECTION_CLASS}>
            <h1 className="text-2xl font-bold text-[#0F172A]">Cargando usuarios...</h1>
          </div>
        </section>
      </main>
    )
  }

  if (
    !currentUser ||
    (!currentUser.roles?.includes("ADMINISTRADOR") &&
      !currentUser.roles?.includes("IT_TECNICO"))
  ) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] p-6">
        <section className="mx-auto max-w-5xl">
          <div className={SECTION_CLASS}>
            <h1 className="text-2xl font-bold text-[#0F172A]">
              Acceso denegado
            </h1>
            <p className="mt-3 text-[#475569]">
              Solo los usuarios con rol de administrador o IT tecnico pueden gestionar usuarios.
            </p>
          </div>
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
            Usuarios y Permisos
          </h1>
          <p className="mt-2 text-[#475569]">
            Alta y mantenimiento de usuarios internos, roles y accesos.
          </p>
        </section>

        <section className={`${SECTION_CLASS} max-w-3xl`}>
          <h2 className="text-lg font-bold text-[#0F172A]">Nuevo usuario</h2>
          <form onSubmit={handleSubmit(crearUsuario)} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={LABEL_CLASS}>Usuario</span>
                <input
                  type="text"
                  {...register("usuario", { required: true })}
                  className={FIELD_CLASS}
                  placeholder="portero550"
                />
                {errors.usuario && (
                  <p className="mt-2 text-sm text-red-600">
                    El usuario es obligatorio.
                  </p>
                )}
              </label>

              <label>
                <span className={LABEL_CLASS}>Nombre completo</span>
                <input
                  type="text"
                  {...register("nombre", { required: true })}
                  className={FIELD_CLASS}
                  placeholder="Maria Perez"
                />
                {errors.nombre && (
                  <p className="mt-2 text-sm text-red-600">
                    El nombre es obligatorio.
                  </p>
                )}
              </label>

              <label>
                <span className={LABEL_CLASS}>Email (opcional)</span>
                <input
                  type="email"
                  {...register("email")}
                  className={FIELD_CLASS}
                  placeholder="usuario@ingreso-madymat.local"
                />
              </label>

              <label>
                <span className={LABEL_CLASS}>Contrasena</span>
                <input
                  type="password"
                  {...register("password", { required: true, minLength: 8 })}
                  className={FIELD_CLASS}
                  placeholder="********"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">
                    La contrasena debe tener al menos 8 caracteres.
                  </p>
                )}
              </label>
            </div>

            <div className="space-y-2">
              <span className={LABEL_CLASS}>Roles</span>
              <RolesCheckboxes value={rolesNuevo} onChange={setRolesNuevo} />
              {rolesNuevo.length === 0 && (
                <p className="text-sm text-red-600">Seleccione al menos un rol.</p>
              )}
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                {...register("activo")}
                className="h-4 w-4 rounded border-[#CBD5E1] accent-[#F3171B]"
                defaultChecked
              />
              <span className="text-sm font-semibold text-[#475569]">
                Cuenta activa
              </span>
            </label>

            <button type="submit" disabled={guardando} className="btn-primary">
              {guardando ? "Guardando..." : "Crear usuario"}
            </button>
          </form>
        </section>

        <section className={SECTION_CLASS}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">Usuarios registrados</h2>
              <p className="mt-1 text-sm text-[#475569]">
                Lista de cuentas internas con acceso al sistema.
              </p>
            </div>
            <button type="button" onClick={cargarDatos} className="btn-secondary w-fit">
              Actualizar
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="font-semibold text-red-700">{error}</p>
            </div>
          ) : usuarios.length === 0 ? (
            <p className="mt-4 text-[#475569]">Todavia no hay usuarios registrados.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#CBD5E1] text-[#475569]">
                    <th className="py-3 pr-4 font-semibold">Usuario</th>
                    <th className="py-3 pr-4 font-semibold">Nombre</th>
                    <th className="py-3 pr-4 font-semibold">Email</th>
                    <th className="py-3 pr-4 font-semibold">Roles</th>
                    <th className="py-3 pr-4 font-semibold">Contrasena</th>
                    <th className="py-3 pr-4 font-semibold">Activo</th>
                    <th className="py-3 pr-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuarioItem) => {
                    const editando = editandoId === usuarioItem.id

                    return (
                      <tr
                        key={usuarioItem.id}
                        className="border-b border-slate-100 text-[#0F172A] hover:bg-red-50/20"
                      >
                        <td className="py-3 pr-4">
                          {editando ? (
                            <input
                              type="text"
                              value={editForm?.usuario || ""}
                              onChange={(event) =>
                                actualizarEditForm("usuario", event.target.value)
                              }
                              className={FIELD_CLASS}
                            />
                          ) : (
                            usuarioItem.usuario || "-"
                          )}
                        </td>
                        <td className="py-3 pr-4 font-semibold">
                          {editando ? (
                            <input
                              type="text"
                              value={editForm?.nombre || ""}
                              onChange={(event) =>
                                actualizarEditForm("nombre", event.target.value)
                              }
                              className={FIELD_CLASS}
                            />
                          ) : (
                            usuarioItem.nombre
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {editando ? (
                            <input
                              type="email"
                              value={editForm?.email || ""}
                              onChange={(event) =>
                                actualizarEditForm("email", event.target.value)
                              }
                              className={FIELD_CLASS}
                            />
                          ) : (
                            usuarioItem.email || "-"
                          )}
                        </td>
                        <td className="py-3 pr-4 min-w-[280px]">
                          {editando ? (
                            <RolesCheckboxes
                              value={editForm?.roles || []}
                              onChange={(roles) => actualizarEditForm("roles", roles)}
                            />
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {(usuarioItem.roles || []).map((rol) => (
                                <span key={rol} className="badge-neutral">
                                  {ROLES.find((item) => item.value === rol)?.label || rol}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {editando ? (
                            <input
                              type="password"
                              value={editForm?.password || ""}
                              onChange={(event) =>
                                actualizarEditForm("password", event.target.value)
                              }
                              className={FIELD_CLASS}
                              placeholder="Nueva contrasena"
                            />
                          ) : (
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                usuarioItem.passwordConfigured
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                  : "border-amber-200 bg-amber-50 text-amber-800"
                              }`}
                            >
                              {usuarioItem.passwordConfigured
                                ? "Configurada"
                                : "Sin contrasena"}
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {editando ? (
                            <label className="inline-flex items-center gap-2 text-sm text-[#475569]">
                              <input
                                type="checkbox"
                                checked={Boolean(editForm?.activo)}
                                onChange={(event) =>
                                  actualizarEditForm("activo", event.target.checked)
                                }
                                className="h-4 w-4 rounded border-[#CBD5E1] accent-[#F3171B]"
                              />
                              Activo
                            </label>
                          ) : (
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                usuarioItem.activo
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                  : "border-slate-200 bg-slate-50 text-slate-600"
                              }`}
                            >
                              {usuarioItem.activo ? "Activo" : "Inactivo"}
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {editando ? (
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => guardarEdicion(usuarioItem.id)}
                                disabled={actualizando}
                                className="btn-primary px-3 py-2 text-sm"
                              >
                                {actualizando ? "Guardando..." : "Guardar"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditandoId(null)
                                  setEditForm(null)
                                }}
                                disabled={actualizando}
                                className="btn-secondary px-3 py-2 text-sm"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => iniciarEdicion(usuarioItem)}
                              className="btn-secondary px-3 py-2 text-sm"
                            >
                              Editar
                            </button>
                          )}
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
