'use client'

import Link from 'next/link'
import { ArrowRightIcon, ChartBarIcon, CogIcon, UserGroupIcon, SparklesIcon } from '@heroicons/react/24/outline'
import ScreenshotPreview from './components/ScreenshotPreview'
import Card3D from './components/Card3D'
import Image3D from './components/Image3D'

export default function HomePage() {
  return (
    <div className="min-h-screen animate-fade-in lg:pl-0">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center animate-fade-in">
            <div className="inline-block mb-6">
              <div className="glass-panel px-6 py-2 rounded-full flex items-center space-x-2 animate-scale-in">
                <SparklesIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI-Powered Platform</span>
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Build Amazing SaaS
              </span>
              <br />
              <span className="text-gray-900 dark:text-gray-100">Platforms</span>
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl md:text-2xl text-gray-600 dark:text-gray-300">
              Modern design, powerful features, and AI-driven insights. Everything you need to build and scale your SaaS application.
            </p>
            <div className="mt-10 flex justify-center space-x-4 animate-slide-in">
              <Link href="/register" className="btn-primary px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl">
                Start Free Trial
                <ArrowRightIcon className="ml-2 h-5 w-5 inline" />
              </Link>
              <Link href="/login" className="glass-button px-8 py-4 text-lg font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Screenshot Previews */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-4">
            Platform Overview
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Experience our modern interface with glass effects and smooth animations
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="animate-fade-in">
            <Image3D
              alt="Dashboard Analytics"
              width={600}
              height={400}
              className="w-full"
              gradient="from-blue-500 via-cyan-500 to-blue-600"
            />
            <div className="mt-4 text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Dashboard Analytics</h3>
              <p className="text-gray-600 dark:text-gray-400">Real-time insights and metrics</p>
            </div>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <Image3D
              alt="User Management"
              width={600}
              height={400}
              className="w-full"
              gradient="from-purple-500 via-pink-500 to-purple-600"
            />
            <div className="mt-4 text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">User Management</h3>
              <p className="text-gray-600 dark:text-gray-400">Comprehensive user administration</p>
            </div>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Image3D
              alt="Family System"
              width={600}
              height={400}
              className="w-full"
              gradient="from-green-500 via-emerald-500 to-green-600"
            />
            <div className="mt-4 text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Family System</h3>
              <p className="text-gray-600 dark:text-gray-400">Advanced family case management</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-4">
            Powerful Features
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Everything you need to build and scale modern SaaS applications
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: ChartBarIcon,
              title: 'Analytics Dashboard',
              description: 'Get real-time insights into your application performance and user behavior with beautiful charts and metrics.',
              gradient: 'from-blue-500/20 to-cyan-500/20',
              delay: 0
            },
            {
              icon: CogIcon,
              title: 'AI Automation',
              description: 'Automate repetitive tasks and workflows with intelligent AI assistance that learns from your patterns.',
              gradient: 'from-purple-500/20 to-pink-500/20',
              delay: 0.1
            },
            {
              icon: UserGroupIcon,
              title: 'Team Collaboration',
              description: 'Work together seamlessly with built-in collaboration tools, role-based permissions, and real-time updates.',
              gradient: 'from-green-500/20 to-blue-500/20',
              delay: 0.2
            },
          ].map((feature, index) => (
            <Card3D key={feature.title} gradient={feature.gradient} delay={feature.delay}>
              <div className="text-center">
                <div className={`inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br ${feature.gradient.replace('/20', '')} items-center justify-center shadow-lg mb-6 animate-float`} style={{ animationDelay: `${feature.delay}s` }}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            </Card3D>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card3D gradient="from-blue-500/30 to-purple-500/30" className="text-center p-12">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Start your free trial today and experience the future of SaaS platforms.
          </p>
          <Link href="/register" className="btn-primary px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl inline-flex items-center">
            Get Started
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </Card3D>
      </div>
    </div>
  )
}
