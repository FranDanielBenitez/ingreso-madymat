"use client"

import { FaFilePdf } from "react-icons/fa"
import { FiDownload, FiLock } from "react-icons/fi"
import { obtenerMotivosPendientes } from "@/lib/ingresos/pendientes"

function tieneDato(value) {
  return value !== null && value !== undefined && value !== ""
}

function PdfAction({ href, children, disabled, reason }) {
  const className = disabled
    ? "inline-flex min-h-16 w-full cursor-not-allowed items-center justify-between gap-3 rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-left text-sm font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400"
    : "inline-flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-sm font-bold text-[#0F172A] shadow-sm transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:border-amber-400/50 dark:hover:bg-amber-400/10 dark:hover:text-amber-100"

  const content = (
    <>
      <span className="inline-flex items-center gap-3">
        <FaFilePdf className={disabled ? "text-slate-400" : "text-[#B91C1C]"} />
        <span>{children}</span>
      </span>
      {disabled ? <FiLock /> : <FiDownload />}
    </>
  )

  if (disabled) {
    return (
      <div>
        <button
          type="button"
          disabled
          title="No disponible: existen datos pendientes de aprobacion."
          className={className}
        >
          {content}
        </button>
        {reason ? (
          <p className="mt-2 text-xs font-medium text-[#475569] dark:text-slate-300">
            {reason}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <a href={href} download className={className}>
      {content}
    </a>
  )
}

export default function DocumentacionFexCard({ ingreso, tipo }) {
  const motivosPendientes = obtenerMotivosPendientes(ingreso)
  const ingresoAnulado = ingreso?.estado === "ANULADO"
  const tienePendientes = motivosPendientes.length > 0
  const tieneProcedencia = tieneDato(ingreso?.procedencia?.nombre)
  const basePath =
    tipo === "rollizos"
      ? `/api/ingresos/rollizos/${ingreso?.id}/pdf`
      : `/api/ingresos/materiales/${ingreso?.id}/pdf`

  const tieneProveedorPdf =
    tieneDato(ingreso?.proveedorNombreCargado) ||
    tieneDato(ingreso?.proveedorNombreValidado)
  const tieneServicioPdf =
    tieneDato(ingreso?.servicioNombreCargado) ||
    tieneDato(ingreso?.servicioNombreValidado)
  const tieneHachadorPdf =
    tieneDato(ingreso?.hachadorNombreCargado) ||
    tieneDato(ingreso?.hachadorNombreValidado)
  const tieneArticulosPdf = Boolean(ingreso?.articulos?.length)
  const bloqueoGeneral = ingresoAnulado || !tieneProcedencia || tienePendientes
  const motivoBloqueoPendientes =
    "No disponible: existen datos pendientes de aprobacion."

  function motivoGeneral() {
    if (ingresoAnulado) return "No se pueden generar PDFs de ingresos anulados."
    if (!tieneProcedencia) return "Primero carga una procedencia en el ingreso."
    if (tienePendientes) return motivoBloqueoPendientes
    return ""
  }

  const mensajeEstado = motivoGeneral()
  const estadoBloqueado = Boolean(mensajeEstado)

  return (
    <section className="rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm shadow-slate-200/70 dark:border-slate-700 dark:bg-slate-900/70">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A] dark:text-slate-100">
            Documentacion FEX
          </h2>
          <p className="mt-1 text-sm text-[#475569] dark:text-slate-300">
            Descarga los comprobantes individuales para revision administrativa.
          </p>
        </div>
        {estadoBloqueado ? (
          <span className="w-fit rounded-full border border-amber-300/70 bg-amber-50/70 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-100">
            {tienePendientes ? "PDFs bloqueados" : "PDFs no disponibles"}
          </span>
        ) : (
          <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100">
            Aprobado para FEX
          </span>
        )}
      </div>

      <div
        className={`mt-4 rounded-xl border p-4 text-sm ${
          estadoBloqueado
            ? "border-amber-200/80 bg-amber-50/50 text-amber-900 dark:border-amber-400/25 dark:bg-slate-800/60 dark:text-slate-200"
            : "border-slate-200 bg-slate-50 text-[#475569] dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
        }`}
      >
        {mensajeEstado ? (
          <>
            <p className="font-semibold">{mensajeEstado}</p>
            {tienePendientes ? (
              <p className="mt-1">
                La documentacion FEX se habilitara cuando todos los pendientes
                esten aprobados.
              </p>
            ) : null}
          </>
        ) : (
          <p>La documentacion se encuentra habilitada para descarga.</p>
        )}
      </div>

      <div
        className={`mt-5 grid gap-3 ${
          tipo === "rollizos" ? "md:grid-cols-3" : "md:grid-cols-2"
        }`}
      >
        <PdfAction
          href={`${basePath}/proveedor`}
          disabled={bloqueoGeneral || !tieneProveedorPdf || !tieneArticulosPdf}
          reason={
            !tieneProveedorPdf
              ? "No hay proveedor asociado."
              : !tieneArticulosPdf
                ? "No hay articulos asociados."
                : tienePendientes
                  ? motivoBloqueoPendientes
                  : ""
          }
        >
          Descargar PDF Proveedor
        </PdfAction>

        {tipo === "rollizos" ? (
          <PdfAction
            href={`${basePath}/hachador`}
            disabled={bloqueoGeneral || !tieneHachadorPdf}
            reason={
              !tieneHachadorPdf
                ? "No hay hachador asociado."
                : tienePendientes
                  ? motivoBloqueoPendientes
                  : ""
            }
          >
            Descargar PDF Hachador
          </PdfAction>
        ) : null}

        <PdfAction
          href={`${basePath}/fletero`}
          disabled={bloqueoGeneral || !tieneServicioPdf}
          reason={
            !tieneServicioPdf
              ? "No hay fletero o transporte asociado."
              : tienePendientes
                ? motivoBloqueoPendientes
                : ""
          }
        >
          Descargar PDF Fletero / Transporte
        </PdfAction>
      </div>
    </section>
  )
}
