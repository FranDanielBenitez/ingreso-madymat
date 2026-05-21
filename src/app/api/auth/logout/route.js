import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

const SESSION_COOKIE_NAME = "ingreso_madymat_session"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

    if (token) {
      await prisma.usuarioSesion.deleteMany({
        where: { token },
      })
    }

    const response = NextResponse.json({ ok: true })

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.COOKIE_SECURE === "true",
    })

    return response
  } catch (error) {
    console.error("Error cerrando sesion:", error)
    return NextResponse.json(
      {
        ok: false,
        message: "Error cerrando sesión",
      },
      { status: 500 }
    )
  }
}
