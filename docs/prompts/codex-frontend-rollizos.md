Estoy trabajando en una app llamada Ingreso Madymat.

Stack:
- Next.js con App Router
- JavaScript, no TypeScript
- Tailwind CSS
- React Hook Form
- Sonner para notificaciones
- React Icons
- Prisma ORM con PostgreSQL
- SQL Server Bejerman solo se consulta mediante APIs internas de Next.js

Reglas importantes:
- No modificar Prisma schema.
- No modificar conexión a SQL Server.
- No modificar las APIs existentes.
- No crear TypeScript.
- No instalar paquetes nuevos salvo que sea estrictamente necesario.
- Trabajar solo sobre frontend y, si hace falta, crear componentes reutilizables.
- Mantener diseño simple, limpio, profesional y usable para portería.
- Usar JavaScript.
- Usar fetch contra las APIs internas ya existentes.
- No conectar el frontend directamente a SQL Server.
- No inventar datos hardcodeados si existen APIs.

APIs internas disponibles:

1) Proveedores:
GET /api/dimensiones/proveedores?categoria=ROLLIZOS
GET /api/dimensiones/proveedores?categoria=ESQUINEROS
GET /api/dimensiones/proveedores?categoria=MATERIA_PRIMA
GET /api/dimensiones/proveedores?modo=TODOS

Respuesta:
{
  ok: true,
  categoria,
  modo,
  total,
  data: [
    {
      Codigo,
      RazonSocial,
      CUIT,
      Grupo,
      SubGrupo
    }
  ]
}

2) Artículos:
GET /api/dimensiones/articulos?categoria=ROLLIZOS
GET /api/dimensiones/articulos?categoria=PALLETS
GET /api/dimensiones/articulos?categoria=TABLAS_ASERRADAS
GET /api/dimensiones/articulos?categoria=TABLAS_CEPILLADAS
GET /api/dimensiones/articulos?categoria=TACOS
GET /api/dimensiones/articulos?categoria=TERCIADO
GET /api/dimensiones/articulos?categoria=ESQUINEROS
GET /api/dimensiones/articulos?categoria=FONDOS
GET /api/dimensiones/articulos?categoria=INTERIOR

Respuesta:
{
  ok: true,
  categoria,
  total,
  data: [
    {
      ArticuloGen,
      Codigo,
      Clase,
      Descripcion,
      Proceso,
      Grupo,
      SubGrupo
    }
  ]
}

3) Servicios logísticos:
GET /api/dimensiones/servicios-logisticos?categoria=ROLLIZOS
GET /api/dimensiones/servicios-logisticos?categoria=ESQUINEROS
GET /api/dimensiones/servicios-logisticos?tipo=TRANSPORTE

Respuesta:
{
  ok: true,
  categoria,
  tipo,
  total,
  data: [
    {
      Codigo,
      RazonSocial,
      CUIT,
      Grupo,
      SubGrupo
    }
  ]
}

4) Hachadores:
GET /api/dimensiones/hachadores?categoria=ROLLIZOS

Respuesta:
{
  ok: true,
  categoria,
  total,
  data: [
    {
      Codigo,
      RazonSocial,
      CUIT,
      Grupo,
      SubGrupo
    }
  ]
}

5) Choferes:
GET /api/dimensiones/choferes

Respuesta:
{
  ok: true,
  total,
  data: [
    {
      Legajo,
      NombreCompleto,
      Seccion
    }
  ]
}

6) Porteros:
GET /api/dimensiones/porteros

Respuesta:
{
  ok: true,
  total,
  data: [
    {
      Legajo,
      NombreCompleto,
      Seccion
    }
  ]
}

Necesito crear el primer frontend funcional para registrar un Ingreso de Rollizos.

Crear una página en:
src/app/ingresos/rollizos/page.js

La pantalla debe tener:
- Título: "Ingreso de Rollizos"
- Formulario ordenado en secciones
- Fecha de ingreso
- Portero / usuario que registra
- Proveedor
- Remito proveedor
- Artículo
- Cantidad
- Unidad sugerida según Clase del artículo, pero por ahora puede mostrarse como campo editable
- Tipo de servicio logístico: Fletero o Transporte
- Servicio logístico:
  - Si tipo = Fletero, consumir /api/dimensiones/servicios-logisticos?categoria=ROLLIZOS
  - Si tipo = Transporte, consumir /api/dimensiones/servicios-logisticos?tipo=TRANSPORTE
- Tipo de chofer: Interno o Externo
- Si chofer interno, mostrar select desde /api/dimensiones/choferes
- Si chofer externo, mostrar input Nombre chofer y Documento chofer
- Patente camión
- Patente acoplado
- Hachador desde /api/dimensiones/hachadores?categoria=ROLLIZOS
- Observaciones

Comportamiento:
- Al cargar la página, traer proveedores rollizos, artículos rollizos, hachadores, choferes y porteros.
- Mostrar loading mientras carga.
- Mostrar error amigable si alguna API falla.
- Usar react-hook-form para manejar el formulario.
- Al presionar Guardar, por ahora NO guardar en base de datos.
- En su lugar, mostrar por consola el objeto final del formulario y mostrar toast de Sonner: "Ingreso preparado correctamente".
- El objeto final debe incluir tanto los IDs/códigos seleccionados como el objeto completo seleccionado cuando sea útil, por ejemplo proveedorSeleccionado, articuloSeleccionado, servicioSeleccionado, hachadorSeleccionado.
- Agregar botón Limpiar formulario.
- El diseño debe ser claro, con cards/secciones, inputs grandes y fácil de usar para una persona de portería.

Crear componentes si ayuda, por ejemplo:
src/components/forms/FormSection.js
src/components/forms/SelectField.js
src/components/forms/InputField.js

No modificar backend todavía.
No crear API de guardado todavía.
Primero quiero validar visualmente y funcionalmente el formulario.