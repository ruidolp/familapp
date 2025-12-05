/**
 * Utilidades para manipular colores hexadecimales y generar variantes accesibles.
 */

const DEFAULT_COLOR = '#3b82f6'

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const normalizeHex = (hex?: string) => {
  if (!hex) return DEFAULT_COLOR
  const value = hex.trim()
  if (/^#([0-9a-fA-F]{3}){1,2}$/.test(value)) {
    return value.length === 4
      ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
      : value
  }
  return DEFAULT_COLOR
}

const hexToRgb = (hex: string) => {
  const normalized = normalizeHex(hex).replace('#', '')
  const bigint = parseInt(normalized, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return { r, g, b }
}

const rgbToHex = (r: number, g: number, b: number) => {
  const toHex = (value: number) => value.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const rgbToHsl = (r: number, g: number, b: number) => {
  const nr = r / 255
  const ng = g / 255
  const nb = b / 255

  const max = Math.max(nr, ng, nb)
  const min = Math.min(nr, ng, nb)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case nr:
        h = (ng - nb) / d + (ng < nb ? 6 : 0)
        break
      case ng:
        h = (nb - nr) / d + 2
        break
      case nb:
        h = (nr - ng) / d + 4
        break
    }

    h /= 6
  }

  return {
    h: h * 360,
    s: s * 100,
    l: l * 100,
  }
}

const hslToRgb = (h: number, s: number, l: number) => {
  const hue = h / 360
  const sat = s / 100
  const lig = l / 100

  if (sat === 0) {
    const gray = Math.round(lig * 255)
    return { r: gray, g: gray, b: gray }
  }

  const q = lig < 0.5 ? lig * (1 + sat) : lig + sat - lig * sat
  const p = 2 * lig - q

  const hueToRgb = (t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  const r = Math.round(hueToRgb(hue + 1 / 3) * 255)
  const g = Math.round(hueToRgb(hue) * 255)
  const b = Math.round(hueToRgb(hue - 1 / 3) * 255)
  return { r, g, b }
}

const adjustHsl = (hex: string, lDelta: number, sDelta = 0) => {
  const { r, g, b } = hexToRgb(hex)
  const { h, s, l } = rgbToHsl(r, g, b)

  const nextS = clamp(s + sDelta, 5, 100)
  const nextL = clamp(l + lDelta, 5, 95)
  const { r: nr, g: ng, b: nb } = hslToRgb(h, nextS, nextL)
  return rgbToHex(nr, ng, nb)
}

export function getColorShades(hexColor: string) {
  const normalized = normalizeHex(hexColor)
  const color600 = adjustHsl(normalized, -4, -5)
  const color700 = adjustHsl(color600, -8)
  const color500 = adjustHsl(color600, 8, -3)

  return {
    color700,
    color600,
    color500,
  }
}

export function getHslFromHex(hexColor: string) {
  const { r, g, b } = hexToRgb(hexColor)
  const { h, s, l } = rgbToHsl(r, g, b)
  const round = (value: number) => Math.round(value)
  return `${round(h)} ${round(s)}% ${round(l)}%`
}

export function getContrastColor(hexColor: string): 'white' | 'black' {
  const { r, g, b } = hexToRgb(hexColor)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? 'black' : 'white'
}
