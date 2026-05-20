const ROLE_ACCESS = {
  DATA_ENTRY: ["ADMINISTRADOR", "DATA_ENTRY"],
  CONFIGURACION: ["ADMINISTRADOR", "IT_TECNICO"],
  USUARIOS: ["ADMINISTRADOR", "IT_TECNICO"],
  APROBAR_PENDIENTES: ["PROVEEDORES_AUDITOR", "ADMINISTRADOR", "IT_TECNICO"],
}

const ROLES_LEGACY = {
  ADMIN: ["ADMINISTRADOR", "IT_TECNICO", "DATA_ENTRY"],
  PORTERIA: ["DATA_ENTRY"],
  PROVEEDORES: ["PROVEEDORES_AUDITOR"],
  SISTEMAS: ["IT_TECNICO"],
}

function normalizarRolPermiso(rol) {
  if (!rol) return []

  const clave = String(rol).toUpperCase()
  return ROLES_LEGACY[clave] || [clave]
}

function getUserRoles(usuario) {
  if (!usuario) return []
  if (Array.isArray(usuario.roles) && usuario.roles.length > 0) {
    return usuario.roles
      .map((item) => (typeof item === "string" ? item : item?.rol))
      .flatMap(normalizarRolPermiso)
      .filter(Boolean)
  }
  if (usuario.rol) {
    return normalizarRolPermiso(usuario.rol)
  }
  return []
}

export function canCreateIngreso(usuario) {
  const roles = getUserRoles(usuario)
  return roles.some((rol) => ROLE_ACCESS.DATA_ENTRY.includes(rol))
}

export function canAccessConfiguracion(usuario) {
  const roles = getUserRoles(usuario)
  return roles.some((rol) => ROLE_ACCESS.CONFIGURACION.includes(rol))
}

export function canManageUsuarios(usuario) {
  const roles = getUserRoles(usuario)
  return roles.some((rol) => ROLE_ACCESS.USUARIOS.includes(rol))
}

export function canApprovePendientes(usuario) {
  const roles = getUserRoles(usuario)
  return roles.some((rol) => ROLE_ACCESS.APROBAR_PENDIENTES.includes(rol))
}
