export default function TextareaField({
  label,
  name,
  register,
  rules,
  error,
  required = false,
  className = "",
  ...props
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold text-[#0F172A] dark:text-slate-100">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <textarea
        className={`min-h-28 w-full rounded-lg border bg-white px-3 py-3 text-base text-[#0F172A] placeholder:text-slate-400 outline-none focus:border-[#F3171B] focus:ring-2 focus:ring-red-100 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:ring-red-950/40 ${
          error ? "border-red-400" : "border-slate-300"
        }`}
        {...register(name, rules)}
        {...props}
      />
      {error ? (
        <span className="mt-1 block text-sm text-red-600">{error.message}</span>
      ) : null}
    </label>
  )
}
