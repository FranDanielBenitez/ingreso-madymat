const { PrismaClient } = require("@prisma/client")
const { randomBytes, scryptSync } = require("crypto")

const prisma = new PrismaClient()

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex")
  const derivedKey = scryptSync(String(password), salt, 64).toString("hex")
  return `${salt}:${derivedKey}`
}

async function main() {
  const tiposIngreso = [
    {
      codigo: "ROLLIZOS",
      nombre: "Rollizos",
      descripcion: "Ingreso de rollizos de madera",
    },
    {
      codigo: "MATERIALES",
      nombre: "Materiales",
      descripcion: "Ingreso de materiales varios",
    },
  ]

  const categoriasFormulario = [
    {
      codigo: "ROLLIZOS",
      nombre: "Rollizos",
      descripcion: "Artículos de rollizos",
    },
    {
      codigo: "PALLETS",
      nombre: "Pallets",
      descripcion: "Artículos relacionados con pallets",
    },
    {
      codigo: "TABLAS_ASERRADAS",
      nombre: "Tablas aserradas",
      descripcion: "Tablas aserradas",
    },
    {
      codigo: "TABLAS_CEPILLADAS",
      nombre: "Tablas cepilladas",
      descripcion: "Tablas cepilladas / múltiples",
    },
    {
      codigo: "TACOS",
      nombre: "Tacos",
      descripcion: "Tacos",
    },
    {
      codigo: "TERCIADO",
      nombre: "Terciado",
      descripcion: "Terciado",
    },
    {
      codigo: "ESQUINEROS",
      nombre: "Esquineros",
      descripcion: "Esquineros",
    },
    {
      codigo: "FONDOS",
      nombre: "Fondos",
      descripcion: "Fondos",
    },
    {
      codigo: "INTERIOR",
      nombre: "Interior",
      descripcion: "Interiores",
    },
  ]

  const procedencias = ["Mendoza", "San Juan", "Río Negro"]

  for (const tipo of tiposIngreso) {
    await prisma.tipoIngreso.upsert({
      where: { codigo: tipo.codigo },
      update: tipo,
      create: tipo,
    })
  }

  for (const categoria of categoriasFormulario) {
    await prisma.categoriaFormulario.upsert({
      where: { codigo: categoria.codigo },
      update: categoria,
      create: categoria,
    })
  }

  for (const nombre of procedencias) {
    if (nombre === "Río Negro") {
      const sinAcento = await prisma.procedenciaDim.findUnique({
        where: { nombre: "Rio Negro" },
      })
      const conAcento = await prisma.procedenciaDim.findUnique({
        where: { nombre },
      })

      if (sinAcento && !conAcento) {
        await prisma.procedenciaDim.update({
          where: { id: sinAcento.id },
          data: {
            nombre,
            activa: true,
          },
        })
      }
    }

    await prisma.procedenciaDim.upsert({
      where: { nombre },
      update: {
        activa: true,
      },
      create: {
        nombre,
        activa: true,
      },
    })
  }

  const adminEmail = process.env.ADMIN_EMAIL || "admin@ingreso-madymat.local"
  const adminUsuario = process.env.ADMIN_USER || "admin"
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!"

  await prisma.usuarioApp.upsert({
    where: { email: adminEmail },
    update: {
      nombre: "Administrador",
      usuario: adminUsuario,
      passwordHash: hashPassword(adminPassword),
      rol: "ADMIN",
      activo: true,
    },
    create: {
      nombre: "Administrador",
      email: adminEmail,
      usuario: adminUsuario,
      passwordHash: hashPassword(adminPassword),
      rol: "ADMIN",
      activo: true,
    },
  })

  console.log("Seed ejecutado correctamente.")
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
