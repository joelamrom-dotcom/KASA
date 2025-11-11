import { HDate } from '@hebcal/core'

/**
 * Convert Gregorian date to Hebrew date string
 * @param gregorianDate Gregorian date object
 * @returns Hebrew date string in format "DD MMMM YYYY"
 */
export function convertToHebrewDate(gregorianDate: Date): string {
  try {
    const hdate = new HDate(gregorianDate)
    const day = hdate.getDate()
    const month = hdate.getMonth()
    const year = hdate.getFullYear()
    
    const monthNames: Record<number, string> = {
      1: 'Nisan', 2: 'Iyar', 3: 'Sivan', 4: 'Tammuz', 5: 'Av', 6: 'Elul',
      7: 'Tishrei', 8: 'Cheshvan', 9: 'Kislev', 10: 'Tevet', 11: 'Shevat', 12: 'Adar'
    }
    
    const monthName = monthNames[month] || ''
    return `${day} ${monthName} ${year}`
  } catch (error) {
    console.error('Error converting to Hebrew date:', error)
    return ''
  }
}

/**
 * Calculate Hebrew age from Hebrew birth date
 * @param hebrewBirthDateString Format: "DD MMMM YYYY" (e.g., "15 Tishrei 5785")
 * @returns Hebrew age in years
 */
export function calculateHebrewAge(hebrewBirthDateString: string): number | null {
  try {
    const parts = hebrewBirthDateString.trim().split(' ')
    if (parts.length < 3) return null

    const day = parseInt(parts[0])
    const monthName = parts[1]
    const year = parseInt(parts[2])

    if (isNaN(day) || isNaN(year)) return null

    // Convert month name to Hebrew month number
    const monthMap: Record<string, number> = {
      'Nisan': 1, 'Iyar': 2, 'Sivan': 3, 'Tammuz': 4,
      'Av': 5, 'Elul': 6, 'Tishrei': 7, 'Cheshvan': 8,
      'Kislev': 9, 'Tevet': 10, 'Shevat': 11, 'Adar': 12,
      'Adar I': 12, 'Adar II': 13
    }

    const month = monthMap[monthName]
    if (!month) return null

    const birthDate = new HDate(day, month, year)
    const today = new HDate()
    
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  } catch (error) {
    console.error('Error calculating Hebrew age:', error)
    return null
  }
}

/**
 * Calculate Bar/Bat Mitzvah date (13th Hebrew birthday)
 * @param hebrewBirthDateString Format: "DD MMMM YYYY"
 * @returns Gregorian date of 13th Hebrew birthday
 */
export function calculateBarMitzvahDate(hebrewBirthDateString: string): Date | null {
  try {
    const parts = hebrewBirthDateString.trim().split(' ')
    if (parts.length < 3) return null

    const day = parseInt(parts[0])
    const monthName = parts[1]
    const year = parseInt(parts[2])

    if (isNaN(day) || isNaN(year)) return null

    const monthMap: Record<string, number> = {
      'Nisan': 1, 'Iyar': 2, 'Sivan': 3, 'Tammuz': 4,
      'Av': 5, 'Elul': 6, 'Tishrei': 7, 'Cheshvan': 8,
      'Kislev': 9, 'Tevet': 10, 'Shevat': 11, 'Adar': 12,
      'Adar I': 12, 'Adar II': 13
    }

    const month = monthMap[monthName]
    if (!month) return null

    // Calculate 13th Hebrew birthday
    const barMitzvahHebrewYear = year + 13
    const barMitzvahHebrewDate = new HDate(day, month, barMitzvahHebrewYear)
    
    // Convert Hebrew date to Gregorian date
    const gregorianDate = barMitzvahHebrewDate.greg()
    
    return gregorianDate
  } catch (error) {
    console.error('Error calculating Bar Mitzvah date:', error)
    return null
  }
}

/**
 * Check if a child has turned 13 based on Hebrew date
 * @param hebrewBirthDateString Format: "DD MMMM YYYY"
 * @returns true if child is 13 or older in Hebrew years
 */
export function hasReachedBarMitzvahAge(hebrewBirthDateString: string): boolean {
  const age = calculateHebrewAge(hebrewBirthDateString)
  return age !== null && age >= 13
}

/**
 * Format Hebrew date string for display
 * @param hebrewBirthDateString Format: "DD MMMM YYYY"
 * @returns Formatted string
 */
export function formatHebrewDate(hebrewBirthDateString: string): string {
  return hebrewBirthDateString.trim()
}

