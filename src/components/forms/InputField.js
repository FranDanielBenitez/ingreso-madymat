export default function InputField({
  label,
  name,
  register,
  rules,
  error,
  type = "text",
  required = false,
  className = "",
  ...props
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <input
        type={type}
        className={`h-12 w-full rounded-md border bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 ${
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
