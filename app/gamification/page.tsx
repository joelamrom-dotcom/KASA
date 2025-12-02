'use client'

import { useState, useEffect } from 'react'
import { TrophyIcon, StarIcon, ChartBarIcon } from '@heroicons/react/24/outline'

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  points: number
  category: string
  progress?: number
}

export default function GamificationPage() {
  const [score, setScore] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchScore()
    fetchLeaderboard()
  }, [])

  const fetchScore = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/gamification/score', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setScore(data)
      }
    } catch (error) {
      console.error('Error fetching score:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/kasa/gamification/leaderboard?limit=10', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setLeaderboard(data.leaderboard || [])
        setCurrentUserRank(data.currentUserRank)
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Gamification & Achievements
        </h1>

        {/* User Score Card */}
        {score && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Points</p>
                  <p className="text-3xl font-bold">{score.totalPoints}</p>
                </div>
                <TrophyIcon className="h-12 w-12 text-yellow-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Level</p>
                  <p className="text-3xl font-bold">{score.level}</p>
                </div>
                <StarIcon className="h-12 w-12 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {score.pointsForNext} points to next level
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Engagement</p>
                  <p className="text-3xl font-bold">{score.engagementScore}%</p>
                </div>
                <ChartBarIcon className="h-12 w-12 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Badges Earned</p>
                  <p className="text-3xl font-bold">{score.earnedBadges?.length || 0}</p>
                </div>
                <div className="text-4xl">🏆</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Earned Badges */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Earned Badges</h2>
            <div className="grid grid-cols-2 gap-4">
              {score?.earnedBadges?.map((badge: Badge) => (
                <div
                  key={badge.id}
                  className="border-2 border-yellow-400 rounded-lg p-4 bg-yellow-50"
                >
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <h3 className="font-semibold">{badge.name}</h3>
                  <p className="text-sm text-gray-600">{badge.description}</p>
                  <p className="text-xs text-gray-500 mt-2">+{badge.points} points</p>
                </div>
              ))}
              {(!score?.earnedBadges || score.earnedBadges.length === 0) && (
                <p className="text-gray-500 col-span-2">No badges earned yet. Keep using the platform!</p>
              )}
            </div>
          </div>

          {/* Available Badges */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Available Badges</h2>
            <div className="grid grid-cols-2 gap-4">
              {score?.availableBadges?.map((badge: Badge) => (
                <div
                  key={badge.id}
                  className="border rounded-lg p-4 bg-gray-50"
                >
                  <div className="text-4xl mb-2 opacity-50">{badge.icon}</div>
                  <h3 className="font-semibold">{badge.name}</h3>
                  <p className="text-sm text-gray-600">{badge.description}</p>
                  {badge.progress !== undefined && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${badge.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{Math.round(badge.progress)}%</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
          {currentUserRank && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm">
                Your rank: <span className="font-bold">#{currentUserRank}</span>
              </p>
            </div>
          )}
          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.userId}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index < 3 ? 'bg-yellow-50 border-2 border-yellow-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 text-center font-bold">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${entry.rank}`}
                  </div>
                  <div>
                    <p className="font-semibold">{entry.name}</p>
                    <p className="text-sm text-gray-500">{entry.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{entry.totalPoints} pts</p>
                  <p className="text-sm text-gray-500">Level {entry.level}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

