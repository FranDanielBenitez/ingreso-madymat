import { NextResponse } from "next/server"
import { getSqlServerPool } from "@/lib/sqlserver"

export async function GET() {
  try {
    const pool = await getSqlServerPool()

    const result = await pool.request().query(`
      SELECT TOP 10
        pro_Cod AS Codigo,
        pro_RazSoc AS RazonSocial,
        pro_CUIT AS CUIT,
        prodp1_Cod AS Grupo,
        prodp2_Cod AS SubGrupo
      FROM SBDAALA.dbo.Proveed
      ORDER BY pro_RazSoc
    `)

    return NextResponse.json({
      ok: true,
      data: result.recordset,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Error conectando a SQL Server",
        error: error.message,
      },
      { status: 500 }
    )
  }
}