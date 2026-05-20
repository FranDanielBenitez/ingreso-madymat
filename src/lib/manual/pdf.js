import {
  manualMeta,
  perfilesManual,
  preguntasFrecuentesManual,
} from "@/lib/manual/contenido"

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const MARGIN = 48
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

function normalizarPdfText(value) {
  return String(value || "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/•/g, "-")
    .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "?")
}

function textToHex(value) {
  return Buffer.from(normalizarPdfText(value), "latin1").toString("hex").toUpperCase()
}

function wrapText(text, fontSize, maxWidth = CONTENT_WIDTH) {
  const words = normalizarPdfText(text).split(/\s+/).filter(Boolean)
  const maxChars = Math.max(18, Math.floor(maxWidth / (fontSize * 0.48)))
  const lines = []
  let current = ""

  for (const word of words) {
    const next = current ? `${current} ${word}` : word

    if (next.length > maxChars && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }

  if (current) lines.push(current)

  return lines
}

function colorRgb(color) {
  if (color === "red") return "0.82 0.05 0.07 rg"
  if (color === "muted") return "0.28 0.34 0.42 rg"
  if (color === "light") return "0.45 0.50 0.58 rg"
  return "0.06 0.09 0.16 rg"
}

function addTextLine(page, text, { x, y, font = "F1", size = 10, color = "dark" }) {
  page.commands.push(
    "BT",
    `/${font} ${size} Tf`,
    colorRgb(color),
    `1 0 0 1 ${x} ${y} Tm`,
    `<${textToHex(text)}> Tj`,
    "ET"
  )
}

function createPage() {
  return {
    commands: [
      "0.96 0.97 0.98 rg",
      `0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT} re f`,
      "1 1 1 rg",
      `${MARGIN - 14} ${MARGIN - 18} ${CONTENT_WIDTH + 28} ${
        PAGE_HEIGHT - MARGIN * 2 + 36
      } re f`,
    ],
  }
}

function addPageNumber(page, number) {
  addTextLine(page, `Pagina ${number}`, {
    x: PAGE_WIDTH - MARGIN - 60,
    y: 28,
    size: 9,
    color: "light",
  })
}

function renderContent() {
  const pages = [createPage()]
  let currentPage = pages[0]
  let y = PAGE_HEIGHT - MARGIN

  function ensureSpace(space = 34) {
    if (y - space >= MARGIN) return

    currentPage = createPage()
    pages.push(currentPage)
    y = PAGE_HEIGHT - MARGIN
  }

  function paragraph(text, options = {}) {
    const size = options.size || 10.5
    const lineHeight = options.lineHeight || size + 4
    const x = MARGIN + (options.indent || 0)
    const width = CONTENT_WIDTH - (options.indent || 0)
    const lines = wrapText(text, size, width)

    for (const line of lines) {
      ensureSpace(lineHeight + 4)
      addTextLine(currentPage, line, {
        x,
        y,
        size,
        font: options.bold ? "F2" : "F1",
        color: options.color || "dark",
      })
      y -= lineHeight
    }

    y -= options.after ?? 5
  }

  function heading(text, level = 2) {
    const size = level === 1 ? 17 : level === 2 ? 13 : 11
    const before = level === 1 ? 22 : 15
    const after = level === 1 ? 10 : 6

    ensureSpace(before + size + after)
    y -= before
    addTextLine(currentPage, text, {
      x: MARGIN,
      y,
      size,
      font: "F2",
      color: level === 1 ? "red" : "dark",
    })
    y -= size + after
  }

  function list(items, numbered = false) {
    items.forEach((item, index) => {
      paragraph(`${numbered ? `${index + 1}.` : "-"} ${item}`, {
        indent: 16,
        after: 2,
      })
    })
    y -= 4
  }

  addTextLine(currentPage, "Puebla Envases", {
    x: MARGIN,
    y,
    size: 10,
    font: "F2",
    color: "red",
  })
  y -= 28
  addTextLine(currentPage, manualMeta.tituloPdf, {
    x: MARGIN,
    y,
    size: 22,
    font: "F2",
    color: "dark",
  })
  y -= 24
  addTextLine(currentPage, manualMeta.subtituloPdf, {
    x: MARGIN,
    y,
    size: 13,
    font: "F1",
    color: "muted",
  })
  y -= 20
  addTextLine(currentPage, `Fecha de generacion: ${new Date().toLocaleDateString("es-AR")}`, {
    x: MARGIN,
    y,
    size: 10,
    font: "F1",
    color: "light",
  })
  y -= 26
  paragraph(manualMeta.descripcion, { size: 11.5, color: "muted", after: 10 })

  perfilesManual.forEach((perfil) => {
    heading(perfil.titulo, 1)
    paragraph(perfil.descripcion, { color: "muted" })

    perfil.secciones.forEach((seccion) => {
      heading(seccion.titulo, 2)

      if (seccion.texto) paragraph(seccion.texto)
      if (seccion.pasos) list(seccion.pasos, true)
      if (seccion.items) list(seccion.items, false)
    })
  })

  heading("Preguntas frecuentes", 1)
  preguntasFrecuentesManual.forEach((item, index) => {
    heading(`${index + 1}. ${item.pregunta}`, 3)
    paragraph(item.respuesta, { color: "muted" })
  })

  pages.forEach((page, index) => addPageNumber(page, index + 1))

  return pages
}

function buildPdf(pages) {
  const objects = []

  function addObject(content) {
    objects.push(content)
    return objects.length
  }

  const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>")
  const pagesId = addObject("")
  const fontRegularId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
  const fontBoldId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")

  const pageIds = []

  pages.forEach((page) => {
    const stream = page.commands.join("\n")
    const streamId = addObject(
      `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`
    )
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${streamId} 0 R >>`
    )
    pageIds.push(pageId)
  })

  objects[pagesId - 1] =
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`
  objects[catalogId - 1] = "<< /Type /Catalog /Pages 2 0 R >>"

  const chunks = ["%PDF-1.4\n%\xE2\xE3\xCF\xD3\n"]
  const offsets = [0]

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(chunks.join(""), "latin1"))
    chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`)
  })

  const xrefOffset = Buffer.byteLength(chunks.join(""), "latin1")
  chunks.push(`xref\n0 ${objects.length + 1}\n`)
  chunks.push("0000000000 65535 f \n")

  for (let index = 1; index < offsets.length; index += 1) {
    chunks.push(`${String(offsets[index]).padStart(10, "0")} 00000 n \n`)
  }

  chunks.push(
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  )

  return Buffer.from(chunks.join(""), "latin1")
}

export function generarManualPdf() {
  return buildPdf(renderContent())
}
