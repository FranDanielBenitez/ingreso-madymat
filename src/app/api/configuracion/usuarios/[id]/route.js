import { NextResponse } from "next/server"
import { getCurrentUser, hashPassword } from "@/lib/auth"
import { canManageUsuarios } from "@/lib/auth/permissions"
import { prisma } from "@/lib/prisma"

const VALID_ROLES = [
  "DATA_ENTRY",
  "PROVEEDORES_AUDITOR",
  "ADMINISTRADOR",
  "IT_TECNICO",
]

const OFFICIAL_TO_LEGACY_ROL = {
  DATA_ENTRY: "PORTERIA",
  PROVEEDORES_AUDITOR: "PROVEEDORES",
  ADMINISTRADOR: "ADMIN",
  IT_TECNICO: "SISTEMAS",
}

const LEGACY_TO_OFFICIAL_ROL = {
  ADMIN: ["ADMINISTRADOR", "IT_TECNICO", "DATA_ENTRY"],
  PORTERIA: ["DATA_ENTRY"],
  PROVEEDORES: ["PROVEEDORES_AUDITOR"],
  SISTEMAS: ["IT_TECNICO"],
}

function limpiarTexto(value) {
  if (value === null || value === undefined) return ""
  return String(value).trim()
}

function validarEmail(email) {
  const texto = limpiarTexto(email)
  return texto === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto)
}

function validarUsuario(usuario) {
  const texto = limpiarTexto(usuario)
  return /^[a-zA-Z0-9._-]{3,50}$/.test(texto)
}

function normalizarRoles(input) {
  const rolesInput = Array.isArray(input) ? input : [input].filter(Boolean)
  const roles = [...new Set(rolesInput.map((rol) => limpiarTexto(rol).toUpperCase()))]
  return roles.filter((rol) => VALID_ROLES.includes(rol))
}

function rolesOficialesParaUsuario(usuario) {
  if (Array.isArray(usuario?.roles) && usuario.roles.length > 0) {
    return usuario.roles.map((item) => item.rol).filter(Boolean)
  }

  return LEGACY_TO_OFFICIAL_ROL[usuario?.rol] || []
}

function rolLegacyPrincipal(roles) {
  const principal =
    roles.includes("ADMINISTRADOR")
      ? "ADMINISTRADOR"
      : roles.includes("IT_TECNICO")
        ? "IT_TECNICO"
        : roles.includes("PROVEEDORES_AUDITOR")
          ? "PROVEEDORES_AUDITOR"
          : "DATA_ENTRY"

  return OFFICIAL_TO_LEGACY_ROL[principal] || "PORTERIA"
}

function serializarUsuario(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    usuario: usuario.usuario,
    rol: usuario.rol,
    activo: usuario.activo,
    legajoSjala: usuario.legajoSjala,
    createdAt: usuario.createdAt,
    updatedAt: usuario.updatedAt,
    passwordConfigured: Boolean(usuario.passwordHash),
    roles: rolesOficialesParaUsuario(usuario),
  }
}

const USUARIO_SELECT = {
  id: true,
  nombre: true,
  email: true,
  usuario: true,
  rol: true,
  activo: true,
  legajoSjala: true,
  passwordHash: true,
  createdAt: true,
  updatedAt: true,
  roles: {
    select: {
      rol: true,
    },
    orderBy: {
      rol: "asc",
    },
  },
}

export async function PATCH(request, context) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !canManageUsuarios(currentUser)) {
      return NextResponse.json(
        {
          ok: false,
          message: "No autorizado",
        },
        { status: 403 }
      )
    }

    const params = await context.params
    const id = Number(params.id)

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { ok: false, message: "ID de usuario no valido" },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => null)

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { ok: false, message: "Debe enviarse el cuerpo de actualizacion" },
        { status: 400 }
      )
    }

    const nombre = limpiarTexto(body?.nombre)
    const email = limpiarTexto(body?.email)
    const usuario = limpiarTexto(body?.usuario)
    const roles = normalizarRoles(body?.roles)
    const password = String(body?.password || "")

    if (!nombre) {
      return NextResponse.json(
        { ok: false, message: "El nombre del usuario es obligatorio" },
        { status: 400 }
      )
    }

    if (email && !validarEmail(email)) {
      return NextResponse.json(
        { ok: false, message: "Debe ingresar un email valido" },
        { status: 400 }
      )
    }

    if (!usuario || !validarUsuario(usuario)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "El nombre de usuario debe tener al menos 3 caracteres y solo puede contener letras, numeros, puntos, guiones y guiones bajos",
        },
        { status: 400 }
      )
    }

    if (roles.length === 0) {
      return NextResponse.json(
        { ok: false, message: "Seleccione al menos un rol." },
        { status: 400 }
      )
    }

    if (password && password.length < 8) {
      return NextResponse.json(
        {
          ok: false,
          message: "La nueva contrasena debe tener al menos 8 caracteres",
        },
        { status: 400 }
      )
    }

    const data = {
      nombre,
      usuario,
      email: email || `${usuario}@ingreso-madymat.local`,
      rol: rolLegacyPrincipal(roles),
      activo: Boolean(body?.activo),
    }

    if (password) {
      data.passwordHash = hashPassword(password)
    }

    const usuarioActualizado = await prisma.$transaction(async (tx) => {
      await tx.usuarioRol.deleteMany({
        where: {
          usuarioId: id,
        },
      })

      await tx.usuarioApp.update({
        where: {
          id,
        },
        data: {
          ...data,
          roles: {
            createMany: {
              data: roles.map((rol) => ({ rol })),
            },
          },
        },
      })

      return tx.usuarioApp.findUnique({
        where: {
          id,
        },
        select: USUARIO_SELECT,
      })
    })

    return NextResponse.json({
      ok: true,
      usuario: serializarUsuario(usuarioActualizado),
    })
  } catch (error) {
    console.error("Error actualizando usuario:", error)

    if (error?.code === "P2025") {
      return NextResponse.json(
        { ok: false, message: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    if (error?.code === "P2002" && Array.isArray(error?.meta?.target)) {
      const target = error.meta.target[0]
      const field =
        target === "email" ? "Email" : target === "usuario" ? "Usuario" : "Campo"

      return NextResponse.json(
        {
          ok: false,
          message: `${field} ya se encuentra registrado`,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        ok: false,
        message: "Error actualizando usuario",
      },
      { status: 500 }
    )
  }
}
