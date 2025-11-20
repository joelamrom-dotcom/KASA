import { FilterGroup, FilterCondition } from '@/app/components/FilterBuilder'

export function applyFilters<T extends Record<string, any>>(
  items: T[],
  filterGroups: FilterGroup[]
): T[] {
  if (!filterGroups || filterGroups.length === 0) {
    return items
  }

  return items.filter((item) => {
    // Each filter group is evaluated independently
    // If ANY group matches, the item passes
    return filterGroups.some((group) => {
      // Within a group, evaluate conditions based on group logic (AND/OR)
      if (group.conditions.length === 0) {
        return true // Empty group matches everything
      }

      if (group.logic === 'AND') {
        // ALL conditions must match
        return group.conditions.every((condition) => evaluateCondition(item, condition))
      } else {
        // ANY condition must match
        return group.conditions.some((condition) => evaluateCondition(item, condition))
      }
    })
  })
}

function evaluateCondition<T extends Record<string, any>>(
  item: T,
  condition: FilterCondition
): boolean {
  const fieldValue = getNestedValue(item, condition.field)
  const operator = condition.operator
  const value = condition.value
  const value2 = condition.value2

  switch (operator) {
    case 'equals':
      if (typeof fieldValue === 'boolean') {
        return fieldValue === value
      }
      return String(fieldValue || '').toLowerCase() === String(value || '').toLowerCase()

    case 'contains':
      return String(fieldValue || '').toLowerCase().includes(String(value || '').toLowerCase())

    case 'startsWith':
      return String(fieldValue || '').toLowerCase().startsWith(String(value || '').toLowerCase())

    case 'endsWith':
      return String(fieldValue || '').toLowerCase().endsWith(String(value || '').toLowerCase())

    case 'greaterThan':
      return Number(fieldValue) > Number(value)

    case 'lessThan':
      return Number(fieldValue) < Number(value)

    case 'between':
      const numValue = Number(fieldValue)
      const numValue1 = Number(value)
      const numValue2 = Number(value2)
      return numValue >= Math.min(numValue1, numValue2) && numValue <= Math.max(numValue1, numValue2)

    case 'in':
      if (Array.isArray(value)) {
        return value.includes(String(fieldValue))
      }
      return String(fieldValue) === String(value)

    case 'notIn':
      if (Array.isArray(value)) {
        return !value.includes(String(fieldValue))
      }
      return String(fieldValue) !== String(value)

    case 'isEmpty':
      return !fieldValue || String(fieldValue).trim() === ''

    case 'isNotEmpty':
      return !!fieldValue && String(fieldValue).trim() !== ''

    default:
      return true
  }
}

function getNestedValue<T extends Record<string, any>>(obj: T, path: string): any {
  const keys = path.split('.')
  let value: any = obj

  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined
    }
    value = value[key]
  }

  return value
}

export function getFilterSummary(filterGroups: FilterGroup[]): string {
  if (!filterGroups || filterGroups.length === 0) {
    return 'No filters'
  }

  const totalConditions = filterGroups.reduce((sum, group) => sum + group.conditions.length, 0)
  return `${totalConditions} filter${totalConditions !== 1 ? 's' : ''} active`
}

