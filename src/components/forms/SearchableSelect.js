"use client"

import { useEffect, useMemo, useRef, useState } from "react"

function normalizar(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

export function ModoBusquedaInline({ value, onChange, disabled = false }) {
  const mostrandoTodos = value === "TODOS"

  return (
    <div className="flex items-center gap-1 text-xs text-[#64748B]">
      <span>Mostrando:</span>
      <span className="font-semibold text-[#0F172A]">
        {mostrandoTodos ? "Todos" : "Sugeridos"}
      </span>
      <span className="text-[#CBD5E1]">|</span>
      <button
        type="button"
        onClick={() => onChange(mostrandoTodos ? "SUGERIDOS" : "TODOS")}
        disabled={disabled}
        className="font-semibold text-[#475569] underline-offset-4 hover:text-[#D90F14] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
      >
        {mostrandoTodos ? "Ver sugeridos" : "Ver todos"}
      </button>
    </div>
  )
}

export default function SearchableSelect({
  label,
  value,
  options = [],
  onChange,
  getOptionValue = (item) => item?.value,
  getOptionLabel = (item) => item?.label,
  getSearchText,
  placeholder = "Buscar o seleccionar",
  emptyText = "Sin resultados",
  disabled = false,
  loading = false,
  modeControl = null,
}) {
  const wrapperRef = useRef(null)
  const selectedOption = useMemo(
    () =>
      options.find((option) => String(getOptionValue(option)) === String(value)) ||
      null,
    [getOptionValue, options, value]
  )
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const selectedLabel = selectedOption ? getOptionLabel(selectedOption) : ""

  useEffect(() => {
    function handleClickOutside(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const resultados = useMemo(() => {
    const texto = normalizar(query)
    const textoSeleccionado = normalizar(selectedLabel)

    if (!texto || texto === textoSeleccionado) return options.slice(0, 60)

    return options
      .filter((option) => {
        const searchText = getSearchText
          ? getSearchText(option)
          : getOptionLabel(option)

        return normalizar(searchText).includes(texto)
      })
      .slice(0, 60)
  }, [getOptionLabel, getSearchText, options, query, selectedLabel])

  function seleccionar(option) {
    onChange(option)
    setQuery("")
    setOpen(false)
  }

  function limpiar() {
    onChange(null)
    setQuery("")
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <label className="font-semibold text-[#0F172A]">{label}</label>
        {modeControl}
      </div>

      <div className="relative">
        <input
          type="text"
          value={open ? query : selectedLabel}
          onFocus={() => {
            setQuery("")
            setOpen(true)
          }}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          disabled={disabled || loading}
          placeholder={loading ? "Cargando..." : placeholder}
          className="w-full rounded-lg border border-[#CBD5E1] bg-white p-3 pr-24 text-[#0F172A] placeholder:text-slate-400 outline-none focus:border-[#F3171B] focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-50"
        />

        {selectedOption ? (
          <button
            type="button"
            onClick={limpiar}
            disabled={disabled || loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#64748B] hover:text-[#D90F14] disabled:cursor-not-allowed"
          >
            Limpiar
          </button>
        ) : null}
      </div>

      {open && !disabled && !loading ? (
        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-[#CBD5E1] bg-white p-1 shadow-lg shadow-slate-200">
          {resultados.length > 0 ? (
            resultados.map((option) => {
              const optionValue = getOptionValue(option)

              return (
                <button
                  key={optionValue}
                  type="button"
                  onClick={() => seleccionar(option)}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[#0F172A] hover:bg-[#F5F7FA]"
                >
                  {getOptionLabel(option)}
                </button>
              )
            })
          ) : (
            <p className="px-3 py-2 text-sm text-[#64748B]">{emptyText}</p>
          )}
        </div>
      ) : null}
    </div>
  )
}
