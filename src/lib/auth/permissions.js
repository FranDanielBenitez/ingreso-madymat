const ROLE_ACCESS = {
  DATA_ENTRY: ["ADMINISTRADOR", "DATA_ENTRY"],
  CONFIGURACION: ["ADMINISTRADOR", "IT_TECNICO"],
  USUARIOS: ["ADMINISTRADOR", "IT_TECNICO"],
}

function getUserRoles(usuario) {
  if (!usuario) return []
  if (Array.isArray(usuario.roles) && usuario.roles.length > 0) {
    return usuario.roles
      .map((item) => (typeof item === "string" ? item : item?.rol))
      .filter(Boolean)
  }
  if (usuario.rol) {
    if (usuario.rol === "ADMIN") {
      return ["ADMINISTRADOR", "IT_TECNICO", "DATA_ENTRY"]
    }

    return [
      usuario.rol === "PORTERIA"
        ? "DATA_ENTRY"
        : usuario.rol === "PROVEEDORES"
          ? "PROVEEDORES_AUDITOR"
          : usuario.rol === "SISTEMAS"
            ? "IT_TECNICO"
            : usuario.rol,
    ]
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
