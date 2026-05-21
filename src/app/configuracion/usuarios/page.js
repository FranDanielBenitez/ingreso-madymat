"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

const SECTION_CLASS = "panel-surface"
const LABEL_CLASS = "mb-1 block text-sm font-semibold text-[#0F172A] dark:text-slate-100"
const FIELD_CLASS =
  "w-full rounded-lg border border-[#CBD5E1] bg-white p-3 text-[#0F172A] placeholder:text-slate-400 outline-none focus:border-[#F3171B] focus:ring-2 focus:ring-red-100 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:ring-red-950/40"
const FIELD_COMPACT_CLASS =
  "w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A] placeholder:text-slate-400 outline-none focus:border-[#F3171B] focus:ring-2 focus:ring-red-100 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:ring-red-950/40"

const ROLES = [
  { value: "DATA_ENTRY", label: "Data Entry" },
  { value: "PROVEEDORES_AUDITOR", label: "Proveedores Auditor" },
  { value: "ADMINISTRADOR", label: "Administrador" },
  { value: "IT_TECNICO", label: "IT Tecnico" },
]

function RolesCheckboxes({ value, onChange, compact = false, columns = 2 }) {
  const roles = value || []

  function toggle(rol) {
    onChange(
      roles.includes(rol)
        ? roles.filter((item) => item !== rol)
        : [...roles, rol]
    )
  }

  const gridClass = compact
    ? columns === 4
      ? "sm:grid-cols-2 xl:grid-cols-4"
      : "sm:grid-cols-2"
    : "sm:grid-cols-2"

  return (
    <div className={`grid gap-2 ${gridClass}`}>
      {ROLES.map((rol) => (
        <label
          key={rol.value}
          className={`inline-flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-white font-semibold text-[#0F172A] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${
            compact ? "px-2.5 py-2 text-xs" : "px-3 py-2 text-sm"
          }`}
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
      <div className="mx-auto max-w-7xl space-y-6">
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

        <section className={SECTION_CLASS}>
          <h2 className="text-lg font-bold text-[#0F172A]">Nuevo usuario</h2>
          <form onSubmit={handleSubmit(crearUsuario)} className="mt-4">
            <div className="grid gap-4 lg:grid-cols-6">
              <label className="lg:col-span-1">
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

              <label className="lg:col-span-2">
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

              <label className="lg:col-span-2">
                <span className={LABEL_CLASS}>Email (opcional)</span>
                <input
                  type="email"
                  {...register("email")}
                  className={FIELD_CLASS}
                  placeholder="usuario@ingreso-madymat.local"
                />
              </label>

              <label className="lg:col-span-1">
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

              <div className="space-y-2 lg:col-span-4">
                <span className={LABEL_CLASS}>Roles</span>
                <RolesCheckboxes
                  value={rolesNuevo}
                  onChange={setRolesNuevo}
                  compact
                  columns={4}
                />
                {rolesNuevo.length === 0 && (
                  <p className="text-sm text-red-600">Seleccione al menos un rol.</p>
                )}
              </div>

              <label className="flex items-center gap-3 self-end rounded-xl border border-[#CBD5E1] bg-white px-3 py-3 lg:col-span-1">
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

              <button
                type="submit"
                disabled={guardando}
                className="btn-primary self-end px-4 py-3 lg:col-span-1"
              >
                {guardando ? "Guardando..." : "Crear usuario"}
              </button>
            </div>
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
            <div className="mt-4 overflow-x-auto rounded-xl border border-[#CBD5E1]">
              <table className="w-full table-fixed border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#CBD5E1] bg-slate-50 text-[#475569]">
                    <th className="w-[12%] px-3 py-3 font-semibold">Usuario</th>
                    <th className="w-[18%] px-3 py-3 font-semibold">Nombre</th>
                    <th className="w-[18%] px-3 py-3 font-semibold">Email</th>
                    <th className="w-[25%] px-3 py-3 font-semibold">Roles</th>
                    <th className="w-[12%] px-3 py-3 font-semibold">Contrasena</th>
                    <th className="w-[7%] px-3 py-3 font-semibold">Activo</th>
                    <th className="w-[8%] px-3 py-3 font-semibold">Acciones</th>
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
                        <td className="px-3 py-3 align-top">
                          {editando ? (
                            <input
                              type="text"
                              value={editForm?.usuario || ""}
                              onChange={(event) =>
                                actualizarEditForm("usuario", event.target.value)
                              }
                              className={FIELD_COMPACT_CLASS}
                            />
                          ) : (
                            <span className="block truncate">
                              {usuarioItem.usuario || "-"}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top font-semibold">
                          {editando ? (
                            <input
                              type="text"
                              value={editForm?.nombre || ""}
                              onChange={(event) =>
                                actualizarEditForm("nombre", event.target.value)
                              }
                              className={FIELD_COMPACT_CLASS}
                            />
                          ) : (
                            <span className="block truncate">
                              {usuarioItem.nombre}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top">
                          {editando ? (
                            <input
                              type="email"
                              value={editForm?.email || ""}
                              onChange={(event) =>
                                actualizarEditForm("email", event.target.value)
                              }
                              className={FIELD_COMPACT_CLASS}
                            />
                          ) : (
                            <span className="block truncate">
                              {usuarioItem.email || "-"}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top">
                          {editando ? (
                            <RolesCheckboxes
                              value={editForm?.roles || []}
                              onChange={(roles) => actualizarEditForm("roles", roles)}
                              compact
                              columns={2}
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
                        <td className="px-3 py-3 align-top">
                          {editando ? (
                            <input
                              type="password"
                              value={editForm?.password || ""}
                              onChange={(event) =>
                                actualizarEditForm("password", event.target.value)
                              }
                              className={FIELD_COMPACT_CLASS}
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
                        <td className="px-3 py-3 align-top">
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
                        <td className="px-3 py-3 align-top">
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
