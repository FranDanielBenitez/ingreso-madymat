Estoy trabajando en una app llamada Ingreso Madymat.

Tarea: crear el primer frontend funcional para registrar un Ingreso de Rollizos.

Antes de modificar el proyecto, leer AGENTS.md.

Stack del proyecto:
- Next.js con App Router.
- JavaScript, no TypeScript.
- Tailwind CSS.
- React Hook Form.
- Sonner.
- React Icons.
- APIs internas de Next.js para consultar dimensiones.
- Prisma y PostgreSQL ya existen, pero no deben modificarse en esta tarea.
- SQL Server Bejerman ya está conectado mediante APIs internas, pero no debe tocarse en esta tarea.

Reglas para esta tarea:
- No modificar prisma/schema.prisma.
- No modificar migraciones.
- No modificar src/lib/sqlserver.js.
- No modificar src/lib/prisma.js.
- No modificar APIs existentes.
- No crear TypeScript.
- No instalar paquetes nuevos.
- No conectar frontend directamente a bases de datos.
- No crear API de guardado todavía.
- Trabajar solo sobre frontend y componentes reutilizables.
- Usar fetch contra las APIs internas existentes.
- Mantener diseño simple, claro y usable para portería.

APIs internas disponibles:

Proveedores:
GET /api/dimensiones/proveedores?categoria=ROLLIZOS

Artículos:
GET /api/dimensiones/articulos?categoria=ROLLIZOS

Servicios logísticos:
GET /api/dimensiones/servicios-logisticos?categoria=ROLLIZOS
GET /api/dimensiones/servicios-logisticos?tipo=TRANSPORTE

Hachadores:
GET /api/dimensiones/hachadores?categoria=ROLLIZOS

Choferes:
GET /api/dimensiones/choferes

Porteros:
GET /api/dimensiones/porteros

Crear la página:

src/app/ingresos/rollizos/page.js

La pantalla debe tener título:

Ingreso de Rollizos

Campos del formulario:

1. Fecha de ingreso.
2. Portero / usuario que registra.
3. Proveedor.
4. Remito proveedor.
5. Artículo.
6. Cantidad.
7. Unidad.
8. Tipo de servicio logístico: Fletero o Transporte.
9. Servicio logístico:
   - Si tipo = Fletero, usar /api/dimensiones/servicios-logisticos?categoria=ROLLIZOS.
   - Si tipo = Transporte, usar /api/dimensiones/servicios-logisticos?tipo=TRANSPORTE.
10. Tipo de chofer: Interno o Externo.
11. Si chofer interno, mostrar select desde /api/dimensiones/choferes.
12. Si chofer externo, mostrar input Nombre chofer y Documento chofer.
13. Patente camión.
14. Patente acoplado.
15. Hachador.
16. Observaciones.

Comportamiento esperado:

- Al cargar la página, consumir:
  - proveedores rollizos
  - artículos rollizos
  - hachadores rollizos
  - choferes
  - porteros
  - servicios logísticos rollizos
- Mostrar estado de loading mientras carga.
- Mostrar error amigable si alguna API falla.
- Usar react-hook-form.
- Usar Sonner para notificaciones.
- Al presionar Guardar, por ahora NO guardar en base de datos.
- Al presionar Guardar, armar un objeto final del ingreso y mostrarlo por console.log.
- Mostrar toast: "Ingreso preparado correctamente".
- El objeto final debe incluir:
  - valores simples del formulario
  - proveedorSeleccionado completo
  - articuloSeleccionado completo
  - servicioSeleccionado completo
  - hachadorSeleccionado completo
  - choferSeleccionado completo si es interno
  - porteroSeleccionado completo
- Agregar botón Limpiar formulario.
- El formulario debe dividirse en secciones visuales claras.
- El diseño debe ser profesional, limpio y práctico para portería.
- Los inputs y selects deben ser cómodos de usar.
- No guardar todavía en PostgreSQL.
- No generar PDF todavía.

Componentes sugeridos si ayudan:

src/components/forms/FormSection.js
src/components/forms/InputField.js
src/components/forms/SelectField.js

Al finalizar, indicar:
- Archivos creados.
- Archivos modificados.
- Ruta para probar: /ingresos/rollizos.