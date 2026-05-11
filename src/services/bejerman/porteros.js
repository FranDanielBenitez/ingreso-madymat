import { getSqlServerPool } from "@/lib/sqlserver"

export async function getPorterosSjala() {
  const pool = await getSqlServerPool()

  const result = await pool.request().query(`
    SELECT
      LE.leg_numero AS Legajo,
      LE.leg_nombre + ' ' + LE.leg_apellido AS NombreCompleto,
      S.sec_descrip AS Seccion
    FROM SJALA.dbo.leg LE
    INNER JOIN SJALA.dbo.sec S
      ON LE.sec_codigo = S.sec_codigo
    WHERE UPPER(S.sec_descrip) LIKE '%PORT%'
      AND LE.leg_fecegr IS NULL
    ORDER BY
      LE.leg_apellido,
      LE.leg_nombre
  `)

  return result.recordset
}