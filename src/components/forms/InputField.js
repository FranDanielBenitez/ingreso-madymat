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
      <span className="mb-1.5 block text-sm font-semibold text-[#0F172A]">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <input
        type={type}
        className={`h-12 w-full rounded-lg border bg-white px-3 text-base text-[#0F172A] placeholder:text-slate-400 outline-none focus:border-[#F3171B] focus:ring-2 focus:ring-red-100 ${
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
