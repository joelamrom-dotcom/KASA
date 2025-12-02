/**
 * Static Site Generation (SSG) utilities
 * Pre-render pages at build time for instant loading
 */

export const staticGenerationConfig = {
  // Revalidate every 60 seconds
  revalidate: 60,
  // Generate static params
  generateStaticParams: true,
}

/**
 * Get static generation config for a page
 */
export function getStaticGenerationConfig(revalidateSeconds: number = 60) {
  return {
    revalidate: revalidateSeconds,
    generateStaticParams: true,
  }
}

/**
 * Generate static paths for dynamic routes
 */
export async function generateStaticPaths() {
  // This would be implemented per route
  return []
}

