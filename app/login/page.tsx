'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { EyeIcon, EyeSlashIcon, XMarkIcon, UserIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { ChartBarIcon } from '@heroicons/react/24/solid'

function LoginForm() {
  const searchParams = useSearchParams()
  const [loginType, setLoginType] = useState<'admin' | 'family'>('admin')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    phoneNumber: '',
  })

  // Check for OAuth errors, signup success, or reset success in URL
  useEffect(() => {
    const oauthError = searchParams?.get('error')
    const signupSuccess = searchParams?.get('signup')
    const resetSuccess = searchParams?.get('reset')
    
    if (oauthError) {
      const errorMessage = decodeURIComponent(oauthError)
      setError(errorMessage)
      // Auto-dismiss error after 8 seconds
      const timer = setTimeout(() => setError(''), 8000)
      return () => clearTimeout(timer)
    } else if (signupSuccess === 'success') {
      setSuccess('Account created successfully! Please log in.')
    } else if (resetSuccess === 'success') {
      setSuccess('Password reset successfully! Please log in.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const endpoint = loginType === 'family' ? '/api/auth/family-login' : '/api/auth/login'
      const body = loginType === 'family' 
        ? { email: formData.email, phoneNumber: formData.phoneNumber }
        : { email: formData.email, password: formData.password }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (response.ok) {
        // Clear any old/stale tokens first to prevent conflicts
        // Clear localStorage
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        
        // Clear ALL possible cookie variations (different paths, domains)
        const cookiePaths = ['/', '/api', '/users', '/dashboard']
        const domains = [window.location.hostname, `.${window.location.hostname}`]
        cookiePaths.forEach(path => {
          domains.forEach(domain => {
            document.cookie = `token=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${domain}`
          })
          document.cookie = `token=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        })
        
        // Validate that the returned user email matches what we logged in with
        const loginEmail = formData.email.toLowerCase().trim()
        const returnedEmail = data.user?.email?.toLowerCase().trim()
        
        if (returnedEmail && returnedEmail !== loginEmail) {
          console.warn(`Email mismatch: logged in with ${loginEmail}, but token has ${returnedEmail}`)
          setError('Authentication error: Email mismatch. Please try logging in again.')
          return
        }
        
        console.log('✅ Login successful - Storing new token:', data.token.substring(0, 20) + '...')
        console.log('✅ User email in response:', returnedEmail)
        console.log('✅ User role in response:', data.user?.role)
        
        setSuccess('Login successful! Redirecting...')
        
        // Store new token and user data
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('token', data.token)
        
        // Set cookie for server-side access
        // For Vercel, don't set domain - let browser handle it
        const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')
        const isHttps = window.location.protocol === 'https:'
        
        // Set cookie with appropriate attributes
        // Use Secure only in production with HTTPS
        if (isProduction && isHttps) {
          document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax; Secure`
        } else {
          // For local dev or HTTP, don't use Secure
          document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
        }
        
        // Verify token was stored
        const storedToken = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')
        const cookieSet = document.cookie.includes('token=')
        console.log('✅ Token stored in localStorage:', storedToken ? 'Yes' : 'No')
        console.log('✅ User stored in localStorage:', storedUser ? 'Yes' : 'No')
        console.log('✅ Cookie set:', cookieSet ? 'Yes' : 'No')
        
        // Get redirect URL or default to dashboard
        const redirectUrl = searchParams?.get('redirect') || '/'
        
        // Use window.location.href instead of replace to ensure full page reload
        // Longer delay to ensure cookie is set and middleware can read it
        setTimeout(() => {
          console.log('🔄 Redirecting to:', redirectUrl)
          // Force full page reload to ensure middleware sees the cookie
          window.location.href = redirectUrl
        }, 1000)
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (error) {
      setError('An error occurred during login')
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Login Form (60%) */}
      <div className="w-full lg:w-3/5 flex flex-col justify-center bg-white px-8 lg:px-16 py-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative z-10 max-w-md mx-auto w-full">
          {/* Logo */}
          <div className="flex items-center justify-center mb-12">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <ChartBarIcon className="h-7 w-7 text-white" />
            </div>
            <span className="ml-3 text-2xl font-bold text-gray-900">AI SaaS Platform</span>
          </div>

          {/* Login Form Card with Glass Effect */}
          <div className="glass-panel rounded-xl p-8 shadow-2xl animate-scale-in border border-white/20 backdrop-blur-xl bg-white/80">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-sm text-gray-600">
                Sign in to continue to your account
              </p>
            </div>
            
            {error && (
              <div className="glass-panel bg-red-500/10 border border-red-500/30 text-red-700 px-4 py-3 rounded-lg mb-4 animate-slide-in backdrop-blur-sm flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium text-sm">{error}</p>
                  {error.includes('No account found') && (
                    <Link 
                      href="/signup" 
                      className="text-xs mt-2 inline-block text-blue-600 hover:text-blue-700 underline font-medium"
                    >
                      Create an account instead →
                    </Link>
                  )}
                </div>
                <button
                  onClick={() => setError('')}
                  className="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            )}
            
            {success && (
              <div className="glass-panel bg-green-500/10 border border-green-500/30 text-green-700 px-4 py-3 rounded-lg mb-4 animate-slide-in backdrop-blur-sm">
                {success}
              </div>
            )}
            
            {/* Login Type Toggle */}
            <div className="mb-6">
              <div className="flex rounded-lg bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setLoginType('admin')
                    setError('')
                    setFormData({ email: '', password: '', phoneNumber: '' })
                  }}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    loginType === 'admin'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Admin Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginType('family')
                    setError('')
                    setFormData({ email: '', password: '', phoneNumber: '' })
                  }}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    loginType === 'family'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  User Login
                </button>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="glass-panel w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  {formData.email && (
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setFormData({ ...formData, email: '' })}
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
              </div>

              {/* Password Field (Admin) or Phone Number Field (Family) */}
              {loginType === 'admin' ? (
                <>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        className="glass-panel w-full px-4 py-3 rounded-lg border border-gray-200/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 pr-12 bg-white/50 backdrop-blur-sm"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                        Remember me
                      </label>
                    </div>
                    <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                      Forgot Your Password?
                    </Link>
                  </div>
                </>
              ) : (
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      autoComplete="tel"
                      required
                      className="glass-panel w-full pl-10 pr-10 py-3 rounded-lg border border-gray-200/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                      placeholder="(555) 123-4567"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                    {formData.phoneNumber && (
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setFormData({ ...formData, phoneNumber: '' })}
                      >
                        <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Use any phone number on file for your account
                  </p>
                </div>
              )}

              {/* Log In Button */}
              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Log In'}
              </button>

              {/* Google Login - Only show for Admin login */}
              {loginType === 'admin' && (
                <>
                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">or</span>
                    </div>
                  </div>

                  {/* Sign In with Google Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsGoogleLoading(true)
                      setError('')
                      window.location.href = '/api/auth/sso/google'
                    }}
                    disabled={isGoogleLoading || isLoading}
                    className="w-full glass-panel bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg border border-gray-300 transition-all duration-300 flex items-center justify-center shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed relative"
                  >
                    {isGoogleLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2"></div>
                        <span>Redirecting to Google...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        Sign in with Google
                      </>
                    )}
                  </button>

                  {/* Sign In with Microsoft Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsGoogleLoading(true)
                      setError('')
                      window.location.href = '/api/auth/sso/microsoft'
                    }}
                    disabled={isGoogleLoading || isLoading}
                    className="w-full glass-panel bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-lg border border-gray-300 transition-all duration-300 flex items-center justify-center shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed relative mt-2"
                  >
                    {isGoogleLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2"></div>
                        <span>Redirecting...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5 mr-2" viewBox="0 0 23 23" fill="none">
                          <path d="M11.4 11.4H22V22H11.4V11.4Z" fill="#F25022"/>
                          <path d="M0 11.4H11.4V22H0V11.4Z" fill="#7FBA00"/>
                          <path d="M0 0H11.4V11.4H0V0Z" fill="#00A4EF"/>
                          <path d="M11.4 0H22V11.4H11.4V0Z" fill="#FFB900"/>
                        </svg>
                        Sign in with Microsoft
                      </>
                    )}
                  </button>

                  {/* Magic Link Option */}
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!formData.email) {
                          setError('Please enter your email first')
                          return
                        }
                        setIsLoading(true)
                        setError('')
                        try {
                          const res = await fetch('/api/auth/magic-link/send', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: formData.email })
                          })
                          const data = await res.json()
                          if (res.ok) {
                            setSuccess('Magic link sent! Check your email.')
                          } else {
                            setError(data.error || 'Failed to send magic link')
                          }
                        } catch (error) {
                          setError('Failed to send magic link')
                        } finally {
                          setIsLoading(false)
                        }
                      }}
                      disabled={isLoading || !formData.email}
                      className="text-sm text-blue-600 hover:text-blue-700 underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send me a magic link instead
                    </button>
                  </div>
                </>
              )}

              {/* New User Section */}
              <div className="text-center pt-4">
                <span className="text-sm text-gray-600">Don't have an account? </span>
                <Link href="/signup" className="text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50 transition-all duration-300 inline-block">
                  Sign Up
                </Link>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-500">
            © 2025 AI SaaS Platform. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Panel - Promotional (40%) */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 p-12 relative overflow-hidden">
        {/* Geometric Pattern Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}></div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>

        <div className="relative z-10 flex flex-col h-full">
          {/* Brand Name */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">AI SaaS Platform</h1>
            <p className="text-blue-200 text-sm">Business Management System</p>
          </div>

          {/* Promotional Content */}
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              Manage Your Business Operations
            </h2>
            <p className="text-blue-100 text-lg mb-8 leading-relaxed">
              Streamline your workflow, automate processes, generate insights, and stay organized 
              with our comprehensive business management platform. Everything you need to manage 
              your business operations, data, and analytics in one powerful system.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
