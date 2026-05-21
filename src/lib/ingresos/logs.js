export function nombreUsuarioLog(usuario) {
  return (
    usuario?.nombre ||
    usuario?.usuario ||
    usuario?.email ||
    "Usuario desconocido"
  )
}

export function crearDetalleLog(usuario, accion, detalle) {
  const usuarioTexto = nombreUsuarioLog(usuario)
  const accionTexto = String(accion || "realizo una accion").trim()
  const detalleTexto = String(detalle || "").trim()
  const detalleNormalizado = detalleTexto
    ? detalleTexto.replace(/^\.+\s*/, "")
    : ""

  return `Usuario ${usuarioTexto} ${accionTexto}.${
    detalleNormalizado ? ` ${detalleNormalizado}` : ""
  }`
}
