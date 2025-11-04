import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12 mt-8">
          <div className="inline-block mb-6">
            <div className="glass-strong rounded-2xl p-8 shadow-2xl">
              <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Kasa Family Management
              </h1>
              <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
                Comprehensive financial management system with age-based payment plans and lifecycle event tracking
              </p>
              <Link 
                href="/dashboard"
                className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                Go to Dashboard →
              </Link>
            </div>
          </div>
        </div>
        
        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <FeatureCard
            title="Payment Plans"
            description="Age-based payment plans: 0-4 ($1,200), 5-8 ($1,500), 9-16 ($1,800), 17+ ($2,500)"
            icon="💰"
            gradient="from-blue-500 to-cyan-500"
          />
          <FeatureCard
            title="Lifecycle Events"
            description="Track Chasena ($12,180), Bar Mitzvah ($1,800), Birth Boy/Girl ($500)"
            icon="🎉"
            gradient="from-purple-500 to-pink-500"
          />
          <FeatureCard
            title="Yearly Calculations"
            description="Automatic calculation of income, expenses, and balances per year"
            icon="📊"
            gradient="from-green-500 to-emerald-500"
          />
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ title, description, icon, gradient }: { title: string; description: string; icon: string; gradient: string }) {
  return (
    <div className="glass-strong rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-white/30">
      <div className={`text-5xl mb-4 bg-gradient-to-br ${gradient} bg-clip-text text-transparent inline-block`}>
        {icon}
      </div>
      <h2 className="text-xl font-semibold mb-3 text-gray-800">{title}</h2>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

