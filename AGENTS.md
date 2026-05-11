# AGENTS.md — Proyecto Ingreso Madymat

## Contexto del proyecto

Este proyecto es una aplicación interna para registrar ingresos de madera y materiales en portería.

El objetivo principal es digitalizar comprobantes que hoy se completan en papel, capturar datos operativos desde un formulario web y luego generar PDFs con formato compatible para ser procesados por FEX / Bejerman.

La aplicación será utilizada por sectores internos, principalmente:
- Portería
- Pago a proveedores
- Sistemas / IT
- Administración

## Stack tecnológico

El proyecto utiliza:

- Next.js con App Router
- JavaScript
- Prisma ORM
- PostgreSQL Cloudclusters
- Auth.js / NextAuth
- Tailwind CSS
- React Hook Form
- Sonner
- React Icons
- n8n como orquestador de automatizaciones
- Python para generación de PDF
- SQL Server Bejerman como fuente de lectura

## Base de datos principal

La base propia del proyecto es PostgreSQL Cloudclusters.

Datos de referencia:

- Host: postgresql-145173-0.cloudclusters.net
- Port: 16421
- Database: ingreso_madymat
- User: Franco
- Password: no debe guardarse en este archivo

La contraseña debe ir únicamente en `.env`.

## Reglas importantes

1. No modificar tablas ni estructura de Bejerman.
2. SQL Server Bejerman se usa solo como fuente de lectura.
3. PostgreSQL `ingreso_madymat` es la base operativa propia del sistema.
4. No hardcodear credenciales.
5. Toda variable sensible debe ir en `.env`.
6. No crear soluciones complejas si puede resolverse de forma simple.
7. Trabajar por bloques pequeños y verificables.
8. Cada cambio debe poder probarse antes de avanzar.
9. Mantener nombres claros en español cuando representen conceptos del negocio.
10. Mantener nombres técnicos consistentes en inglés o snake_case dentro de base de datos.

## Arquitectura general

Flujo esperado:

1. Usuario inicia sesión en la app.
2. Portería carga ingreso desde formulario web.
3. La app obtiene dimensiones desde PostgreSQL y/o Bejerman.
4. El ingreso se guarda en PostgreSQL.
5. n8n recibe o consulta los datos del ingreso.
6. Python genera el PDF.
7. El PDF queda disponible para FEX / Bejerman.
8. Pago a proveedores valida y finaliza la carga.

## Responsabilidades por componente

### Next.js

Responsable de:
- Interfaz de usuario
- Login
- Formularios
- Validaciones
- Registro de ingresos
- Consulta de datos propios del sistema

### PostgreSQL

Responsable de:
- Usuarios internos de la app
- Dimensiones propias
- Ingresos registrados
- Estados del proceso
- Trazabilidad
- Logs

### SQL Server Bejerman

Responsable de:
- Proveedores oficiales
- Datos maestros provenientes del ERP
- Lectura de datos existentes

No se debe escribir en SQL Server Bejerman desde esta app.

### n8n

Responsable de:
- Orquestar procesos
- Ejecutar automatizaciones
- Conectar con Python
- Mover/generar archivos
- Coordinar pasos posteriores al registro

### Python

Responsable de:
- Generar PDF final
- Aplicar formato de comprobante
- Devolver ruta o estado de generación

## Convenciones de carpetas

Usar esta estructura base:

```txt
src/
├─ app/
│  ├─ page.js
│  ├─ layout.js
│  ├─ login/
│  ├─ dashboard/
│  └─ ingresos/
├─ components/
│  ├─ layout/
│  ├─ forms/
│  └─ ui/
├─ lib/
│  ├─ prisma.js
│  ├─ auth.js
│  └─ validations/
├─ actions/
├─ services/
└─ constants/