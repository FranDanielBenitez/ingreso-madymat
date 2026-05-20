export const manualMeta = {
  categoria: "AYUDA",
  titulo: "Manual de uso",
  tituloPdf: "Manual de uso - Madymat",
  subtituloPdf: "Registracion de Ingresos a Fabrica",
  descripcion:
    "Guia rapida para registrar ingresos, validar datos y generar documentacion FEX.",
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
      "Resumen del circuito de ingresos, estados y documentacion dentro de la app.",
    secciones: [
      {
        titulo: "Objetivo de la app",
        texto:
          "Ingreso Madymat permite registrar, controlar y auditar los ingresos de Rollizos y Materiales a fabrica. Centraliza la informacion cargada por Porteria, permite adjuntar fotos, consultar registros, validar datos pendientes y generar documentacion FEX para el circuito administrativo.",
      },
      {
        titulo: "Flujo general",
        pasos: [
          "Porteria registra el ingreso.",
          "El sistema asigna automaticamente el N° de viaje mensual segun tipo de ingreso.",
          "Se cargan proveedor, material, transporte, chofer, procedencia, remito, cantidades y fotos.",
          "El ingreso queda registrado y disponible en Registros.",
          "Si existen datos manuales o fuera de sugeridos, el ingreso queda Pendiente de aprobacion.",
          "Pago a Proveedores revisa los datos y los valida contra Bejerman.",
          "Cuando no quedan pendientes, se habilita la documentacion FEX.",
          "Se descargan los PDFs correspondientes.",
          "La documentacion se utiliza para continuar el circuito administrativo en FEX y Bejerman.",
        ],
      },
      {
        titulo: "Estados importantes",
        items: [
          "REGISTRADO: ingreso cargado correctamente.",
          "ANULADO: ingreso dado de baja con motivo.",
          "Pendiente de aprobacion: tiene datos manuales o fuera de sugeridos.",
          "Aprobado para FEX: no tiene pendientes y permite descargar PDFs.",
        ],
      },
    ],
  },
  {
    id: "porteria",
    tab: "Porteria",
    titulo: "Manual para Porteria",
    descripcion: "Guia para registrar ingresos de Rollizos y Materiales.",
    secciones: [
      {
        titulo: "Registrar ingreso de Rollizos",
        pasos: [
          "Ingresar a Rollizos desde el menu.",
          "Completar Fecha y Hora de ingreso.",
          "Seleccionar Portero si corresponde.",
          "Seleccionar Proveedor.",
          "Seleccionar Articulo.",
          "Completar cantidad y unidad.",
          "Seleccionar Procedencia.",
          "Completar Remito proveedor obligatorio.",
          "Seleccionar Fletero / Transporte.",
          "Completar datos de patente.",
          "Seleccionar Chofer.",
          "Seleccionar Hachador.",
          "Cargar fotos obligatorias: Foto del camion / patente y Foto del material cargado.",
          "Cargar foto de remito fisico o adicional si corresponde.",
          "Presionar Guardar ingreso.",
          "Verificar que el sistema redirija al detalle del ingreso.",
        ],
      },
      {
        titulo: "Registrar ingreso de Materiales",
        pasos: [
          "Ingresar a Materiales desde el menu.",
          "Completar Fecha y Hora.",
          "Completar Remito proveedor obligatorio.",
          "Seleccionar Proveedor.",
          "Seleccionar Procedencia.",
          "Cargar uno o mas items del remito.",
          "Por cada item, seleccionar categoria, articulo, cantidad y unidad.",
          "Seleccionar servicio logistico, transporte o fletero.",
          "Completar patente si corresponde.",
          "Cargar fotos obligatorias.",
          "Guardar ingreso.",
          "Revisar detalle.",
        ],
      },
      {
        titulo: "Datos no encontrados",
        texto:
          "Si el usuario no encuentra un proveedor, articulo, hachador o servicio, puede usar la opcion de carga manual cuando este disponible. Ese dato quedara pendiente de aprobacion por Pago a Proveedores. Mientras existan pendientes, no se podra descargar documentacion FEX.",
      },
      {
        titulo: "Que no debe hacer Porteria",
        items: [
          "No cargar datos incompletos.",
          "No omitir remito proveedor.",
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
      "Guia para revisar ingresos, validar datos y descargar documentacion FEX.",
    secciones: [
      {
        titulo: "Revisar registros",
        pasos: [
          "Ingresar a Registros.",
          "Filtrar por tipo, fecha, proveedor, remito, patente, portero o estado.",
          "Abrir el detalle del ingreso.",
          "Revisar datos generales, items, fotos y documentacion.",
        ],
      },
      {
        titulo: "Revisar pendientes",
        pasos: [
          "Ingresar a Pendientes.",
          "Filtrar por motivo: Proveedor manual, Servicio manual, Hachador manual, Articulo manual o Fuera de sugeridos.",
          "Abrir el detalle.",
          "Revisar el dato cargado por Porteria.",
          "Verificar o dar de alta el dato correspondiente en Bejerman.",
          "En la app, cargar o seleccionar el dato validado.",
          "Presionar Aprobar.",
          "Confirmar que el pendiente desaparezca.",
          "Si ya no quedan pendientes, verificar que se habiliten los PDFs.",
        ],
      },
      {
        titulo: "Aprobacion de datos",
        texto:
          "La aprobacion no modifica automaticamente Bejerman. Primero se debe verificar o dar de alta el dato en Bejerman. Luego se aprueba en la app dejando trazabilidad del dato original, el dato validado, el usuario aprobador y la observacion.",
      },
      {
        titulo: "Documentacion FEX",
        pasos: [
          "Abrir el detalle del ingreso.",
          "Verificar que el estado sea Aprobado para FEX.",
          "Descargar los PDFs de Rollizos: Proveedor, Hachador y Fletero / Transporte.",
          "Descargar los PDFs de Materiales: Proveedor y Fletero / Transporte.",
          "Utilizar la documentacion para continuar la carga en FEX.",
          "Luego continuar el circuito administrativo hacia Bejerman segun procedimiento interno.",
        ],
      },
      {
        titulo: "Ingresos anulados",
        texto:
          "Los ingresos anulados quedan disponibles para auditoria, pero no deben utilizarse para documentacion FEX.",
      },
    ],
  },
]

export const preguntasFrecuentesManual = [
  {
    pregunta: "Por que no puedo descargar el PDF?",
    respuesta:
      "Porque el ingreso tiene datos pendientes de aprobacion o esta anulado.",
  },
  {
    pregunta: "Que hago si no encuentro un proveedor o articulo?",
    respuesta:
      "Debe cargarse manualmente si la opcion esta disponible. Luego Pago a Proveedores debe validarlo.",
  },
  {
    pregunta: "El N° de viaje se escribe manualmente?",
    respuesta:
      "No. El sistema lo asigna automaticamente por mes y por tipo de ingreso.",
  },
  {
    pregunta: "Que pasa si anulo un ingreso?",
    respuesta: "El ingreso queda anulado y no se reutiliza su N° de viaje.",
  },
  {
    pregunta: "Quien puede aprobar pendientes?",
    respuesta:
      "Usuarios con rol Pago a Proveedores, Administrador o IT Tecnico.",
  },
]
