/**
 * Utilidades para calcular ciclos de presupuesto personalizados
 */

export interface BudgetCycle {
  startDate: Date
  endDate: Date
  year: number
  month: number // Mes del inicio del ciclo (1-12)
}

/**
 * Calcula el ciclo de presupuesto actual basado en el día de inicio configurado
 *
 * @param diaInicio - Día del mes en que inicia el ciclo (1-31)
 * @param referenceDate - Fecha de referencia (default: hoy)
 * @returns Objeto con fechas de inicio y fin del ciclo actual
 *
 * @example
 * // Usuario configura día inicio = 5
 * // Hoy es 10 de enero de 2025
 * getCurrentBudgetCycle(5) // { startDate: 5 ene 2025, endDate: 4 feb 2025 }
 *
 * // Hoy es 3 de enero de 2025
 * getCurrentBudgetCycle(5) // { startDate: 5 dic 2024, endDate: 4 ene 2025 }
 */
export function getCurrentBudgetCycle(
  diaInicio: number = 1,
  referenceDate: Date = new Date()
): BudgetCycle {
  const today = new Date(referenceDate)
  const currentDay = today.getDate()
  const currentMonth = today.getMonth() // 0-11
  const currentYear = today.getFullYear()

  let cycleStartDate: Date
  let cycleEndDate: Date

  if (currentDay >= diaInicio) {
    // Estamos dentro del ciclo que inició este mes
    cycleStartDate = new Date(currentYear, currentMonth, diaInicio)

    // El fin es un día antes del próximo inicio
    const nextMonth = currentMonth + 1
    cycleEndDate = new Date(currentYear, nextMonth, diaInicio)
    cycleEndDate.setDate(cycleEndDate.getDate() - 1)
  } else {
    // Estamos en el ciclo que inició el mes pasado
    const previousMonth = currentMonth - 1
    cycleStartDate = new Date(currentYear, previousMonth, diaInicio)

    // El fin es un día antes del inicio de este mes
    cycleEndDate = new Date(currentYear, currentMonth, diaInicio)
    cycleEndDate.setDate(cycleEndDate.getDate() - 1)
  }

  return {
    startDate: cycleStartDate,
    endDate: cycleEndDate,
    year: cycleStartDate.getFullYear(),
    month: cycleStartDate.getMonth() + 1, // 1-12
  }
}

/**
 * Formatea el ciclo de presupuesto para mostrar en UI
 * Formato: "4 Ene - 3 Feb 2025"
 *
 * @param cycle - Ciclo de presupuesto
 * @param locale - Locale para formateo (default: 'es-ES')
 * @returns String formateado
 */
export function formatBudgetCycle(
  cycle: BudgetCycle,
  locale: string = 'es-ES'
): string {
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'short' })

  const startDay = cycle.startDate.getDate()
  const endDay = cycle.endDate.getDate()

  const startMonth = monthFormatter.format(cycle.startDate)
  const endMonth = monthFormatter.format(cycle.endDate)

  const year = cycle.endDate.getFullYear()

  // Capitalizar primera letra de meses
  const startMonthCap = startMonth.charAt(0).toUpperCase() + startMonth.slice(1).replace('.', '')
  const endMonthCap = endMonth.charAt(0).toUpperCase() + endMonth.slice(1).replace('.', '')

  return `${startDay} ${startMonthCap} - ${endDay} ${endMonthCap} ${year}`
}

/**
 * Formatea el ciclo de presupuesto con mayor detalle para UI destacadas
 * Formato: "Lunes 05 Enero 25 al Martes 04 Febrero 25"
 */
export function formatDetailedBudgetRange(
  cycle: BudgetCycle,
  locale: string = 'es-ES'
): string {
  const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: 'long' })
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'long' })
  const yearFormatter = new Intl.DateTimeFormat(locale, { year: '2-digit' })

  const capitalize = (text: string) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text)

  const formatDate = (date: Date) => {
    const weekday = capitalize(weekdayFormatter.format(date))
    const month = capitalize(monthFormatter.format(date))
    const day = date.getDate().toString().padStart(2, '0')
    const year = yearFormatter.format(date)
    return `${weekday} ${day} ${month} ${year}`
  }

  const startLabel = formatDate(cycle.startDate)
  const endLabel = formatDate(cycle.endDate)

  return `${startLabel} al ${endLabel}`
}

/**
 * Obtiene el nombre del mes calendario (para mostrar como título)
 * Ejemplo: "Diciembre"
 *
 * @param cycle - Ciclo de presupuesto
 * @param locale - Locale para formateo (default: 'es-ES')
 * @returns Nombre del mes
 */
export function getMonthName(
  cycle: BudgetCycle,
  locale: string = 'es-ES'
): string {
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: 'long' })
  const monthName = monthFormatter.format(cycle.startDate)
  return monthName.charAt(0).toUpperCase() + monthName.slice(1)
}

/**
 * Navega al ciclo anterior
 *
 * @param currentCycle - Ciclo actual
 * @param diaInicio - Día de inicio del periodo
 * @returns Ciclo anterior
 */
export function getPreviousCycle(
  currentCycle: BudgetCycle,
  diaInicio: number
): BudgetCycle {
  // Retroceder un mes desde la fecha de inicio del ciclo actual
  const previousDate = new Date(currentCycle.startDate)
  previousDate.setMonth(previousDate.getMonth() - 1)

  return getCurrentBudgetCycle(diaInicio, previousDate)
}

/**
 * Navega al ciclo siguiente
 *
 * @param currentCycle - Ciclo actual
 * @param diaInicio - Día de inicio del periodo
 * @returns Ciclo siguiente
 */
export function getNextCycle(
  currentCycle: BudgetCycle,
  diaInicio: number
): BudgetCycle {
  // Avanzar un mes desde la fecha de inicio del ciclo actual
  const nextDate = new Date(currentCycle.startDate)
  nextDate.setMonth(nextDate.getMonth() + 1)

  return getCurrentBudgetCycle(diaInicio, nextDate)
}
