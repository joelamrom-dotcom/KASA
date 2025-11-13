/**
 * Machine Learning Analysis for Future Trends
 * TypeScript implementation of the Python analysis logic
 */

interface AnalysisData {
  families: Array<{
    _id: string
    weddingDate: string | null
    name?: string
    createdAt?: string | null
  }>
  members: Array<{
    _id: string
    familyId: string
    birthDate: string | null
    weddingDate: string | null
    gender?: string
  }>
  lifecycleEvents?: Array<{
    _id: string
    eventType: string
    eventDate: string | null
    year?: number
  }>
}

interface Prediction {
  predicted: number
  range_min: number
  range_max: number
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Simple linear regression for trend prediction
 */
function linearRegression(x: number[], y: number[]): { slope: number; intercept: number } {
  const n = x.length
  if (n < 2) {
    return { slope: 0, intercept: y.length > 0 ? y[0] : 0 }
  }

  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  return { slope, intercept }
}

/**
 * Polynomial regression (degree 2) for trend prediction
 */
function polynomialRegression(x: number[], y: number[]): (x: number) => number {
  const n = x.length
  if (n < 3) {
    // Fallback to linear if not enough data
    const { slope, intercept } = linearRegression(x, y)
    return (x: number) => slope * x + intercept
  }

  // Simple polynomial regression (degree 2): y = ax² + bx + c
  // Using least squares approximation
  const sumX = x.reduce((a, b) => a + b, 0)
  const sumY = y.reduce((a, b) => a + b, 0)
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
  const sumX3 = x.reduce((sum, xi) => sum + xi * xi * xi, 0)
  const sumX4 = x.reduce((sum, xi) => sum + xi * xi * xi * xi, 0)
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
  const sumX2Y = x.reduce((sum, xi, i) => sum + xi * xi * y[i], 0)

  // Solve system: [n, sumX, sumX2] [c]   [sumY]
  //               [sumX, sumX2, sumX3] [b] = [sumXY]
  //               [sumX2, sumX3, sumX4] [a] [sumX2Y]
  
  // Simplified: use normal equations
  const det = n * (sumX2 * sumX4 - sumX3 * sumX3) - sumX * (sumX * sumX4 - sumX2 * sumX3) + sumX2 * (sumX * sumX3 - sumX2 * sumX2)
  
  if (Math.abs(det) < 1e-10) {
    // Singular matrix, fallback to linear
    const { slope, intercept } = linearRegression(x, y)
    return (x: number) => slope * x + intercept
  }

  const c = (sumY * (sumX2 * sumX4 - sumX3 * sumX3) - sumXY * (sumX * sumX4 - sumX2 * sumX3) + sumX2Y * (sumX * sumX3 - sumX2 * sumX2)) / det
  const b = (n * (sumXY * sumX4 - sumX2Y * sumX3) - sumX * (sumY * sumX4 - sumX2Y * sumX2) + sumX2 * (sumY * sumX3 - sumXY * sumX2)) / det
  const a = (n * (sumX2 * sumX2Y - sumX3 * sumXY) - sumX * (sumX * sumX2Y - sumX2 * sumXY) + sumX2 * (sumX * sumXY - sumX2 * sumY)) / det

  return (x: number) => a * x * x + b * x + c
}

/**
 * Predict future values using ML with confidence intervals
 */
function predictWithML(
  years: number[],
  values: number[],
  futureYears: number[]
): { predicted: number[]; lower: number[]; upper: number[] } {
  if (years.length < 2 || values.length < 2) {
    // Not enough data for ML, use simple average
    const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
    return {
      predicted: futureYears.map(() => Math.max(0, avg)),
      lower: futureYears.map(() => Math.max(0, avg * 0.8)),
      upper: futureYears.map(() => avg * 1.2)
    }
  }

  try {
    // Use polynomial regression for trend analysis
    const model = polynomialRegression(years, values)
    
    // Predict future years
    const predicted = futureYears.map(year => Math.max(0, model(year)))
    
    // Calculate confidence intervals with reasonable bounds
    const residuals = years.map((year, i) => values[i] - model(year))
    const meanResidual = residuals.reduce((a, b) => a + b, 0) / residuals.length
    const variance = residuals.reduce((sum, r) => sum + Math.pow(r - meanResidual, 2), 0) / residuals.length
    const stdError = Math.sqrt(variance)
    
    // Cap stdError to reasonable value (max 50% of average value)
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length
    const maxStdError = Math.max(avgValue * 0.5, 1) // At least 1, or 50% of average
    const cappedStdError = Math.min(stdError, maxStdError)
    
    // 95% confidence interval (1.96 standard deviations) with reasonable bounds
    const lower = predicted.map(p => Math.max(0, p - 1.96 * cappedStdError))
    const upper = predicted.map(p => Math.min(p + 1.96 * cappedStdError, p * 2)) // Cap upper at 2x predicted
    
    return { predicted, lower, upper }
  } catch (error) {
    // Fallback to simple average
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    return {
      predicted: futureYears.map(() => Math.max(0, avg)),
      lower: futureYears.map(() => Math.max(0, avg * 0.8)),
      upper: futureYears.map(() => avg * 1.2)
    }
  }
}

/**
 * Analyze and predict number of children per year
 */
export function analyzeChildrenByYear(data: AnalysisData, yearsAhead: number = 10) {
  const currentYear = new Date().getFullYear()
  const historicalChildren: { [year: number]: number } = {}
  const historicalBirths: { [year: number]: number } = {}

  // Count births by year
  data.members.forEach(member => {
    if (member.birthDate) {
      try {
        const birthDate = new Date(member.birthDate)
        const birthYear = birthDate.getFullYear()
        historicalBirths[birthYear] = (historicalBirths[birthYear] || 0) + 1
      } catch {}
    }
  })

  // Count total children per year (children alive in that year)
  for (let year = currentYear - 10; year <= currentYear; year++) {
    let count = 0
    data.members.forEach(member => {
      if (member.birthDate) {
        try {
          const birthDate = new Date(member.birthDate)
          const referenceDate = new Date(year, 11, 31)
          if (birthDate <= referenceDate) {
            const weddingDate = member.weddingDate ? new Date(member.weddingDate) : null
            if (!weddingDate || weddingDate.getFullYear() > year) {
              count++
            }
          }
        } catch {}
      }
    })
    historicalChildren[year] = count
  }

  // Prepare data for ML
  const historicalYears = Object.keys(historicalChildren).map(Number).sort((a, b) => a - b)
  const historicalValues = historicalYears.map(year => historicalChildren[year])

  // Calculate statistics
  const avgChildren = historicalValues.length > 0
    ? historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length
    : 0
  const sortedValues = [...historicalValues].sort((a, b) => a - b)
  const medianChildren = sortedValues.length > 0
    ? sortedValues[Math.floor(sortedValues.length / 2)]
    : 0
  const minChildren = historicalValues.length > 0 ? Math.min(...historicalValues) : 0
  const maxChildren = historicalValues.length > 0 ? Math.max(...historicalValues) : 0

  // Use ML for predictions
  const futureYears = Array.from({ length: yearsAhead }, (_, i) => currentYear + i + 1)
  const { predicted, lower, upper } = predictWithML(historicalYears, historicalValues, futureYears)

  // Determine trend
  let trend: 'growing' | 'declining' | 'stable' = 'stable'
  if (historicalValues.length >= 3) {
    const recentAvg = historicalValues.slice(-3).reduce((a, b) => a + b, 0) / 3
    const earlyAvg = historicalValues.slice(0, 3).reduce((a, b) => a + b, 0) / 3
    if (recentAvg > earlyAvg * 1.1) {
      trend = 'growing'
    } else if (recentAvg < earlyAvg * 0.9) {
      trend = 'declining'
    }
  }

  // Create predictions dictionary
  const predictions: { [year: number]: Prediction } = {}
  futureYears.forEach((year, i) => {
    const confidence: 'high' | 'medium' | 'low' = historicalValues.length >= 5 ? 'high' : historicalValues.length >= 3 ? 'medium' : 'low'
    predictions[year] = {
      predicted: Math.round(predicted[i]),
      range_min: Math.round(lower[i]),
      range_max: Math.round(upper[i]),
      confidence
    }
  })

  return {
    historical: historicalChildren,
    historical_births: historicalBirths,
    statistics: {
      average: avgChildren,
      median: medianChildren,
      min: minChildren,
      max: maxChildren,
      trend
    },
    predictions,
    ml_used: true
  }
}

/**
 * Analyze and predict weddings per year
 */
export function analyzeWeddingsByYear(data: AnalysisData, yearsAhead: number = 10) {
  const currentYear = new Date().getFullYear()
  const historicalWeddings: { [year: number]: number } = {}

  // Count family weddings
  data.families.forEach(family => {
    if (family.weddingDate) {
      try {
        const weddingDate = new Date(family.weddingDate)
        const year = weddingDate.getFullYear()
        historicalWeddings[year] = (historicalWeddings[year] || 0) + 1
      } catch {}
    }
  })

  // Count member weddings
  data.members.forEach(member => {
    if (member.weddingDate) {
      try {
        const weddingDate = new Date(member.weddingDate)
        const year = weddingDate.getFullYear()
        historicalWeddings[year] = (historicalWeddings[year] || 0) + 1
      } catch {}
    }
  })

  // Prepare data for ML
  const historicalYears = Object.keys(historicalWeddings).map(Number).sort((a, b) => a - b)
  const historicalValues = historicalYears.map(year => historicalWeddings[year] || 0)

  // Calculate statistics
  const avgWeddings = historicalValues.length > 0
    ? historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length
    : 0
  const sortedValues = [...historicalValues].sort((a, b) => a - b)
  const medianWeddings = sortedValues.length > 0
    ? sortedValues[Math.floor(sortedValues.length / 2)]
    : 0

  // Use ML for predictions
  const futureYears = Array.from({ length: yearsAhead }, (_, i) => currentYear + i + 1)
  const { predicted, lower, upper } = predictWithML(historicalYears, historicalValues, futureYears)

  // Create predictions dictionary
  const predictions: { [year: number]: Prediction } = {}
  futureYears.forEach((year, i) => {
    const confidence: 'high' | 'medium' | 'low' = historicalValues.length >= 5 && historicalValues.reduce((a, b) => a + b, 0) > 0
      ? 'high'
      : historicalValues.length >= 3
      ? 'medium'
      : 'low'
    predictions[year] = {
      predicted: Math.round(predicted[i]),
      range_min: Math.round(lower[i]),
      range_max: Math.round(upper[i]),
      confidence
    }
  })

  return {
    historical: historicalWeddings,
    statistics: {
      average: avgWeddings,
      median: medianWeddings,
      total_historical: historicalValues.reduce((a, b) => a + b, 0)
    },
    predictions,
    ml_used: true
  }
}

/**
 * Analyze family stability and growth patterns
 */
export function analyzeFamilyStability(data: AnalysisData, yearsAhead: number = 10) {
  const currentYear = new Date().getFullYear()
  
  // Count families by creation year
  const familiesByYear: { [year: number]: number } = {}
  data.families.forEach(family => {
    if (family.weddingDate) {
      try {
        const weddingDate = new Date(family.weddingDate)
        const year = weddingDate.getFullYear()
        familiesByYear[year] = (familiesByYear[year] || 0) + 1
      } catch {}
    }
  })

  // Average children per family
  const childrenPerFamily = data.families.map(family => {
    return data.members.filter(m => m.familyId === family._id).length
  })
  const avgChildrenPerFamily = childrenPerFamily.length > 0
    ? childrenPerFamily.reduce((a, b) => a + b, 0) / childrenPerFamily.length
    : 0

  // Use ML to predict new families per year
  const historicalYears = Array.from({ length: 11 }, (_, i) => currentYear - 10 + i)
  const historicalFamilyCounts = historicalYears.map(year => familiesByYear[year] || 0)

  const futureYears = Array.from({ length: yearsAhead }, (_, i) => currentYear + i + 1)
  const { predicted: predictedNewPerYear } = predictWithML(historicalYears, historicalFamilyCounts, futureYears)

  // Predictions
  const predictions: { [year: number]: any } = {}
  const totalFamilies = data.families.length
  let cumulativeNew = 0

  futureYears.forEach((year, i) => {
    const newThisYear = Math.round(predictedNewPerYear[i])
    cumulativeNew += newThisYear
    const predictedTotal = totalFamilies + cumulativeNew

    // Calculate stability score
    const stabilityScore = avgChildrenPerFamily >= 2 && newThisYear > 0
      ? 'high'
      : avgChildrenPerFamily >= 1
      ? 'medium'
      : 'low'

    predictions[year] = {
      total_families: predictedTotal,
      new_families: newThisYear,
      cumulative_new: cumulativeNew,
      avg_children_per_family: Math.round(avgChildrenPerFamily * 10) / 10,
      stability_score: stabilityScore,
      growth_rate: totalFamilies > 0
        ? Math.round((newThisYear / totalFamilies * 100) * 10) / 10
        : 0
    }
  })

  return {
    current_stats: {
      total_families: data.families.length,
      total_members: data.members.length,
      avg_children_per_family: Math.round(avgChildrenPerFamily * 100) / 100,
      families_with_children: data.families.filter(f =>
        data.members.some(m => m.familyId === f._id)
      ).length
    },
    historical_families: familiesByYear,
    predictions,
    ml_used: true
  }
}

/**
 * Main analysis function
 */
export function performAnalysis(data: AnalysisData, yearsAhead: number = 10) {
  const childrenAnalysis = analyzeChildrenByYear(data, yearsAhead)
  const weddingsAnalysis = analyzeWeddingsByYear(data, yearsAhead)
  const stabilityAnalysis = analyzeFamilyStability(data, yearsAhead)

  return {
    analysis_date: new Date().toISOString(),
    years_ahead: yearsAhead,
    ml_used: true,
    analysis_system: 'TypeScript (ML)',
    children_analysis: childrenAnalysis,
    weddings_analysis: weddingsAnalysis,
    stability_analysis: stabilityAnalysis
  }
}

