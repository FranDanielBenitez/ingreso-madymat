Contexto del proyecto

Este proyecto es una aplicación interna para registrar ingresos de madera y materiales en portería.

El objetivo principal es digitalizar comprobantes que hoy se completan en papel, capturar datos operativos desde un formulario web y luego generar PDFs con formato compatible para ser procesados por FEX / Bejerman.

La aplicación será utilizada por sectores internos, principalmente:

Portería
Pago a proveedores
Sistemas / IT
Administración
Stack tecnológico

El proyecto utiliza:

Next.js con App Router
JavaScript
Prisma ORM
PostgreSQL Cloudclusters
Auth.js / NextAuth
Tailwind CSS
React Hook Form
Sonner
React Icons
n8n como orquestador de automatizaciones
Python para generación de PDF
SQL Server Bejerman como fuente de lectura
Base de datos principal

La base propia del proyecto es PostgreSQL Cloudclusters.

Datos de referencia:

Host: postgresql-145173-0.cloudclusters.net
Port: 16421
Database: ingreso_madymat
User: Franco
Password: no debe guardarse en este archivo

La contraseña debe ir únicamente en .env o .env.local.

Reglas importantes
No modificar tablas ni estructura de Bejerman.
SQL Server Bejerman se usa solo como fuente de lectura.
PostgreSQL ingreso_madymat es la base operativa propia del sistema.
No hardcodear credenciales.
Toda variable sensible debe ir en .env o .env.local.
No crear soluciones complejas si puede resolverse de forma simple.
Trabajar por bloques pequeños y verificables.
Cada cambio debe poder probarse antes de avanzar.
Mantener nombres claros en español cuando representen conceptos del negocio.
Mantener nombres técnicos consistentes en inglés o snake_case dentro de base de datos.
No conectar el frontend directamente a ninguna base de datos.
El frontend debe consumir APIs internas de Next.js.
No escribir datos en SQL Server Bejerman desde esta app.
No modificar prisma/schema.prisma sin autorización explícita.
No modificar migraciones existentes sin autorización explícita.
No instalar paquetes nuevos sin justificarlo.
No convertir archivos .js a .ts.
No crear soluciones con TypeScript.
No hardcodear datos si ya existe una API interna disponible.
Mantener cambios pequeños, revisables y orientados a una tarea concreta.
Arquitectura general

Flujo esperado:

Usuario inicia sesión en la app.
Portería carga ingreso desde formulario web.
La app obtiene dimensiones desde PostgreSQL y/o Bejerman.
El ingreso se guarda en PostgreSQL.
n8n recibe o consulta los datos del ingreso.
Python genera el PDF.
El PDF queda disponible para FEX / Bejerman.
Pago a proveedores valida y finaliza la carga.
Flujo de datos

La app trabaja con dos fuentes principales.

PostgreSQL Cloudclusters:

Es la base operativa propia del sistema.
Guarda ingresos, usuarios, estados, logs y trazabilidad.

SQL Server Bejerman / SJALA:

Es fuente de lectura.
Provee proveedores, artículos, fleteros, transportes, hachadores, choferes y porteros.

Bejerman sigue siendo la fuente oficial de datos maestros.

La app solo lee esos datos y guarda una foto del dato seleccionado al registrar un ingreso.

Conexión a Bejerman / SQL Server

La app no debe conectarse a SQL Server desde el frontend.

El acceso a Bejerman debe hacerse únicamente desde APIs internas de Next.js ubicadas en:

src/app/api/dimensiones/

El frontend debe consumir estas APIs con fetch.

Flujo correcto:

Frontend React → API interna Next.js → Servicio Bejerman → SQL Server → JSON para selectores

No exponer credenciales de SQL Server al navegador.

La conexión a SQL Server está centralizada en:

src/lib/sqlserver.js

Las consultas específicas deben organizarse en:

src/services/bejerman/

No modificar src/lib/sqlserver.js salvo autorización explícita.

Consideraciones de red

SQL Server Bejerman está dentro de la red interna de la empresa.

La app puede consultar Bejerman solamente si el backend de Next.js corre dentro de la red interna o mediante una conexión segura tipo VPN.

No exponer el puerto 1433 de SQL Server a internet.

Si la app se deploya en un servicio externo como Vercel, la conexión directa a Bejerman no funcionará porque 192.168.1.10 es una IP privada interna.

Para producción, la opción recomendada es alojar la app en un servidor interno de la empresa.

Flujo recomendado de producción interna:

PC Portería → Navegador → App Next.js en servidor interno → SQL Server Bejerman

Responsabilidades por componente
Next.js

Responsable de:

Interfaz de usuario
Login
Formularios
Validaciones
Registro de ingresos
APIs internas
Consulta de datos propios del sistema
Consulta controlada de dimensiones desde Bejerman
PostgreSQL

Responsable de:

Usuarios internos de la app
Dimensiones propias
Ingresos registrados
Estados del proceso
Trazabilidad
Logs
SQL Server Bejerman

Responsable de:

Proveedores oficiales
Artículos oficiales
Fleteros
Transportes
Hachadores
Datos maestros provenientes del ERP

No se debe escribir en SQL Server Bejerman desde esta app.

SJALA

Responsable de:

Choferes internos
Porteros / empleados de referencia
Datos de personal provenientes del sistema interno

SJALA se consulta como fuente de lectura.

n8n

Responsable de:

Orquestar procesos
Ejecutar automatizaciones
Conectar con Python
Mover/generar archivos
Coordinar pasos posteriores al registro
Python

Responsable de:

Generar PDF final
Aplicar formato de comprobante
Devolver ruta o estado de generación
Convenciones de carpetas

Usar esta estructura base:

src/

app/
page.js
layout.js
login/
dashboard/
ingresos/
api/
dimensiones/
components/
layout/
forms/
ui/
lib/
prisma.js
sqlserver.js
auth.js
validations/
actions/
services/
bejerman/
constants/
APIs internas disponibles
Proveedores

Endpoints:

GET /api/dimensiones/proveedores?categoria=ROLLIZOS
GET /api/dimensiones/proveedores?categoria=ESQUINEROS
GET /api/dimensiones/proveedores?categoria=MATERIA_PRIMA
GET /api/dimensiones/proveedores?modo=TODOS

Respuesta esperada:

ok
categoria
modo
total
data

Cada proveedor debe devolver:

Codigo
RazonSocial
CUIT
Grupo
SubGrupo
Artículos

Endpoints:

GET /api/dimensiones/articulos?categoria=ROLLIZOS
GET /api/dimensiones/articulos?categoria=PALLETS
GET /api/dimensiones/articulos?categoria=TABLAS_ASERRADAS
GET /api/dimensiones/articulos?categoria=TABLAS_CEPILLADAS
GET /api/dimensiones/articulos?categoria=TACOS
GET /api/dimensiones/articulos?categoria=TERCIADO
GET /api/dimensiones/articulos?categoria=ESQUINEROS
GET /api/dimensiones/articulos?categoria=FONDOS
GET /api/dimensiones/articulos?categoria=INTERIOR

Respuesta esperada:

ok
categoria
total
data

Cada artículo debe devolver:

ArticuloGen
Codigo
Clase
Descripcion
Proceso
Grupo
SubGrupo
Servicios logísticos

Endpoints:

GET /api/dimensiones/servicios-logisticos?categoria=ROLLIZOS
GET /api/dimensiones/servicios-logisticos?categoria=ESQUINEROS
GET /api/dimensiones/servicios-logisticos?tipo=TRANSPORTE

Respuesta esperada:

ok
categoria
tipo
total
data

Cada servicio logístico debe devolver:

Codigo
RazonSocial
CUIT
Grupo
SubGrupo
Hachadores

Endpoint:

GET /api/dimensiones/hachadores?categoria=ROLLIZOS

Respuesta esperada:

ok
categoria
total
data

Cada hachador debe devolver:

Codigo
RazonSocial
CUIT
Grupo
SubGrupo
Choferes

Endpoint:

GET /api/dimensiones/choferes

Respuesta esperada:

ok
total
data

Cada chofer debe devolver:

Legajo
NombreCompleto
Seccion
Porteros

Endpoint:

GET /api/dimensiones/porteros

Respuesta esperada:

ok
total
data

Cada portero debe devolver:

Legajo
NombreCompleto
Seccion
Servicios Bejerman existentes

Los servicios de consulta a Bejerman deben ubicarse en:

src/services/bejerman/

Servicios creados:

src/services/bejerman/proveedores.js
src/services/bejerman/articulos.js
src/services/bejerman/servicios-logisticos.js
src/services/bejerman/hachadores.js
src/services/bejerman/choferes.js
src/services/bejerman/porteros.js

Cada servicio debe contener consultas SQL específicas y devolver result.recordset.

Las APIs internas deben importar estos servicios y devolver JSON al frontend.

Reglas para frontend
Usar componentes simples y reutilizables.
Usar React Hook Form para formularios.
Usar Sonner para notificaciones.
Usar Tailwind CSS para estilos.
Mantener pantallas limpias, claras y usables para personal de portería.
Evitar exceso de diseño visual si afecta la velocidad de carga o la claridad.
Los selects deben alimentarse desde APIs internas.
Los formularios deben estar separados en secciones claras.
Los errores deben mostrarse con mensajes amigables.
Los botones principales deben ser visibles y claros.
Reglas para formularios de ingreso

El formulario de ingreso debe guardar en PostgreSQL una foto de los datos seleccionados desde Bejerman.

Si se selecciona un proveedor desde Bejerman, el ingreso debe guardar:

Código de proveedor
Razón social
CUIT
Grupo
Subgrupo
Origen del dato
Si fue carga manual o no
Si estaba fuera de la lista sugerida o no

Esto permite trazabilidad aunque luego cambie el dato maestro en Bejerman.

Reglas para carga manual

Si una entidad no existe en Bejerman, la app debe permitir carga manual para no frenar el ingreso.

Aplica principalmente a:

Proveedor
Fletero
Transporte
Hachador
Chofer externo

Cuando haya carga manual, el ingreso debe quedar marcado para validación posterior por Pago a Proveedores o Administración.

El PDF definitivo para FEX no debería generarse si hay datos manuales pendientes de validación.

Reglas para Rollizos

Para el primer frontend funcional se prioriza el formulario de Ingreso de Rollizos.

Campos principales:

Fecha de ingreso
Portero / usuario que registra
Proveedor
Remito proveedor
Artículo
Cantidad
Unidad
Tipo de servicio logístico
Fletero o transporte
Tipo de chofer
Chofer interno o externo
Patente camión
Patente acoplado
Hachador
Observaciones

Hachador aplica solo para Rollizos.

Reglas para Codex / asistentes de código
Leer este archivo antes de modificar el proyecto.
No modificar backend si la tarea solicitada es solo frontend.
No modificar frontend si la tarea solicitada es solo backend.
No modificar Prisma schema sin autorización explícita.
No modificar migraciones existentes.
No modificar conexión a PostgreSQL.
No modificar conexión a SQL Server.
No instalar paquetes nuevos sin justificarlo.
No convertir archivos .js a .ts.
No crear TypeScript.
No conectar componentes frontend directamente a bases de datos.
No hardcodear datos si existe una API interna disponible.
Mantener cambios pequeños y revisables.
Antes de crear una nueva API, revisar si ya existe en src/app/api.
Antes de crear un nuevo servicio Bejerman, revisar src/services/bejerman.
Usar nombres de archivos consistentes en minúscula cuando sea posible.
Evitar diferencias de mayúsculas/minúsculas en imports.
Si se crea una página nueva, indicar claramente la ruta.
Si se crea un componente nuevo, ubicarlo en src/components.
Si se crea lógica de negocio reusable, ubicarla en src/services, src/lib o src/actions según corresponda.
Estado actual del proyecto

Ya se validó:

Next.js funcionando localmente.
PostgreSQL Cloudclusters conectado.
Prisma migrado.
Seed inicial ejecutado.
SQL Server Bejerman conectado desde Next.js.
APIs internas de dimensiones funcionando.
Proveedores funcionando.
Artículos funcionando.
Servicios logísticos funcionando.
Hachadores funcionando.
Choferes funcionando.
Porteros funcionando.
Próximo objetivo

Construir el primer frontend funcional en:

src/app/ingresos/rollizos/page.js

Objetivo:

Validar visualmente el formulario.
Consumir APIs internas existentes.
Preparar el objeto de ingreso.
No guardar todavía en base de datos hasta validar pantalla y flujo.