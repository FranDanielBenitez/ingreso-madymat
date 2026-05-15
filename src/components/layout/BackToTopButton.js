"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

function ArrowUpIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    >
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  )
}

export default function BackToTopButton() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  const ocultarEnLogin = pathname === "/login"

  useEffect(() => {
    if (ocultarEnLogin) {
      return
    }

    let ticking = false

    function evaluarScroll() {
      const scrollY = window.scrollY || document.documentElement.scrollTop
      const viewportHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const form = document.querySelector("form")

      const targetTop = form?.offsetTop || 0
      const targetHeight = form?.offsetHeight || documentHeight
      const scrollableTarget = Math.max(targetHeight - viewportHeight, 1)
      const progress = Math.max(0, scrollY - targetTop) / scrollableTarget
      const llegoAlFinal = scrollY + viewportHeight >= documentHeight - 24

      setVisible(progress >= 0.8 || llegoAlFinal)
      ticking = false
    }

    function onScroll() {
      if (ticking) return

      ticking = true
      window.requestAnimationFrame(evaluarScroll)
    }

    evaluarScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [ocultarEnLogin])

  if (ocultarEnLogin) {
    return null
  }

  function volverArriba() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    <button
      type="button"
      onClick={volverArriba}
      className={`fixed bottom-5 right-4 z-40 grid h-11 w-11 place-items-center rounded-full border border-[#CBD5E1] bg-white text-[#0F172A] shadow-md transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-[#F3171B] hover:text-[#D90F14] focus:border-[#F3171B] focus:outline-none focus:ring-2 focus:ring-red-100 ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
      aria-label="Volver arriba"
      title="Volver arriba"
    >
      <ArrowUpIcon />
    </button>
  )
}
