"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import DashboardHeader from "@/components/dashboard/DashboardHeader"
import { useToast } from "@/components/ui/ToastContext"

interface SavingsGoal {
  id: string
  title: string
  description: string | null
  targetAmount: number
  currentAmount: number
  targetDate: string
  priority: string
  status: string
  createdAt: string
  updatedAt: string
}

export default function Goals() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addToast } = useToast()
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    targetAmount: "",
    currentAmount: "0",
    targetDate: "",
    priority: "medium"
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (session) {
      fetchGoals()
    }
  }, [session, status, router])

  const fetchGoals = async () => {
    try {
      const response = await fetch("/api/goals")
      if (response.ok) {
        const data = await response.json()
        setGoals(data)
      }
    } catch (error) {
      console.error("Error fetching goals:", error)
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to load goals"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const method = editingGoal ? "PUT" : "POST"
      const url = editingGoal ? `/api/goals/${editingGoal.id}` : "/api/goals"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        addToast({
          type: "success",
          title: "Success",
          message: `Goal ${editingGoal ? 'updated' : 'created'} successfully`
        })
        fetchGoals()
        resetForm()
        setShowForm(false)
      } else {
        const error = await response.json()
        addToast({
          type: "error",
          title: "Error",
          message: error.error || "Failed to save goal"
        })
      }
    } catch (error) {
      console.error("Error saving goal:", error)
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to save goal"
      })
    }
  }

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal)
    setFormData({
      title: goal.title,
      description: goal.description || "",
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      targetDate: new Date(goal.targetDate).toISOString().split('T')[0],
      priority: goal.priority
    })
    setShowForm(true)
  }

  const handleDelete = async (goalId: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) {
      return
    }

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        addToast({
          type: "success",
          title: "Success",
          message: "Goal deleted successfully"
        })
        fetchGoals()
      } else {
        addToast({
          type: "error",
          title: "Error",
          message: "Failed to delete goal"
        })
      }
    } catch (error) {
      console.error("Error deleting goal:", error)
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to delete goal"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      targetAmount: "",
      currentAmount: "0",
      targetDate: "",
      priority: "medium"
    })
    setEditingGoal(null)
  }

  const handleNew = () => {
    resetForm()
    setShowForm(true)
  }

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-600"
    if (progress >= 75) return "bg-blue-600"
    if (progress >= 50) return "bg-yellow-600"
    return "bg-gray-400"
  }

  const calculateDaysRemaining = (targetDate: string) => {
    const today = new Date()
    const target = new Date(targetDate)
    const diffTime = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {session?.user && <DashboardHeader user={session.user} />}

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Loading Status */}
            <div className="mb-6 flex items-center space-x-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              <span className="text-sm text-gray-600">Loading your goals...</span>
            </div>

            {/* Header Skeleton */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
              <div>
                <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-80 animate-pulse"></div>
              </div>
              <div className="h-10 bg-indigo-200 rounded w-32 animate-pulse"></div>
            </div>

            {/* Goals Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white shadow rounded-lg overflow-hidden animate-pulse">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-full mr-3"></div>
                        <div>
                          <div className="h-5 bg-gray-200 rounded w-32 mb-1"></div>
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-gray-300 rounded-full h-3 w-1/2"></div>
                      </div>
                      <div className="flex justify-between mt-2">
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>

                    {/* Date info */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center text-sm">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2 mt-4">
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Goals Summary Skeleton */}
            <div className="mt-8 bg-white shadow rounded-lg animate-pulse">
              <div className="px-4 py-5 sm:p-6">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="text-center">
                      <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Savings Goals</h1>
              <p className="mt-2 text-sm text-gray-600">
                Track your progress towards financial goals and dreams
              </p>
            </div>
            <button
              onClick={handleNew}
              className="self-start sm:self-auto inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Add Goal
            </button>
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingGoal ? "Edit Goal" : "Add New Goal"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Goal Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Emergency Fund"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.targetAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.currentAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, currentAmount: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target Date
                      </label>
                      <input
                        type="date"
                        value={formData.targetDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      rows={3}
                      placeholder="Describe your savings goal..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false)
                        resetForm()
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                    >
                      {editingGoal ? "Update Goal" : "Add Goal"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => {
              const progress = calculateProgress(goal.currentAmount, goal.targetAmount)
              const remaining = goal.targetAmount - goal.currentAmount
              const daysLeft = calculateDaysRemaining(goal.targetDate)

              return (
                <div key={goal.id} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-3xl mr-3">🎯</span>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {goal.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {goal.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>${goal.currentAmount} saved</span>
                        <span>${goal.targetAmount} target</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                        <div
                          className={`h-3 rounded-full ${getProgressColor(progress)}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{progress.toFixed(0)}% complete</span>
                        <span>{remaining > 0 ? `$${remaining} remaining` : "Goal reached!"}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          Target date: {new Date(goal.targetDate).toLocaleDateString()}
                        </span>
                        <span className={`font-medium ${
                          daysLeft < 0 ? 'text-red-600' :
                          daysLeft < 30 ? 'text-orange-600' : 'text-gray-600'
                        }`}>
                          {daysLeft < 0 ? 'Overdue' :
                           daysLeft === 0 ? 'Today' :
                           `${daysLeft} days left`}
                        </span>
                      </div>
                    </div>

                    {remaining <= 0 && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-800 flex items-center">
                          <span className="mr-2">🎉</span>
                          Congratulations! Goal achieved!
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2 mt-4">
                      <button
                        onClick={() => handleEdit(goal)}
                        className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {goals.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No savings goals yet</h3>
              <p className="text-gray-500 mb-4">
                Set financial goals to motivate your saving journey.
              </p>
              <button
                onClick={handleNew}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Create Your First Goal
              </button>
            </div>
          )}

          {/* Goals Summary */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Goal Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {goals.length}
                  </div>
                  <div className="text-sm text-gray-500">Active Goals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    ${goals.reduce((sum, goal) => sum + goal.targetAmount, 0)}
                  </div>
                  <div className="text-sm text-gray-500">Total Target</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    ${goals.reduce((sum, goal) => sum + goal.currentAmount, 0)}
                  </div>
                  <div className="text-sm text-gray-500">Total Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {goals.filter(goal => goal.currentAmount >= goal.targetAmount).length}
                  </div>
                  <div className="text-sm text-gray-500">Goals Achieved</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
