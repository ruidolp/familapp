import { useCallback, useMemo } from 'react'
import { useCurrency } from '@/presentation/providers/currency-provider'

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const getLocaleSeparators = (locale: string) => {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  const parts = formatter.formatToParts(1234.5)
  const decimalSeparator = parts.find((part) => part.type === 'decimal')?.value || ','
  const groupSeparator = parts.find((part) => part.type === 'group')?.value || '.'
  return { decimalSeparator, groupSeparator }
}

export function useCurrencyInput() {
  const { decimales, locale } = useCurrency()

  const { decimalSeparator, groupSeparator } = useMemo(
    () => getLocaleSeparators(locale),
    [locale],
  )

  const formatInputValue = useCallback(
    (value: string) => {
      if (!value) return ''

      const sanitizeRegex = new RegExp(`[^0-9${escapeRegExp(decimalSeparator)}]`, 'g')
      let sanitized = value.replace(sanitizeRegex, '')
      if (!sanitized) return ''

      let endsWithDecimal = decimales > 0 && sanitized.endsWith(decimalSeparator)
      const [rawInteger, ...rawDecimals] = sanitized.split(decimalSeparator)
      let integerPart = rawInteger || '0'
      let decimalPart = rawDecimals.join('')

      if (decimales === 0) {
        decimalPart = ''
        endsWithDecimal = false
      } else if (decimalPart.length > decimales) {
        decimalPart = decimalPart.slice(0, decimales)
      }

      if (integerPart) {
        integerPart = integerPart.replace(/^0+(?=\d)/, '') || '0'
      }

      const groupedInteger = integerPart
        ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator)
        : ''

      if (decimalPart) {
        return `${groupedInteger}${decimalSeparator}${decimalPart}`
      }

      if (decimalSeparator && endsWithDecimal) {
        return `${groupedInteger}${decimalSeparator}`
      }

      return groupedInteger
    },
    [decimales, decimalSeparator, groupSeparator],
  )

  const parseInputToNumber = useCallback(
    (value: string) => {
      if (!value) return 0
      const groupRegex = new RegExp(escapeRegExp(groupSeparator || ','), 'g')
      let normalized = value.replace(/\s+/g, '').replace(groupRegex, '')

      if (decimales > 0) {
        const decimalRegex = new RegExp(escapeRegExp(decimalSeparator || '.'), 'g')
        normalized = normalized.replace(decimalRegex, '.')
      }

      const parsed = parseFloat(normalized)
      return Number.isNaN(parsed) ? 0 : parsed
    },
    [decimalSeparator, groupSeparator, decimales],
  )

  return { formatInputValue, parseInputToNumber, decimalSeparator, groupSeparator }
}
