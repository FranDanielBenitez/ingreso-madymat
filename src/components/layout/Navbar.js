import Link from "next/link"

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-slate-950 text-white">
      <nav className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Ingreso Madymat
        </Link>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/ingresos/rollizos"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-800 focus:bg-slate-800 focus:outline-none"
          >
            Nuevo Rollizos
          </Link>
          <Link
            href="/registros"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-800 focus:bg-slate-800 focus:outline-none"
          >
            Registros
          </Link>
        </div>
      </nav>
    </header>
  )
}
