import { NextResponse } from "next/server"
import {
  getUserByLoginIdentifier,
  verifyPassword,
  createSession,
  setSessionCookie,
  getUserRoles,
} from "@/lib/auth"

export async function POST(request) {
  try {
    const body = await request.json()
    const identifier = String(body?.usuario || body?.identifier || "").trim()
    const password = String(body?.password || "")

    if (!identifier || !password) {
      return NextResponse.json(
        {
          ok: false,
          message: "Usuario y contraseña son obligatorios",
        },
        { status: 400 }
      )
    }

    const user = await getUserByLoginIdentifier(identifier)

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          message: "Usuario o contraseña incorrectos",
        },
        { status: 401 }
      )
    }

    if (!user.activo) {
      return NextResponse.json(
        {
          ok: false,
          message: "Usuario inactivo. Contacte a IT para reactivar su cuenta.",
        },
        { status: 403 }
      )
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        {
          ok: false,
          message: "El usuario no tiene contrasena configurada. Contacte a IT.",
        },
        { status: 403 }
      )
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Usuario o contraseña incorrectos",
        },
        { status: 401 }
      )
    }

    const token = await createSession(user.id)
    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        usuario: user.usuario,
        rol: user.rol,
        roles: getUserRoles(user),
        activo: user.activo,
      },
    })

    await setSessionCookie(token)
    return response
  } catch (error) {
    console.error("Error iniciando sesion:", error)
    return NextResponse.json(
      {
        ok: false,
        message: "Error procesando inicio de sesión",
      },
      { status: 500 }
    )
  }
}

