export default function FormSection({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-[#CBD5E1] bg-white p-5 shadow-sm shadow-slate-200/70">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-[#0F172A]">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-[#475569]">{description}</p>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  )
}
