import { NextResponse } from "next/server"
import { getCurrentUser, normalizeRol } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          message: "No autenticado",
        },
        { status: 401 }
      )
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        usuario: user.usuario,
        rol: user.rol,
        roles: user.roles || [normalizeRol(user.rol)].filter(Boolean),
        activo: user.activo,
      },
    })
  } catch (error) {
    console.error("Error obteniendo usuario actual:", error)
    return NextResponse.json(
      {
        ok: false,
        message: "Error obteniendo usuario actual",
      },
      { status: 500 }
    )
  }
}
