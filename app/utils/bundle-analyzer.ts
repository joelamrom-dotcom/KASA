/**
 * Bundle size analyzer
 * Helps identify and reduce bundle size
 */

interface BundleInfo {
  name: string
  size: number
  gzippedSize: number
}

/**
 * Analyze bundle size
 */
export function analyzeBundle(bundle: any): BundleInfo[] {
  const modules: BundleInfo[] = []

  if (bundle && bundle.modules) {
    Object.entries(bundle.modules).forEach(([name, module]: [string, any]) => {
      modules.push({
        name,
        size: module.size || 0,
        gzippedSize: module.gzippedSize || 0,
      })
    })
  }

  return modules.sort((a, b) => b.size - a.size)
}

/**
 * Get bundle size recommendations
 */
export function getBundleRecommendations(modules: BundleInfo[]): string[] {
  const recommendations: string[] = []
  const largeModules = modules.filter((m) => m.size > 100000) // > 100KB

  if (largeModules.length > 0) {
    recommendations.push(
      `Consider code-splitting for: ${largeModules.map((m) => m.name).join(', ')}`
    )
  }

  const totalSize = modules.reduce((sum, m) => sum + m.size, 0)
  if (totalSize > 500000) {
    recommendations.push('Total bundle size exceeds 500KB. Consider lazy loading.')
  }

  return recommendations
}

