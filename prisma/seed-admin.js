const { PrismaClient } = require("@prisma/client")
const { randomBytes, scryptSync } = require("crypto")

const prisma = new PrismaClient()

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex")
  const derivedKey = scryptSync(String(password), salt, 64).toString("hex")
  return `${salt}:${derivedKey}`
}

function usuarioPortero(legajo) {
  return `portero${legajo}`
}

async function reemplazarRoles(usuarioId, roles) {
  await prisma.usuarioRol.deleteMany({
    where: {
      usuarioId,
    },
  })

  await prisma.usuarioRol.createMany({
    data: roles.map((rol) => ({
      usuarioId,
      rol,
    })),
    skipDuplicates: true,
  })
}

async function asegurarAdmin() {
  const adminUsuario = "admin"
  const adminEmail = "admin@ingreso-madymat.local"
  const adminPassword = "Admin1234!"

  const existente = await prisma.usuarioApp.findFirst({
    where: {
      OR: [{ usuario: adminUsuario }, { email: adminEmail }],
    },
  })

  const data = {
    nombre: "Administrador IT",
    email: adminEmail,
    usuario: adminUsuario,
    rol: "ADMIN",
    activo: true,
  }

  if (!existente || !existente.passwordHash) {
    data.passwordHash = hashPassword(adminPassword)
  }

  if (existente) {
    await prisma.usuarioApp.update({
      where: {
        id: existente.id,
      },
      data,
    })
    await reemplazarRoles(existente.id, [
      "ADMINISTRADOR",
      "IT_TECNICO",
      "DATA_ENTRY",
    ])
    console.log(`Administrador asegurado: ${adminUsuario}`)
    return
  }

  const admin = await prisma.usuarioApp.create({
    data: {
      ...data,
      passwordHash: hashPassword(adminPassword),
    },
  })
  await reemplazarRoles(admin.id, ["ADMINISTRADOR", "IT_TECNICO", "DATA_ENTRY"])

  console.log(`Administrador creado: ${adminUsuario}`)
}

async function prepararPorteros() {
  const porteros = await prisma.usuarioApp.findMany({
    where: {
      rol: "PORTERIA",
      legajoSjala: {
        not: null,
      },
      OR: [{ usuario: null }, { usuario: "" }],
    },
    orderBy: {
      id: "asc",
    },
  })

  let actualizados = 0

  for (const portero of porteros) {
    const usuario = usuarioPortero(portero.legajoSjala)
    const usuarioExistente = await prisma.usuarioApp.findFirst({
      where: {
        usuario,
        NOT: {
          id: portero.id,
        },
      },
    })

    if (usuarioExistente) {
      console.warn(
        `No se actualizo portero ${portero.id}: el usuario ${usuario} ya existe.`
      )
      continue
    }

    await prisma.usuarioApp.update({
      where: {
        id: portero.id,
      },
      data: {
        usuario,
      },
    })

    actualizados += 1
  }

  console.log(`Porteros preparados con usuario interno: ${actualizados}`)
}

async function main() {
  await asegurarAdmin()
  await prepararPorteros()
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
