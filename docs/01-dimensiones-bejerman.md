# Dimensiones Bejerman — Ingreso Madymat

## Objetivo

Este documento define qué datos del formulario vienen desde Bejerman/SJALA y cómo se utilizarán dentro de la app Ingreso Madymat.

Las dimensiones de Bejerman no se copiarán inicialmente como tablas maestras completas en PostgreSQL. Se consultarán desde SQL Server y, al registrar un ingreso, la app guardará una foto del dato seleccionado.

## Criterio general

Para algunos selectores, el sistema mostrará primero una lista sugerida según el tipo de ingreso.

Ejemplo:

- Si el ingreso es Rollizos, se mostrarán primero proveedores de Rollizos.
- Si el ingreso es Esquineros, se mostrarán primero proveedores de Esquineros.

Pero el usuario podrá ampliar la búsqueda a todos los registros válidos cuando sea necesario.

## Categoría formulario

La "categoría formulario" es una etiqueta interna de la app.

Sirve para agrupar consultas de Bejerman y saber qué lista mostrar en cada selector.

Ejemplo:

- ROLLIZOS
- ESQUINEROS
- TERCIADO
- PALLETS
- TACOS
- FONDOS
- INTERIOR

Esta categoría no viene necesariamente de Bejerman. La usamos nosotros para ordenar el comportamiento del formulario.

# 1. Artículos

Los artículos vienen desde la tabla [SBDAALA].[dbo].[Articulos].

Columnas base utilizadas:

- art_Gen
- art_CodGen
- artcla_Cod
- art_DescGen
- artpro_Cod
- artda1_Cod
- artda2_Cod

Estas consultas se usarán para alimentar el selector de artículos/materiales del formulario.

## 1.1 Rollizos

Categoría formulario: ROLLIZOS

Consulta:

SELECT [art_Gen],
       [art_CodGen],
       [artcla_Cod],
       [art_DescGen],
       [artpro_Cod],
       [artda1_Cod],
       [artda2_Cod]
FROM [SBDAALA].[dbo].[Articulos]
WHERE [artda1_Cod] IN ('ROLL')
  AND art_CodGen LIKE 'ROLL%'
  AND art_CodGen <> 'ROLLIZOIVA'
ORDER BY [art_DescGen]

Uso:

Se utiliza cuando el ingreso corresponde a rollizos.
---

## 1.2 Pallets

Categoría formulario: PALLETS

Consulta:

SELECT [art_Gen],
       [art_CodGen],
       [artcla_Cod],
       [art_DescGen],
       [artpro_Cod],
       [artda1_Cod],
       [artda2_Cod]
FROM [SBDAALA].[dbo].[Articulos]
WHERE [artda1_Cod] IN ('MATE')
  AND artda2_Cod = 'INPA'
ORDER BY art_DescGen

Uso:

Se utiliza cuando el ingreso corresponde a pallets.


---

## 1.3 Tablas aserradas

Categoría formulario: TABLAS_ASERRADAS

Consulta:

SELECT [art_Gen],
       [art_CodGen],
       [artcla_Cod],
       [art_DescGen],
       [artpro_Cod],
       [artda1_Cod],
       [artda2_Cod]
FROM [SBDAALA].[dbo].[Articulos]
WHERE [artda1_Cod] IN ('MATE')
  AND art_DescGen LIKE '%ASE%'
  AND artda2_Cod = 'MATA'
ORDER BY art_DescGen

Uso:

Se utiliza cuando el ingreso corresponde a tablas aserradas.

---

## 1.4 Tablas cepilladas

Categoría formulario: TABLAS_CEPILLADAS

Consulta:

SELECT [art_Gen],
       [art_CodGen],
       [artcla_Cod],
       [art_DescGen],
       [artpro_Cod],
       [artda1_Cod],
       [artda2_Cod]
FROM [SBDAALA].[dbo].[Articulos]
WHERE [artda1_Cod] IN ('MATE')
  AND art_DescGen LIKE '%MULT%'
  AND artda2_Cod = 'MATA'
ORDER BY art_DescGen

Uso:

Se utiliza cuando el ingreso corresponde a tablas cepilladas / múltiples.

# 1.5 Tacos

Categoría formulario:

Consulta: 

SELECT [art_Gen],
       [art_CodGen],
       [artcla_Cod],
       [art_DescGen],
       [artpro_Cod],
       [artda1_Cod],
       [artda2_Cod]
FROM [SBDAALA].[dbo].[Articulos]
WHERE [artda2_Cod] IN ('MATC')

Uso: 
Se utiliza cuando el ingreso corresponde a tacos.

# 1.6 Terciado

Categoría formulario: Terciado

Consulta: 

SELECT [art_Gen],
       [art_CodGen],
       [artcla_Cod],
       [art_DescGen],
       [artpro_Cod],
       [artda1_Cod],
       [artda2_Cod]
FROM [SBDAALA].[dbo].[Articulos]
WHERE [artda2_Cod] IN ('TERC')

Uso: 
Se utiliza cuando el ingreso corresponde a terciado.

# 1.7 Esquineros

Categoría formulario: ESQUINEROS

Consulta: 

SELECT [art_Gen],
       [art_CodGen],
       [artcla_Cod],
       [art_DescGen],
       [artpro_Cod],
       [artda1_Cod],
       [artda2_Cod]
FROM [SBDAALA].[dbo].[Articulos]
WHERE [artda1_Cod] IN ('MATE')
  AND artda2_Cod = 'MAES'
ORDER BY art_DescGen

Uso: 
Se utiliza cuando el ingreso corresponde a esquineros.

# 1.8 Fondos

Categoría formulario: FONDOS

Consulta: 

SELECT [art_Gen],
       [art_CodGen],
       [artcla_Cod],
       [art_DescGen],
       [artpro_Cod],
       [artda1_Cod],
       [artda2_Cod]
FROM [SBDAALA].[dbo].[Articulos]
WHERE [artda1_Cod] IN ('MATE')
  AND artda2_Cod = 'MAFO'
ORDER BY art_DescGen

Uso: 
Se utiliza cuando el ingreso corresponde a fondos.

# 1.9 Interior

Categoría formulario: INTERIOR

Consulta: 

SELECT [art_Gen],
       [art_CodGen],
       [artcla_Cod],
       [art_DescGen],
       [artpro_Cod],
       [artda1_Cod],
       [artda2_Cod]
FROM [SBDAALA].[dbo].[Articulos]
WHERE [artda1_Cod] IN ('MATE')
  AND artda2_Cod = 'MAIN'
ORDER BY art_DescGen

Uso: 
Se utiliza cuando el ingreso corresponde a interior.

