import { Toaster } from "sonner"
import { Geist, Geist_Mono } from "next/font/google"
import Navbar from "@/components/layout/Navbar"
import BackToTopButton from "@/components/layout/BackToTopButton"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata = {
  title: "Ingreso Madymat",
  description: "Sistema de ingreso de madera y materiales",
}

export default function RootLayout({ children }) {
  const themeScript = `
    (function () {
      try {
        var storedTheme = localStorage.getItem("ingreso-madymat-theme");
        var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        var theme = storedTheme || (prefersDark ? "dark" : "light");
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.dataset.theme = theme;
      } catch (error) {
        document.documentElement.dataset.theme = "light";
      }
    })();
  `

  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-[#F5F7FA] text-[#0F172A]">
        <Navbar />
        {children}
        <BackToTopButton />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
