import { getSqlServerPool } from "@/lib/sqlserver"

export async function getHachadoresRollizos() {
  const pool = await getSqlServerPool()

  const result = await pool.request().query(`
    SELECT
      pro_Cod AS Codigo,
      pro_RazSoc AS RazonSocial,
      pro_CUIT AS CUIT,
      prodp1_Cod AS Grupo,
      prodp2_Cod AS SubGrupo
    FROM SBDAALA.dbo.Proveed
    WHERE prodp1_Cod = 'ROLL'
      AND prodp2_Cod = 'HACH'
    ORDER BY pro_Cod
  `)

  return result.recordset
}
