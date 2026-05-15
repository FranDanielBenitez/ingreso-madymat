import { NextResponse } from "next/server"
import { prisma } from "./src/lib/prisma"

const AUTH_COOKIE_NAME = "ingreso_madymat_session"
const PUBLIC_FILE = /\.(.*)$/

export async function middleware(request) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next()
  }

  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    return NextResponse.next()
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  try {
    const session = await prisma.usuarioSesion.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        usuario: true,
      },
    })

    if (!session?.usuario?.activo) {
      const response = NextResponse.redirect(new URL("/login", request.url))
      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: "",
        path: "/",
        maxAge: 0,
      })
      return response
    }

    if (
      pathname.startsWith("/configuracion") &&
      !["ADMIN", "SISTEMAS"].includes(session.usuario.rol)
    ) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Middleware error verificando sesión:", error)
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

export const config = {
  matcher: ["/((?!api/auth|_next|static|favicon.ico).*)"],
}
