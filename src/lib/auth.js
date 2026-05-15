import { cookies } from "next/headers"
import { randomBytes, scryptSync, timingSafeEqual } from "crypto"
import { prisma } from "@/lib/prisma"

const SESSION_COOKIE_NAME = "ingreso_madymat_session"
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex")
  const derivedKey = scryptSync(String(password), salt, 64)
  return `${salt}:${derivedKey.toString("hex")}`
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== "string") return false

  const [salt, key] = storedHash.split(":")
  if (!salt || !key) return false

  const derivedKey = scryptSync(String(password), salt, 64)
  const storedKey = Buffer.from(key, "hex")

  try {
    return timingSafeEqual(storedKey, derivedKey)
  } catch {
    return false
  }
}

const ROLES_OFICIALES = {
  ADMIN: "ADMINISTRADOR",
  PORTERIA: "DATA_ENTRY",
  PROVEEDORES: "PROVEEDORES_AUDITOR",
  SISTEMAS: "IT_TECNICO",
}

const ROLES_POR_LEGACY = {
  ADMIN: ["ADMINISTRADOR", "IT_TECNICO", "DATA_ENTRY"],
  PORTERIA: ["DATA_ENTRY"],
  PROVEEDORES: ["PROVEEDORES_AUDITOR"],
  SISTEMAS: ["IT_TECNICO"],
}

export function normalizeRol(rol) {
  if (!rol) return null
  const clave = String(rol).toUpperCase()
  return ROLES_OFICIALES[clave] || clave
}

export function getUserRoles(usuario) {
  if (Array.isArray(usuario?.roles) && usuario.roles.length > 0) {
    return usuario.roles
      .map((item) => (typeof item === "string" ? item : item?.rol))
      .filter(Boolean)
  }

  if (!usuario?.rol) return []
  const clave = String(usuario.rol).toUpperCase()
  const roles = ROLES_POR_LEGACY[clave]

  if (roles) return roles

  const rolOficial = normalizeRol(usuario.rol)
  return rolOficial ? [rolOficial] : []
}

export async function getUserByLoginIdentifier(identifier) {
  const trimmed = String(identifier || "").trim()

  if (!trimmed) return null

  return prisma.usuarioApp.findUnique({
    where: {
      usuario: trimmed,
    },
    include: {
      roles: true,
    },
  })
}

export async function createSession(userId) {
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000)

  await prisma.usuarioSesion.create({
    data: {
      usuarioId: userId,
      token,
      expiresAt,
    },
  })

  return token
}

export async function setSessionCookie(token) {
  const cookieStore = await cookies()

  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()

  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null

  const session = await prisma.usuarioSesion.findFirst({
    where: {
      token,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      usuario: {
        include: {
          roles: true,
        },
      },
    },
  })

  if (!session?.usuario || !session.usuario.activo) {
    return null
  }

  return {
    ...session.usuario,
    roles: getUserRoles(session.usuario),
  }
}
