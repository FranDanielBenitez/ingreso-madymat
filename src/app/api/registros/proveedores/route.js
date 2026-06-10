import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function limpiar(value) {
  if (value === null || value === undefined) return ""

  return String(value).trim()
}

function proveedorDesdeIngreso(ingreso) {
  const codigo =
    limpiar(ingreso.proveedorCodigoValidado) ||
    limpiar(ingreso.proveedorCodigoBejerman)
  const nombre =
    limpiar(ingreso.proveedorNombreValidado) ||
    limpiar(ingreso.proveedorNombreCargado) ||
    "-"
  const label = codigo ? `${codigo} - ${nombre}` : nombre
  const value = codigo || nombre

  return {
    codigo: codigo || null,
    nombre,
    label,
    value,
  }
}

export async function GET() {
  try {
    const ingresos = await prisma.ingreso.findMany({
      select: {
        proveedorCodigoBejerman: true,
        proveedorCodigoValidado: true,
        proveedorNombreCargado: true,
        proveedorNombreValidado: true,
      },
      orderBy: {
        proveedorNombreCargado: "asc",
      },
    })

    const proveedoresMap = new Map()

    for (const ingreso of ingresos) {
      const proveedor = proveedorDesdeIngreso(ingreso)
      const key = proveedor.codigo
        ? `codigo:${proveedor.codigo}`
        : `nombre:${proveedor.nombre.toLowerCase()}`

      if (!proveedoresMap.has(key)) {
        proveedoresMap.set(key, proveedor)
      }
    }

    const data = [...proveedoresMap.values()].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
    )

    return NextResponse.json({
      ok: true,
      total: data.length,
      data,
    })
  } catch (error) {
    console.error("Error obteniendo proveedores de registros:", error)

    return NextResponse.json(
      {
        ok: false,
        message: "Error obteniendo proveedores de registros",
        error: error.message,
      },
      { status: 500 }
    )
  }
}
