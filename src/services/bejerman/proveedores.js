import { getSqlServerPool } from "@/lib/sqlserver"

export async function getProveedoresTodos() {
  const pool = await getSqlServerPool()

  const result = await pool.request().query(`
    SELECT
      pro_Cod AS Codigo,
      pro_RazSoc AS RazonSocial,
      pro_CUIT AS CUIT,
      prodp1_Cod AS Grupo,
      prodp2_Cod AS SubGrupo
    FROM SBDAALA.dbo.Proveed
    WHERE prodp2_Cod NOT IN ('ADCO','AFIP','ATM','BANC','FINA','MOBR','OTAS','SIND','TARJ')
    ORDER BY pro_RazSoc
  `)

  return result.recordset
}

export async function getProveedoresRollizos() {
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
      AND prodp2_Cod = 'MADE'
    ORDER BY pro_Cod
  `)

  return result.recordset
}

export async function getProveedoresEsquineros() {
  const pool = await getSqlServerPool()

  const result = await pool.request().query(`
    SELECT
      pro_Cod AS Codigo,
      pro_RazSoc AS RazonSocial,
      pro_CUIT AS CUIT,
      prodp1_Cod AS Grupo,
      prodp2_Cod AS SubGrupo
    FROM SBDAALA.dbo.Proveed
    WHERE prodp1_Cod = 'MATE'
      AND prodp2_Cod = 'ESQU'
    ORDER BY pro_RazSoc
  `)

  return result.recordset
}

export async function getProveedoresMateriaPrima() {
  const pool = await getSqlServerPool()

  const result = await pool.request().query(`
    SELECT
      pro_Cod AS Codigo,
      pro_RazSoc AS RazonSocial,
      pro_CUIT AS CUIT,
      prodp1_Cod AS Grupo,
      prodp2_Cod AS SubGrupo
    FROM SBDAALA.dbo.Proveed
    WHERE prodp1_Cod = 'MATE'
      AND prodp2_Cod = 'MPRI'
    ORDER BY pro_RazSoc
  `)

  return result.recordset
}