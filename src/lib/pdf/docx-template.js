import { randomUUID } from "node:crypto"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import os from "node:os"
import path from "node:path"
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import PizZip from "pizzip"

const execFileAsync = promisify(execFile)

async function existeArchivo(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function resolverLibreOfficePath() {
  const candidates = [
    process.env.LIBREOFFICE_PATH,
    "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
    "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
  ].filter(Boolean)

  for (const candidate of candidates) {
    if (await existeArchivo(candidate)) {
      return candidate
    }
  }

  return "soffice"
}

function textoPlanoXml(value) {
  return String(value)
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function reemplazarPlaceholderEnXml(xml, key, value) {
  const expected = `{{${key}}}`
  let output = ""
  let index = 0
  let replacements = 0

  while (index < xml.length) {
    const openIndex = xml.indexOf("{{", index)

    if (openIndex === -1) {
      output += xml.slice(index)
      break
    }

    const closeIndex = xml.indexOf("}}", openIndex + 2)

    if (closeIndex === -1) {
      output += xml.slice(index)
      break
    }

    const candidate = xml.slice(openIndex, closeIndex + 2)
    const plainCandidate = textoPlanoXml(candidate)

    output += xml.slice(index, openIndex)

    if (plainCandidate === expected) {
      output += escapeXml(value)
      replacements += 1
    } else {
      output += candidate
    }

    index = closeIndex + 2
  }

  return {
    xml: output,
    replacements,
  }
}

function renderizarPlaceholders(zip, data) {
  const keys = Object.keys(data)
  const found = new Set()
  const xmlFiles = Object.keys(zip.files).filter(
    (fileName) => fileName.startsWith("word/") && fileName.endsWith(".xml")
  )

  xmlFiles.forEach((fileName) => {
    const file = zip.file(fileName)
    if (!file) return

    let xml = file.asText()

    keys.forEach((key) => {
      const result = reemplazarPlaceholderEnXml(xml, key, data[key] ?? "")
      xml = result.xml

      if (result.replacements > 0) {
        found.add(key)
      }
    })

    zip.file(fileName, xml)
  })

  const missing = keys.filter((key) => !found.has(key))

  if (missing.length > 0) {
    throw new Error(`El template no contiene estos placeholders: ${missing.map((key) => `{{${key}}}`).join(", ")}`)
  }

  const unresolved = []

  xmlFiles.forEach((fileName) => {
    const file = zip.file(fileName)
    if (!file) return

    const text = textoPlanoXml(file.asText())
    const matches = text.match(/\{\{[^}]+}}/g)

    if (matches?.length) {
      unresolved.push(...matches)
    }
  })

  if (unresolved.length > 0) {
    throw new Error(`Quedaron placeholders sin reemplazar: ${[...new Set(unresolved)].join(", ")}`)
  }
}

export async function renderDocxTemplate(templatePath, data, outputDocxPath) {
  try {
    const content = await readFile(templatePath)
    const zip = new PizZip(content)
    renderizarPlaceholders(zip, data)

    const buffer = zip.generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    })

    await writeFile(outputDocxPath, buffer)

    return buffer
  } catch (error) {
    throw new Error(`Error renderizando template DOCX: ${error.message}`)
  }
}

export async function convertDocxToPdf(inputDocxPath, outputDir) {
  const sofficePath = await resolverLibreOfficePath()

  try {
    await execFileAsync(
      sofficePath,
      ["--headless", "--convert-to", "pdf", "--outdir", outputDir, inputDocxPath],
      {
        windowsHide: true,
        timeout: 60000,
      }
    )
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error("No se encontr\u00f3 LibreOffice para convertir DOCX a PDF. Configure LIBREOFFICE_PATH.")
    }

    throw new Error(`Error convirtiendo DOCX a PDF con LibreOffice: ${error.stderr || error.message}`)
  }

  const pdfPath = path.join(outputDir, `${path.basename(inputDocxPath, ".docx")}.pdf`)

  if (!(await existeArchivo(pdfPath))) {
    throw new Error("LibreOffice no genero el archivo PDF esperado.")
  }

  return pdfPath
}

export async function generatePdfFromTemplate({ templatePath, data, outputBaseName }) {
  const jobId = `${outputBaseName}-${randomUUID()}`
  const tempDir = path.join(os.tmpdir(), "ingreso-madymat-pdf", jobId)
  const outputDocxPath = path.join(tempDir, `${outputBaseName}.docx`)

  await mkdir(tempDir, { recursive: true })

  try {
    await renderDocxTemplate(templatePath, data, outputDocxPath)
    const pdfPath = await convertDocxToPdf(outputDocxPath, tempDir)

    return await readFile(pdfPath)
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}
