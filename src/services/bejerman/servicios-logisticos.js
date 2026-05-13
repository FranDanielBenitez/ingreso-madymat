import { getSqlServerPool } from "@/lib/sqlserver"

export async function getFleterosRollizos() {
  const pool = await getSqlServerPool()

  const result = await pool.request().query(`
    SELECT
      pro_Cod AS Codigo,
      pro_RazSoc AS RazonSocial,
      pro_CUIT AS CUIT,
      prodp1_Cod AS Grupo,
      prodp2_Cod AS SubGrupo
    FROM SBDAALA.dbo.Proveed
    WHERE prodp2_Cod = 'FLRO'
    ORDER BY pro_RazSoc
  `)

  return result.recordset
}

export async function getFleterosEsquineros() {
  const pool = await getSqlServerPool()

  const result = await pool.request().query(`
    SELECT
      pro_Cod AS Codigo,
      pro_RazSoc AS RazonSocial,
      pro_CUIT AS CUIT,
      prodp1_Cod AS Grupo,
      prodp2_Cod AS SubGrupo
    FROM SBDAALA.dbo.Proveed
    WHERE prodp2_Cod = 'FLES'
    ORDER BY pro_RazSoc
  `)

  return result.recordset
}

export async function getFleterosMateriales() {
  const pool = await getSqlServerPool()

  const result = await pool.request().query(`
    SELECT
      pro_Cod AS Codigo,
      pro_RazSoc AS RazonSocial,
      pro_CUIT AS CUIT,
      prodp1_Cod AS Grupo,
      prodp2_Cod AS SubGrupo
    FROM SBDAALA.dbo.Proveed
    WHERE prodp2_Cod = 'FLMA'
    ORDER BY pro_RazSoc
  `)

  return result.recordset
}

export async function getFleterosVarios() {
  const pool = await getSqlServerPool()

  const result = await pool.request().query(`
    SELECT
      pro_Cod AS Codigo,
      pro_RazSoc AS RazonSocial,
      pro_CUIT AS CUIT,
      prodp1_Cod AS Grupo,
      prodp2_Cod AS SubGrupo
    FROM SBDAALA.dbo.Proveed
    WHERE prodp2_Cod = 'FLVA'
    ORDER BY pro_RazSoc
  `)

  return result.recordset
}

export async function getTransportesVarios() {
  const pool = await getSqlServerPool()

  const result = await pool.request().query(`
    SELECT
      pro_Cod AS Codigo,
      pro_RazSoc AS RazonSocial,
      pro_CUIT AS CUIT,
      prodp1_Cod AS Grupo,
      prodp2_Cod AS SubGrupo
    FROM SBDAALA.dbo.Proveed
    WHERE prodp2_Cod = 'ENTR'
    ORDER BY pro_RazSoc
  `)

  return result.recordset
}

export async function getServiciosLogisticosTodos() {
  const pool = await getSqlServerPool()

  const result = await pool.request().query(`
    SELECT
      pro_Cod AS Codigo,
      pro_RazSoc AS RazonSocial,
      pro_CUIT AS CUIT,
      prodp1_Cod AS Grupo,
      prodp2_Cod AS SubGrupo
    FROM SBDAALA.dbo.Proveed
    WHERE prodp2_Cod IN ('FLRO', 'FLES', 'FLMA', 'FLVA', 'ENTR')
    ORDER BY pro_RazSoc
  `)

  return result.recordset
}
