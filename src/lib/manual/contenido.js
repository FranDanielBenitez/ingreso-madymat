export const manualMeta = {
  categoria: "AYUDA",
  titulo: "Manual de uso",
  tituloPdf: "Manual de uso - Madymat",
  subtituloPdf: "Registración de Ingresos a Fábrica",
  descripcion:
    "Guía rápida para registrar ingresos, validar datos pendientes y generar documentación administrativa.",
}

export const enlacesRapidosManual = [
  { href: "/ingresos/rollizos", label: "Ir a Rollizos" },
  { href: "/ingresos/materiales", label: "Ir a Materiales" },
  { href: "/registros", label: "Ir a Registros" },
  { href: "/registros/pendientes-validacion", label: "Ir a Pendientes" },
]

export const perfilesManual = [
  {
    id: "general",
    tab: "General",
    titulo: "Manual General",
    descripcion:
      "Resumen del circuito de ingresos, acceso, estados y documentación dentro de la app.",
    secciones: [
      {
        titulo: "Objetivo de la app",
        texto:
          "Ingreso Madymat permite registrar, controlar y auditar los ingresos de Rollizos y Materiales a fábrica. Centraliza la información cargada por Portería, permite adjuntar fotos, consultar registros, validar datos pendientes y generar la documentación necesaria para el circuito administrativo.",
      },
      {
        titulo: "Acceso a la aplicación",
        texto:
          "Para ingresar a Madymat, el usuario debe estar conectado a la red WiFi local ENVASES o a la red interna habilitada. Si el equipo no está conectado a esa red, la app puede no abrir o no cargar correctamente los datos.",
      },
      {
        titulo: "Flujo general",
        pasos: [
          "Portería registra el ingreso desde Rollizos o Materiales.",
          "El sistema asigna automáticamente el N° de viaje mensual según el tipo de ingreso.",
          "Se cargan proveedor, material, tipo de servicio logístico, chofer o responsable, procedencia, remito, cantidades y fotos.",
          "El ingreso queda registrado y disponible en Registros.",
          "Si existen datos manuales o fuera de sugeridos, el ingreso queda pendiente de aprobación.",
          "Pago a Proveedores revisa los datos y los valida contra la información administrativa correspondiente.",
          "Cuando no quedan pendientes, se habilita la documentación administrativa.",
          "Se descargan los PDFs correspondientes.",
          "La documentación se utiliza para continuar el circuito administrativo interno.",
        ],
      },
      {
        titulo: "Tipo de servicio logístico",
        items: [
          "Propio: traslado realizado por personal o unidad propia de la empresa.",
          "Externo: traslado realizado por un tercero. Engloba fletero o transporte externo.",
          "Si el servicio es Propio, la app muestra la lista de choferes o responsables propios y permite registrarlo manualmente si no aparece.",
          "Si el servicio es Externo, la app solicita el Servicio logístico externo y el nombre del chofer como texto.",
          "Ya no existe un selector separado para clasificar al chofer. El chofer depende del tipo de servicio logístico.",
        ],
      },
      {
        titulo: "Estados importantes",
        items: [
          "REGISTRADO: ingreso cargado correctamente.",
          "ANULADO: ingreso dado de baja con motivo. No reutiliza su N° de viaje.",
          "Pendiente de aprobación: tiene datos manuales o fuera de sugeridos que deben validarse.",
          "Aprobado para documentación: no tiene pendientes y permite descargar los PDFs correspondientes.",
        ],
      },
      {
        titulo: "Pendientes en el menú",
        texto:
          "El menú Pendientes puede mostrar un globo de notificación con la cantidad de ingresos pendientes de validar. Si no hay pendientes, el globo no se muestra.",
      },
    ],
  },
  {
    id: "porteria",
    tab: "Portería",
    titulo: "Manual para Portería",
    descripcion: "Guía para registrar ingresos de Rollizos y Materiales.",
    secciones: [
      {
        titulo: "Registrar ingreso de Rollizos",
        pasos: [
          "Ingresar a Rollizos desde el menú.",
          "Completar Fecha y Hora de ingreso.",
          "Seleccionar Portero si corresponde.",
          "Seleccionar Proveedor.",
          "Completar Cantidad total viaje en TN. La cantidad debe ser mayor a cero y menor a 40 TN.",
          "No cargar KG en Rollizos. Si el dato recibido está en KG, convertirlo antes de registrar. Ejemplo: 4350 KG = 4,35 TN.",
          "Seleccionar Artículo. Por defecto se registra un solo artículo con el 100% de la carga.",
          "Si el viaje incluye más de un artículo, activar La carga contiene más de un artículo.",
          "Para varios artículos, cargar cada ítem con su artículo y porcentaje de participación.",
          "Verificar que la suma de porcentajes sea 100%. La app calcula automáticamente la cantidad de cada ítem según la cantidad total del viaje.",
          "Seleccionar Procedencia.",
          "Completar Remito proveedor obligatorio.",
          "Seleccionar tipo de servicio logístico: Propio o Externo.",
          "Si se selecciona Propio, elegir Chofer / Responsable propio de la lista disponible o registrar manualmente si no aparece.",
          "Si se selecciona Externo, seleccionar Servicio logístico externo y cargar el nombre del chofer.",
          "Completar datos de patente.",
          "Seleccionar Hachador.",
          "Cargar fotos obligatorias: Foto del camión / patente y Foto del material cargado.",
          "Cargar foto de remito físico o adicional si corresponde.",
          "Presionar Guardar ingreso.",
          "Verificar que el sistema redirija al detalle del ingreso.",
        ],
      },
      {
        titulo: "Validación de cantidad en Rollizos",
        texto:
          "Para Rollizos, la cantidad total del viaje debe ser menor a 40 TN. Si se ingresa una cantidad mayor o igual a 40 TN, la app muestra una advertencia en el campo y no permite guardar hasta corregirla. El sistema no bloquea la escritura del número, pero sí impide guardar con una cantidad inválida.",
      },
      {
        titulo: "Registrar ingreso de Materiales",
        pasos: [
          "Ingresar a Materiales desde el menú.",
          "Completar Fecha y Hora.",
          "Completar Remito proveedor obligatorio.",
          "Seleccionar Proveedor.",
          "Seleccionar Procedencia.",
          "Cargar uno o más ítems del remito.",
          "Por cada ítem, seleccionar categoría, artículo, cantidad y unidad.",
          "Seleccionar tipo de servicio logístico: Propio o Externo.",
          "Si se selecciona Propio, elegir Chofer / Responsable propio o registrarlo manualmente si no aparece.",
          "Si se selecciona Externo, seleccionar Servicio logístico externo y cargar el nombre del chofer.",
          "Completar patente si corresponde.",
          "Cargar fotos obligatorias.",
          "Guardar ingreso.",
          "Revisar detalle.",
        ],
      },
      {
        titulo: "Datos no encontrados",
        texto:
          "Si el usuario no encuentra un proveedor, artículo, hachador, servicio logístico o chofer propio, puede usar la opción de carga manual cuando esté disponible. Ese dato quedará pendiente de aprobación por Pago a Proveedores cuando corresponda. Mientras existan pendientes, no se podrá descargar la documentación administrativa.",
      },
      {
        titulo: "Qué no debe hacer Portería",
        items: [
          "No cargar datos incompletos.",
          "No omitir remito proveedor.",
          "No cargar KG en Rollizos. Rollizos debe registrarse en TN.",
          "No guardar Rollizos con cantidad total mayor o igual a 40 TN.",
          "No cargar fotos borrosas si son obligatorias.",
          "No reutilizar ingresos anteriores.",
          "No aprobar pendientes administrativos.",
        ],
      },
    ],
  },
  {
    id: "proveedores",
    tab: "Pago a Proveedores",
    titulo: "Manual para Pago a Proveedores",
    descripcion:
      "Guía para revisar ingresos, validar datos pendientes y descargar documentación administrativa.",
    secciones: [
      {
        titulo: "Revisar registros",
        pasos: [
          "Ingresar a Registros.",
          "Filtrar por tipo de ingreso, estado, fecha desde, fecha hasta, remito, patente, portero o proveedor.",
          "El filtro Proveedor es una lista desplegable buscable. Permite buscar por código o nombre.",
          "Cuando está disponible, el proveedor se muestra como Código - Nombre proveedor.",
          "Abrir el detalle del ingreso.",
          "Revisar datos generales, ítems, fotos, pendientes y documentación.",
        ],
      },
      {
        titulo: "Revisar pendientes",
        pasos: [
          "Ingresar a Pendientes. Si hay ingresos pendientes, el menú puede mostrar un globo con la cantidad.",
          "Filtrar por motivo: Proveedor manual, Servicio manual, Hachador manual, Artículo manual o Fuera de sugeridos.",
          "Abrir el detalle.",
          "Revisar el dato cargado por Portería.",
          "Verificar o dar de alta el dato correspondiente en el sistema administrativo.",
          "En la app, cargar o seleccionar el dato validado.",
          "Presionar Aprobar.",
          "Confirmar que el pendiente desaparezca.",
          "Si ya no quedan pendientes, verificar que se habiliten los PDFs.",
        ],
      },
      {
        titulo: "Aprobación de datos",
        texto:
          "La aprobación en Madymat no modifica automáticamente otros sistemas administrativos. Primero se debe verificar o dar de alta el dato donde corresponda. Luego se aprueba en la app dejando trazabilidad del dato original, el dato validado, el usuario aprobador y la observación.",
      },
      {
        titulo: "Documentación administrativa",
        pasos: [
          "Abrir el detalle del ingreso.",
          "Verificar que el ingreso no esté anulado y que no tenga pendientes.",
          "Para Rollizos, descargar PDF Proveedor y PDF Hachador.",
          "Para Rollizos, descargar PDF Servicio Externo solo cuando el tipo de servicio sea Externo o un registro histórico compatible.",
          "Para Materiales, descargar PDF Proveedor.",
          "Para Materiales, descargar PDF Servicio Externo solo cuando corresponda.",
          "Si el ingreso es Propio, no corresponde PDF de Servicio Externo.",
          "Si hay pendientes de aprobación, la documentación no se habilita.",
          "Utilizar la documentación para continuar la carga administrativa.",
          "Luego continuar el circuito interno según procedimiento administrativo.",
        ],
      },
      {
        titulo: "Ingresos anulados",
        texto:
          "Los ingresos anulados quedan disponibles para auditoría, pero no deben utilizarse para documentación administrativa. El N° de viaje del ingreso anulado no se reutiliza.",
      },
    ],
  },
]

export const preguntasFrecuentesManual = [
  {
    pregunta: "¿Por qué no puedo descargar el PDF?",
    respuesta:
      "Porque el ingreso tiene datos pendientes de aprobación, está anulado o el tipo de servicio no corresponde al documento solicitado.",
  },
  {
    pregunta: "¿Qué hago si no encuentro un proveedor, artículo, hachador o servicio?",
    respuesta:
      "Debe cargarse manualmente si la opción está disponible. Luego Pago a Proveedores debe validarlo.",
  },
  {
    pregunta: "¿El N° de viaje se escribe manualmente?",
    respuesta:
      "No. El sistema lo asigna automáticamente por mes y por tipo de ingreso.",
  },
  {
    pregunta: "¿Qué pasa si anulo un ingreso?",
    respuesta: "El ingreso queda anulado y no se reutiliza su N° de viaje.",
  },
  {
    pregunta: "¿Quién puede aprobar pendientes?",
    respuesta:
      "Usuarios con rol Pago a Proveedores, Administrador o IT Técnico.",
  },
  {
    pregunta: "¿Qué significa Propio y Externo?",
    respuesta:
      "Propio corresponde a traslado realizado por personal o unidad propia. Externo corresponde a fletero o transporte externo.",
  },
  {
    pregunta: "¿En qué unidad se cargan los Rollizos?",
    respuesta:
      "Los Rollizos deben cargarse en TN. Si el dato está en KG, debe convertirse a TN antes de registrar. Ejemplo: 4350 KG = 4,35 TN.",
  },
  {
    pregunta: "¿Por qué no puedo guardar una cantidad de 40 TN o más en Rollizos?",
    respuesta:
      "Porque la app valida que la cantidad total del viaje de Rollizos sea menor a 40 TN.",
  },
]
