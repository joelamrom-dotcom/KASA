// Client-side authentication utilities

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'super_admin' | 'admin' | 'user' | 'viewer' | 'family'
  isActive: boolean
  emailVerified: boolean
  familyId?: string
  familyName?: string
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null
  const userStr = localStorage.getItem('user')
  if (!userStr) return null
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return !!getToken() && !!getUser()
}

export function logout(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  // Clear cookie
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  window.location.href = '/login'
}

export function setAuth(token: string, user: User): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
  // Also set cookie for server-side access
  document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}` // 7 days
}

