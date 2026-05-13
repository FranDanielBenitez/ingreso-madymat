import { getSqlServerPool } from "@/lib/sqlserver"

export async function getArticulosRollizos() {
  const pool = await getSqlServerPool()

  const result = await pool.request().query(`
    SELECT
      art_Gen AS ArticuloGen,
      art_CodGen AS Codigo,
      artcla_Cod AS Clase,
      art_DescGen AS Descripcion,
      artpro_Cod AS Proceso,
      artda1_Cod AS Grupo,
      artda2_Cod AS SubGrupo
    FROM SBDAALA.dbo.Articulos
    WHERE artda1_Cod IN ('ROLL')
      AND art_CodGen LIKE 'ROLL%'
      AND art_CodGen <> 'ROLLIZOIVA'
    ORDER BY art_DescGen
  `)

  return result.recordset
}

export async function getArticulosPallets() {
  const pool = await getSqlServerPool()

  const result = await pool.request().query(`
    SELECT
      art_Gen AS ArticuloGen,
      art_CodGen AS Codigo,
      artcla_Cod AS Clase,
      art_DescGen AS Descripcion,
      artpro_Cod AS Proceso,
      artda1_Cod AS Grupo,
      artda2_Cod AS SubGrupo
    FROM SBDAALA.dbo.Articulos
    WHERE artda1_Cod IN ('MATE')
      AND artda2_Cod = 'INPA'
    ORDER BY art_DescGen
  `)

  return result.recordset
}

export async function getArticulosTablasAserradas() {
  const pool = await getSqlServerPool()

  const result = await pool.request().query(`
    SELECT
      art_Gen AS ArticuloGen,
      art_CodGen AS Codigo,
      artcla_Cod AS Clase,
      art_DescGen AS Descripcion,
      artpro_Cod AS Proceso,
      artda1_Cod AS Grupo,
      artda2_Cod AS SubGrupo
    FROM SBDAALA.dbo.Articulos
    WHERE artda1_Cod IN ('MATE')
      AND art_DescGen LIKE '%ASE%'
      AND artda2_Cod = 'MATA'
    ORDER BY art_DescGen
  `)

  return result.recordset
}

export async function getArticulosTablasCepilladas() {
  const pool = await getSqlServerPool()

  const result = await pool.request().query(`
    SELECT
      art_Gen AS ArticuloGen,
      art_CodGen AS Codigo,
      artcla_Cod AS Clase,
      art_DescGen AS Descripcion,
      artpro_Cod AS Proceso,
      artda1_Cod AS Grupo,
      artda2_Cod AS SubGrupo
    FROM SBDAALA.dbo.Articulos
    WHERE artda1_Cod IN ('MATE')
      AND art_DescGen LIKE '%MULT%'
      AND artda2_Cod = 'MATA'
    ORDER BY art_DescGen
  `)

  return result.recordset
}

export async function getArticulosTacos() {
  const pool = await getSqlServerPool()

  const result = await pool.request().query(`
    SELECT
      art_Gen AS ArticuloGen,
      art_CodGen AS Codigo,
      artcla_Cod AS Clase,
      art_DescGen AS Descripcion,
      artpro_Cod AS Proceso,
      artda1_Cod AS Grupo,
      artda2_Cod AS SubGrupo
    FROM SBDAALA.dbo.Articulos
    WHERE artda2_Cod IN ('MATC')
    ORDER BY art_DescGen
  `)

  return result.recordset
}

export async function getArticulosTerciado() {
  const pool = await getSqlServerPool()

  const result = await pool.request().query(`
    SELECT
      art_Gen AS ArticuloGen,
      art_CodGen AS Codigo,
      artcla_Cod AS Clase,
      art_DescGen AS Descripcion,
      artpro_Cod AS Proceso,
      artda1_Cod AS Grupo,
      artda2_Cod AS SubGrupo
    FROM SBDAALA.dbo.Articulos
    WHERE artda2_Cod IN ('TERC')
    ORDER BY art_DescGen
  `)

  return result.recordset
}

export async function getArticulosEsquineros() {
  const pool = await getSqlServerPool()

  const result = await pool.request().query(`
    SELECT
      art_Gen AS ArticuloGen,
      art_CodGen AS Codigo,
      artcla_Cod AS Clase,
      art_DescGen AS Descripcion,
      artpro_Cod AS Proceso,
      artda1_Cod AS Grupo,
      artda2_Cod AS SubGrupo
    FROM SBDAALA.dbo.Articulos
    WHERE artda1_Cod IN ('MATE')
      AND artda2_Cod = 'MAES'
    ORDER BY art_DescGen
  `)

  return result.recordset
}

export async function getArticulosFondos() {
  const pool = await getSqlServerPool()

  const result = await pool.request().query(`
    SELECT
      art_Gen AS ArticuloGen,
      art_CodGen AS Codigo,
      artcla_Cod AS Clase,
      art_DescGen AS Descripcion,
      artpro_Cod AS Proceso,
      artda1_Cod AS Grupo,
      artda2_Cod AS SubGrupo
    FROM SBDAALA.dbo.Articulos
    WHERE artda1_Cod IN ('MATE')
      AND artda2_Cod = 'MAFO'
    ORDER BY art_DescGen
  `)

  return result.recordset
}

export async function getArticulosInterior() {
  const pool = await getSqlServerPool()

  const result = await pool.request().query(`
    SELECT
      art_Gen AS ArticuloGen,
      art_CodGen AS Codigo,
      artcla_Cod AS Clase,
      art_DescGen AS Descripcion,
      artpro_Cod AS Proceso,
      artda1_Cod AS Grupo,
      artda2_Cod AS SubGrupo
    FROM SBDAALA.dbo.Articulos
    WHERE artda1_Cod IN ('MATE')
      AND artda2_Cod = 'MAIN'
    ORDER BY art_DescGen
  `)

  return result.recordset
}

export async function getArticulosTodos() {
  const pool = await getSqlServerPool()

  const result = await pool.request().query(`
    SELECT DISTINCT
      art_Gen AS ArticuloGen,
      art_CodGen AS Codigo,
      artcla_Cod AS Clase,
      art_DescGen AS Descripcion,
      artpro_Cod AS Proceso,
      artda1_Cod AS Grupo,
      artda2_Cod AS SubGrupo
    FROM SBDAALA.dbo.Articulos
    WHERE (
        (
          artda1_Cod IN ('ROLL')
          AND art_CodGen LIKE 'ROLL%'
          AND art_CodGen <> 'ROLLIZOIVA'
        )
        OR (
          artda1_Cod IN ('MATE')
          AND artda2_Cod IN ('INPA', 'MATA', 'MATC', 'TERC', 'MAES', 'MAFO', 'MAIN')
        )
      )
    ORDER BY Descripcion
  `)

  return result.recordset
}
